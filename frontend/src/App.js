import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import PrivateRoute from './components/PrivateRoute';
import ServiceRequestList from './components/ServiceRequestList';
import UserList from './components/UserList';
import UserProfile from './components/UserProfile';
import CompanyList from './components/CompanyList';
import ProjectList from './components/ProjectList';
import MyProjectList from './components/MyProjectList';
import AdminProjectMapping from './components/AdminProjectMapping';
import ProjectRequestList from './components/ProjectRequestList';
import ProjectRequestApproval from './components/ProjectRequestApproval';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import {
  Assignment as RequestIcon,
  PlaylistAddCheck as ProjectRequestIcon,
  Folder as MyProjectIcon,
  CheckCircle as ApprovalIcon,
  People as UsersIcon,
  Business as CompanyIcon,
  Work as ProjectIcon,
  AccountTree as MappingIcon,
  Person as ProfileIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import './styles/App.css';

const drawerWidth = 280;

function Dashboard() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isCustomer = user?.role === 'ROLE_CUSTOMER';
  const isManager = user?.role === 'ROLE_MANAGER';
  const isCustomerOrManager = isCustomer || isManager;
  const [activeTab, setActiveTab] = useState('requests');

  const getRoleText = () => {
    if (isAdmin) return '관리자';
    if (isManager) return '매니저';
    if (isCustomer) return '고객';
    return '사용자';
  };

  const menuItems = [
    { key: 'requests', label: '서비스 요청', icon: <RequestIcon />, show: true },
    { key: 'projectrequests', label: '프로젝트 등록 요청', icon: <ProjectRequestIcon />, show: isCustomer },
    { key: 'myprojects', label: '내 프로젝트', icon: <MyProjectIcon />, show: isCustomerOrManager },
    { key: 'projectrequestapproval', label: '프로젝트 요청 승인', icon: <ApprovalIcon />, show: isAdmin },
    { key: 'users', label: '사용자 관리', icon: <UsersIcon />, show: isAdmin },
    { key: 'companies', label: '회사 관리', icon: <CompanyIcon />, show: isAdmin },
    { key: 'projects', label: '프로젝트 관리', icon: <ProjectIcon />, show: isAdmin },
    { key: 'userprojects', label: '사용자-프로젝트 매핑', icon: <MappingIcon />, show: isAdmin },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          mr: `${drawerWidth}px`,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            서비스 요청 관리 시스템
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              {user?.username} ({getRoleText()})
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - ${drawerWidth}px)`,
          mt: 8
        }}
      >
        {activeTab === 'requests' && <ServiceRequestList />}
        {activeTab === 'projectrequests' && isCustomer && <ProjectRequestList />}
        {activeTab === 'myprojects' && isCustomerOrManager && <MyProjectList />}
        {activeTab === 'projectrequestapproval' && isAdmin && <ProjectRequestApproval />}
        {activeTab === 'users' && isAdmin && <UserList />}
        {activeTab === 'companies' && isAdmin && <CompanyList />}
        {activeTab === 'projects' && isAdmin && <ProjectList />}
        {activeTab === 'userprojects' && isAdmin && <AdminProjectMapping />}
        {activeTab === 'profile' && <UserProfile />}
      </Box>

      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="permanent"
        anchor="right"
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <Box sx={{ px: 2, pb: 2 }}>
            <Chip
              label={getRoleText()}
              color="primary"
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" display="block" color="text.secondary">
              환영합니다, {user?.username}님
            </Typography>
          </Box>
          <Divider />
          <List>
            {menuItems.filter(item => item.show).map((item) => (
              <ListItem key={item.key} disablePadding>
                <ListItemButton
                  selected={activeTab === item.key}
                  onClick={() => setActiveTab(item.key)}
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'primary.contrastText',
                      },
                    },
                  }}
                >
                  <ListItemIcon>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem disablePadding>
              <ListItemButton
                selected={activeTab === 'profile'}
                onClick={() => setActiveTab('profile')}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    },
                  },
                }}
              >
                <ListItemIcon>
                  <ProfileIcon />
                </ListItemIcon>
                <ListItemText primary="내 프로필" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={logout}>
                <ListItemIcon>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="로그아웃" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </Box>
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
