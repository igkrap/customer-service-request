import React, { useState } from 'react';
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
    <div className="container">
      <div className="card">
        <h2>내 프로필</h2>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div className="profile-info">
          <h3>계정 정보</h3>
          <p><strong>사용자명:</strong> {user?.username}</p>
          <p><strong>역할:</strong> {
            user?.role === 'ROLE_ADMIN' ? '관리자' :
            user?.role === 'ROLE_MANAGER' ? '매니저' :
            user?.role === 'ROLE_CUSTOMER' ? '고객' : '사용자'
          }</p>
        </div>

        <div className="profile-section">
          <h3>이메일 변경</h3>
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
          <h3>비밀번호 변경</h3>
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
      </div>
    </div>
  );
}

export default UserProfile;
