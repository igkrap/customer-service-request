import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  Chip,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Business as BusinessIcon,
  Badge as BadgeIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function UserProfile() {
  const { user, updateUser } = useAuth();
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [emailForm, setEmailForm] = useState({
    email: user?.email || ''
  });
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleEmailChange = (e) => {
    setEmailForm({ email: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
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

  const getRoleInfo = () => {
    switch (user?.role) {
      case 'ROLE_ADMIN':
        return { label: '관리자', color: 'error' };
      case 'ROLE_MANAGER':
        return { label: '매니저', color: 'primary' };
      case 'ROLE_CUSTOMER':
        return { label: '유저', color: 'secondary' };
      default:
        return { label: '사용자', color: 'default' };
    }
  };

  const roleInfo = getRoleInfo();

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <Box sx={{ p: 1, height: '100%', overflow: 'auto' }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h5" component="h2" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon /> 내 프로필
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

        <Grid container spacing={3}>
          {/* Profile Info Card */}
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    fontSize: 48,
                    bgcolor: roleInfo.color === 'error' ? 'error.main' :
                             roleInfo.color === 'primary' ? 'primary.main' :
                             roleInfo.color === 'secondary' ? 'secondary.main' : 'grey.500'
                  }}
                >
                  {getInitials(user?.username)}
                </Avatar>
                <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                  {user?.username}
                </Typography>
                <Chip
                  label={roleInfo.label}
                  color={roleInfo.color}
                  sx={{ mb: 3 }}
                />
                <Divider sx={{ my: 2 }} />
                <Box sx={{ textAlign: 'left', px: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <BadgeIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        사용자 ID
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {user?.userId}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <EmailIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        이메일
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {user?.email}
                      </Typography>
                    </Box>
                  </Box>
                  {user?.companyName && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          회사
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {user.companyName}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Settings Cards */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              {/* Email Update Card */}
              <Grid item xs={12}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon color="primary" />
                      이메일 변경
                    </Typography>
                    <form onSubmit={handleEmailSubmit}>
                      <TextField
                        fullWidth
                        type="email"
                        label="이메일 주소"
                        value={emailForm.email}
                        onChange={handleEmailChange}
                        required
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 3 }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                      >
                        이메일 업데이트
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </Grid>

              {/* Password Update Card */}
              <Grid item xs={12}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LockIcon color="primary" />
                      비밀번호 변경
                    </Typography>
                    <form onSubmit={handlePasswordSubmit}>
                      <TextField
                        fullWidth
                        type={showPassword ? 'text' : 'password'}
                        label="새 비밀번호"
                        name="password"
                        value={passwordForm.password}
                        onChange={handlePasswordChange}
                        required
                        placeholder="최소 6자 이상"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                              >
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 2 }}
                      />
                      <TextField
                        fullWidth
                        type={showConfirmPassword ? 'text' : 'password'}
                        label="새 비밀번호 확인"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        placeholder="비밀번호 재입력"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockIcon color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                edge="end"
                              >
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 3 }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                      >
                        비밀번호 업데이트
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default UserProfile;
