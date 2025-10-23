import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import PrivateRoute from './components/PrivateRoute';
import ServiceRequestList from './components/ServiceRequestList';
import UserList from './components/UserList';
import UserProfile from './components/UserProfile';
import './styles/App.css';

function Dashboard() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const [activeTab, setActiveTab] = useState('requests');

  return (
    <div className="App">
      <header className="header">
        <h1>Service Request Management System</h1>
        <div className="header-controls">
          <nav className="nav">
            <button
              className={activeTab === 'requests' ? 'active' : ''}
              onClick={() => setActiveTab('requests')}
            >
              Service Requests
            </button>
            {isAdmin && (
              <button
                className={activeTab === 'users' ? 'active' : ''}
                onClick={() => setActiveTab('users')}
              >
                User Management
              </button>
            )}
            <button
              className={activeTab === 'profile' ? 'active' : ''}
              onClick={() => setActiveTab('profile')}
            >
              My Profile
            </button>
          </nav>
          <div className="user-info">
            <span>Welcome, {user?.username} ({isAdmin ? 'Admin' : 'User'})</span>
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main>
        {activeTab === 'requests' && <ServiceRequestList />}
        {activeTab === 'users' && isAdmin && <UserList />}
        {activeTab === 'profile' && <UserProfile />}
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
