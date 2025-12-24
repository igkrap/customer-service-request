import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import '../styles/Auth.css';

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loginData, setLoginData] = useState({
    userId: '',
    password: ''
  });
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [registerData, setRegisterData] = useState({
    userId: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLoginChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleRegisterChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const validateRegisterForm = () => {
    if (registerData.userId.length < 3) {
      setError('사용자 ID는 최소 3자 이상이어야 합니다');
      return false;
    }
    if (registerData.username.length < 1) {
      setError('사용자명을 입력하세요');
      return false;
    }
    if (registerData.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다');
      return false;
    }
    if (registerData.password !== registerData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerData.email)) {
      setError('유효한 이메일 주소를 입력하세요');
      return false;
    }
    return true;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(loginData);
      const { token, id, userId, username, email, role, profilePictureId } = response.data;

      login({ id, userId, username, email, role, profilePictureId }, token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data || '로그인에 실패했습니다. 자격 증명을 확인하세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateRegisterForm()) {
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...signupData } = registerData;
      const response = await authAPI.signup(signupData);
      const { token, id, username, email, role } = response.data;

      if (!token) {
        alert('회원가입이 완료되었습니다! 관리자의 승인 대기 중입니다. 승인 후 로그인하실 수 있습니다.');
        setIsLogin(true);
        setRegisterData({
          userId: '',
          username: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
      } else {
        login({ id, username, email, role }, token);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data || '회원가입에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setShowLoginPassword(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <h1 className="welcome-text">환영합니다.</h1>
      </div>
      <div className="auth-right">
        <div className={`auth-card-wrapper ${isLogin ? '' : 'flipped'}`}>
          {/* Login Form */}
          <div className={`auth-card auth-card-front ${isLogin ? 'active' : ''}`}>
            <h2>로그인</h2>
            <form onSubmit={handleLoginSubmit}>
              {error && isLogin && <div className="error-message">{error}</div>}

              <div className="form-group">
                <label htmlFor="login-userId">사용자 ID</label>
                <input
                  type="text"
                  id="login-userId"
                  name="userId"
                  value={loginData.userId}
                  onChange={handleLoginChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="login-password">비밀번호</label>
                <div className="password-field">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    id="login-password"
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    aria-pressed={showLoginPassword}
                    aria-label={showLoginPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                    disabled={loading}
                  >
                    {showLoginPassword ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M2.1 12c2.2-4.3 6.2-7 9.9-7s7.7 2.7 9.9 7c-2.2 4.3-6.2 7-9.9 7s-7.7-2.7-9.9-7zm9.9 4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0-2.2a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M2.1 12c2.2-4.3 6.2-7 9.9-7 2 0 4 0.7 5.8 1.9l-1.6 1.6A7.8 7.8 0 0 0 12 7.5c-3 0-5.8 1.9-7.6 4.5 0.9 1.3 2.1 2.4 3.5 3.2l-1.4 1.4A11 11 0 0 1 2.1 12zm18.5 6.4-2.2-2.2A9.7 9.7 0 0 1 12 19c-3.7 0-7.7-2.7-9.9-7 1-1.9 2.4-3.5 4-4.7L3.4 5.7l1.4-1.4 17.2 17.2-1.4 1.4zm-6.3-6.3-1.6-1.6a2.3 2.3 0 0 1 1.6 1.6zm-4.2-4.2-1.6-1.6a4.5 4.5 0 0 1 6.2 6.2l-1.6-1.6a2.3 2.3 0 0 0-3-3z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? '로그인 중...' : '로그인'}
              </button>

              <p className="auth-link">
                계정이 없으신가요?{' '}
                <button type="button" onClick={toggleMode} className="link-button">
                  회원가입
                </button>
              </p>
            </form>
          </div>

          {/* Register Form */}
          <div className={`auth-card auth-card-back ${!isLogin ? 'active' : ''}`}>
            <h2>회원가입</h2>
            <form onSubmit={handleRegisterSubmit}>
              {error && !isLogin && <div className="error-message">{error}</div>}

              <div className="form-group">
                <label htmlFor="register-userId">사용자 ID (로그인용)</label>
                <input
                  type="text"
                  id="register-userId"
                  name="userId"
                  value={registerData.userId}
                  onChange={handleRegisterChange}
                  required
                  minLength="3"
                  maxLength="50"
                  disabled={loading}
                  placeholder="영문, 숫자로 구성된 ID"
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-username">사용자명</label>
                <input
                  type="text"
                  id="register-username"
                  name="username"
                  value={registerData.username}
                  onChange={handleRegisterChange}
                  required
                  minLength="1"
                  maxLength="50"
                  disabled={loading}
                  placeholder="화면에 표시될 이름"
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-email">이메일</label>
                <input
                  type="email"
                  id="register-email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-password">비밀번호</label>
                <input
                  type="password"
                  id="register-password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  required
                  minLength="6"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="register-confirmPassword">비밀번호 확인</label>
                <input
                  type="password"
                  id="register-confirmPassword"
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  required
                  minLength="6"
                  disabled={loading}
                />
              </div>

              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? '가입 중...' : '회원가입'}
              </button>

              <p className="auth-link">
                이미 계정이 있으신가요?{' '}
                <button type="button" onClick={toggleMode} className="link-button">
                  로그인
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
