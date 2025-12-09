import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    console.log('AuthContext useEffect - Loading user from localStorage');
    console.log('Raw userData from localStorage:', userData);

    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      console.log('Parsed user data:', parsedUser);
      console.log('ProfilePictureId from parsed user:', parsedUser.profilePictureId);
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    console.log('AuthContext login - userData:', userData);
    console.log('AuthContext login - profilePictureId:', userData.profilePictureId);

    localStorage.setItem('token', token);
    const userString = JSON.stringify(userData);
    console.log('AuthContext login - Stringified user:', userString);
    localStorage.setItem('user', userString);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
