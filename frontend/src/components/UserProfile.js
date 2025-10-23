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

      setSuccess('Email updated successfully!');
    } catch (err) {
      setError('Failed to update email: ' + (err.response?.data || err.message));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.password !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      await userAPI.updatePassword(user.id, { password: passwordForm.password });
      setPasswordForm({ password: '', confirmPassword: '' });
      setSuccess('Password updated successfully!');
    } catch (err) {
      setError('Failed to update password: ' + (err.response?.data || err.message));
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>My Profile</h2>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <div className="profile-info">
          <h3>Account Information</h3>
          <p><strong>Username:</strong> {user?.username}</p>
          <p><strong>Role:</strong> {
            user?.role === 'ROLE_ADMIN' ? 'Administrator' :
            user?.role === 'ROLE_MANAGER' ? 'Manager' :
            user?.role === 'ROLE_CUSTOMER' ? 'Customer' : 'User'
          }</p>
        </div>

        <div className="profile-section">
          <h3>Change Email</h3>
          <form onSubmit={handleEmailSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={emailForm.email}
                onChange={handleEmailChange}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Update Email
            </button>
          </form>
        </div>

        <div className="profile-section">
          <h3>Change Password</h3>
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="password"
                value={passwordForm.password}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
