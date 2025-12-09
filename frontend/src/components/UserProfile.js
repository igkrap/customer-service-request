import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  TextField,
  Button,
  IconButton,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Grid
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  CameraAlt as CameraAltIcon
} from '@mui/icons-material';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function UserProfile({ onBack }) {
  const { user, updateUser } = useAuth();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [usernameForm, setUsernameForm] = useState({
    username: user?.username || ''
  });
  const [emailForm, setEmailForm] = useState({
    email: user?.email || ''
  });
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(user?.profilePictureUrl || null);

  const handleUsernameChange = (e) => {
    setUsernameForm({ username: e.target.value });
  };

  const handleEmailChange = (e) => {
    setEmailForm({ email: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
  };

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      // Note: 사용자명 변경 API가 구현되어 있다면 여기서 호출
      // 현재는 이메일/비밀번호만 변경 가능하므로 안내 메시지 표시
      setError('사용자명 변경은 관리자에게 문의하세요');
    } catch (err) {
      setError('사용자명 업데이트 실패: ' + (err.response?.data || err.message));
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      await userAPI.updateEmail(user.id, { email: emailForm.email });

      // Update user in context
      const updatedUser = { ...user, email: emailForm.email };
      updateUser(updatedUser);

      setSuccess('이메일이 성공적으로 업데이트되었습니다!');
    } catch (err) {
      setError('이메일 업데이트 실패: ' + (err.response?.data || err.message));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return;
    }

    if (passwordForm.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      await userAPI.updatePassword(user.id, { password: passwordForm.password });
      setPasswordForm({ password: '', confirmPassword: '' });
      setSuccess('비밀번호가 성공적으로 업데이트되었습니다!');
    } catch (err) {
      setError('비밀번호 업데이트 실패: ' + (err.response?.data || err.message));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드 가능합니다');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('파일 크기는 5MB를 초과할 수 없습니다');
        return;
      }

      setSelectedFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfilePictureSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('업로드할 파일을 선택하세요');
      return;
    }

    try {
      setError(null);
      setSuccess(null);

      const response = await userAPI.updateProfilePicture(user.id, selectedFile);

      // Update user in context with new profile picture URL
      const updatedUser = { ...user, profilePictureUrl: response.data.profilePictureUrl };
      updateUser(updatedUser);

      setSelectedFile(null);
      setSuccess('프로필 사진이 성공적으로 업데이트되었습니다!');
    } catch (err) {
      setError('프로필 사진 업데이트 실패: ' + (err.response?.data || err.message));
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {onBack && (
            <IconButton onClick={onBack} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            프로필 정보 변경
          </Typography>
        </Box>
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* 프로필 사진 + 정보 변경 타일 */}
      <Grid container spacing={2} direction="column">
        {/* 프로필 사진 변경 타일 */}
        <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
          <Card elevation={3} sx={{ width: '100%' }}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}><CameraAltIcon /></Avatar>}
              title="프로필 사진 변경"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <form onSubmit={handleProfilePictureSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    src={previewUrl}
                    sx={{
                      width: 120,
                      height: 120,
                      mb: 2,
                      border: '3px solid',
                      borderColor: 'primary.main'
                    }}
                  >
                    {!previewUrl && user?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profile-picture-upload"
                    type="file"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="profile-picture-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CameraAltIcon />}
                    >
                      사진 선택
                    </Button>
                  </label>
                  {selectedFile && (
                    <Typography variant="caption" sx={{ mt: 1 }}>
                      선택된 파일: {selectedFile.name}
                    </Typography>
                  )}
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={!selectedFile}
                >
                  프로필 사진 업데이트
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* 사용자명 변경 타일 */}
        <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
          <Card elevation={3} sx={{ width: '100%' }}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><PersonIcon /></Avatar>}
              title="사용자명 변경"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <form onSubmit={handleUsernameSubmit}>
                <TextField
                  fullWidth
                  label="사용자명"
                  value={usernameForm.username}
                  onChange={handleUsernameChange}
                  disabled
                  helperText="사용자명 변경은 관리자에게 문의하세요"
                  sx={{ mb: 2 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled
                >
                  사용자명 업데이트
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* 이메일 변경 타일 */}
        <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
          <Card elevation={3} sx={{ width: '100%' }}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: 'info.main' }}><EmailIcon /></Avatar>}
              title="이메일 변경"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <form onSubmit={handleEmailSubmit}>
                <TextField
                  fullWidth
                  type="email"
                  label="이메일 주소"
                  value={emailForm.email}
                  onChange={handleEmailChange}
                  required
                  sx={{ mb: 2 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                >
                  이메일 업데이트
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* 비밀번호 변경 타일 */}
        <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
          <Card elevation={3} sx={{ width: '100%' }}>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: 'success.main' }}><LockIcon /></Avatar>}
              title="비밀번호 변경"
              titleTypographyProps={{ variant: 'h6' }}
            />
            <CardContent>
              <form onSubmit={handlePasswordSubmit}>
                <TextField
                  fullWidth
                  type="password"
                  label="새 비밀번호"
                  name="password"
                  value={passwordForm.password}
                  onChange={handlePasswordChange}
                  placeholder="최소 6자 이상"
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="password"
                  label="새 비밀번호 확인"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="비밀번호 재입력"
                  required
                  sx={{ mb: 2 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                >
                  비밀번호 업데이트
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Box>
    </Box>
  );
}

export default UserProfile;
