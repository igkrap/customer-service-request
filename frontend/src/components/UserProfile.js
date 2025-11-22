import React, { useState } from 'react';
import { Box, Paper, Typography, Alert } from '@mui/material';
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

  return (
    <Box sx={{ p: 1, height: '100%' }}>
      <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
          내 프로필
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <div className="profile-info">
          <Typography variant="h6" sx={{ mb: 2 }}>계정 정보</Typography>
          <p><strong>사용자명:</strong> {user?.username}</p>
          <p><strong>역할:</strong> {
            user?.role === 'ROLE_ADMIN' ? '관리자' :
            user?.role === 'ROLE_MANAGER' ? '매니저' :
            user?.role === 'ROLE_CUSTOMER' ? '유저' : '사용자'
          }</p>
        </div>

        <div className="profile-section">
          <Typography variant="h6" sx={{ mb: 2 }}>이메일 변경</Typography>
          <form onSubmit={handleEmailSubmit}>
            <div className="form-group">
              <label>이메일 주소</label>
              <input
                type="email"
                value={emailForm.email}
                onChange={handleEmailChange}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              이메일 업데이트
            </button>
          </form>
        </div>

        <div className="profile-section">
          <Typography variant="h6" sx={{ mb: 2 }}>비밀번호 변경</Typography>
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label>새 비밀번호</label>
              <input
                type="password"
                name="password"
                value={passwordForm.password}
                onChange={handlePasswordChange}
                placeholder="새 비밀번호 입력"
                required
              />
            </div>
            <div className="form-group">
              <label>새 비밀번호 확인</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="새 비밀번호 확인"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              비밀번호 업데이트
            </button>
          </form>
        </div>
      </Paper>
    </Box>
  );
}

export default UserProfile;
