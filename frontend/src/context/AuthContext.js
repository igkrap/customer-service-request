import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const authExpired = localStorage.getItem('auth-expired');

    if (authExpired && token) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('auth-expired');
    } else if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);

    // Listen for auth expiry events from API interceptor
    const handleAuthExpired = (event) => {
      // Optional: show alert message
      if (event.detail?.message) {
        alert(event.detail.message);
      }
    };

    window.addEventListener('auth-expired', handleAuthExpired);

    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired);
    };
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.removeItem('auth-expired');
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth-expired');
    setUser(null);
  };

  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const value = {
    user,
    login,
    logout,
    updateUser,
    isAuthenticated,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
