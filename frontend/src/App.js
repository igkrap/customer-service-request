import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import PrivateRoute from './components/PrivateRoute';
import DashboardHome from './components/DashboardHome';
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
  List,
  Typography,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Tooltip,
  Fade
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as RequestIcon,
  PlaylistAddCheck as ProjectRequestIcon,
  Folder as MyProjectIcon,
  CheckCircle as ApprovalIcon,
  People as UsersIcon,
  Business as CompanyIcon,
  Work as ProjectIcon,
  AccountTree as MappingIcon,
  Person as ProfileIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import './styles/App.css';

const drawerWidth = 280;
const collapsedDrawerWidth = 72;

function Dashboard() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isCustomer = user?.role === 'ROLE_CUSTOMER';
  const isManager = user?.role === 'ROLE_MANAGER';
  const isCustomerOrManager = isCustomer || isManager;
  const [activeTab, setActiveTab] = useState('home');
  const [drawerOpen, setDrawerOpen] = useState(true);

  const getRoleText = () => {
    if (isAdmin) return '관리자';
    if (isManager) return '매니저';
    if (isCustomer) return '유저';
    return '사용자';
  };

  const menuItems = [
    { key: 'home', label: '대시보드 홈', icon: <DashboardIcon />, show: true },
    { key: 'requests', label: '서비스 요청 관리', icon: <RequestIcon />, show: true },
    { key: 'projectrequests', label: '프로젝트 등록 요청', icon: <ProjectRequestIcon />, show: isCustomer },
    { key: 'myprojects', label: '내 프로젝트', icon: <MyProjectIcon />, show: isCustomerOrManager },
    { key: 'projectrequestapproval', label: '프로젝트 요청 승인', icon: <ApprovalIcon />, show: isAdmin },
    { key: 'users', label: '사용자 관리', icon: <UsersIcon />, show: isAdmin },
    { key: 'companies', label: '회사 관리', icon: <CompanyIcon />, show: isAdmin },
    { key: 'projects', label: '프로젝트 관리', icon: <ProjectIcon />, show: isAdmin },
    { key: 'userprojects', label: '사용자별 프로젝트 등록', icon: <MappingIcon />, show: isAdmin },
  ];

  const renderContent = () => {
    if (activeTab === 'home') return <DashboardHome />;
    if (activeTab === 'requests') return <ServiceRequestList />;
    if (activeTab === 'projectrequests' && isCustomer) return <ProjectRequestList />;
    if (activeTab === 'myprojects' && isCustomerOrManager) return <MyProjectList />;
    if (activeTab === 'projectrequestapproval' && isAdmin) return <ProjectRequestApproval />;
    if (activeTab === 'users' && isAdmin) return <UserList />;
    if (activeTab === 'companies' && isAdmin) return <CompanyList />;
    if (activeTab === 'projects' && isAdmin) return <ProjectList />;
    if (activeTab === 'userprojects' && isAdmin) return <AdminProjectMapping />;
    if (activeTab === 'profile') return <UserProfile />;
    return null;
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 1,
          width: `calc(100% - ${drawerOpen ? drawerWidth : collapsedDrawerWidth}px)`,
          height: '100%',
          overflow: 'auto',
          transition: 'width 0.3s ease'
        }}
      >
        <Fade in={true} timeout={300} key={activeTab}>
          <Box sx={{ height: '100%' }}>
            {renderContent()}
          </Box>
        </Fade>
      </Box>

      <Drawer
        sx={{
          width: drawerOpen ? drawerWidth : collapsedDrawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerOpen ? drawerWidth : collapsedDrawerWidth,
            boxSizing: 'border-box',
            transition: 'width 0.3s ease',
            overflowX: 'hidden'
          },
        }}
        variant="permanent"
        anchor="right"
      >
        <Box sx={{ overflow: 'auto', mt: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: drawerOpen ? 'space-between' : 'center', alignItems: 'center', px: drawerOpen ? 2 : 1, pb: 2 }}>
            {drawerOpen && (
              <Box>
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
            )}
            <Tooltip title={drawerOpen ? "사이드바 접기" : "사이드바 펼치기"} placement="left">
              <IconButton onClick={() => setDrawerOpen(!drawerOpen)} size="small">
                {drawerOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
              </IconButton>
            </Tooltip>
          </Box>
          <Divider />
          <List>
            {menuItems.filter(item => item.show).map((item) => (
              <ListItem key={item.key} disablePadding>
                <Tooltip title={!drawerOpen ? item.label : ""} placement="left">
                  <ListItemButton
                    selected={activeTab === item.key}
                    onClick={() => setActiveTab(item.key)}
                    sx={{
                      justifyContent: drawerOpen ? 'initial' : 'center',
                      px: drawerOpen ? 2.5 : 1.5,
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
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: drawerOpen ? 3 : 'auto',
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {drawerOpen && <ListItemText primary={item.label} />}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem disablePadding>
              <Tooltip title={!drawerOpen ? "내 프로필" : ""} placement="left">
                <ListItemButton
                  selected={activeTab === 'profile'}
                  onClick={() => setActiveTab('profile')}
                  sx={{
                    justifyContent: drawerOpen ? 'initial' : 'center',
                    px: drawerOpen ? 2.5 : 1.5,
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
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: drawerOpen ? 3 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    <ProfileIcon />
                  </ListItemIcon>
                  {drawerOpen && <ListItemText primary="내 프로필" />}
                </ListItemButton>
              </Tooltip>
            </ListItem>
            <ListItem disablePadding>
              <Tooltip title={!drawerOpen ? "로그아웃" : ""} placement="left">
                <ListItemButton
                  onClick={logout}
                  sx={{
                    justifyContent: drawerOpen ? 'initial' : 'center',
                    px: drawerOpen ? 2.5 : 1.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: drawerOpen ? 3 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    <LogoutIcon />
                  </ListItemIcon>
                  {drawerOpen && <ListItemText primary="로그아웃" />}
                </ListItemButton>
              </Tooltip>
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
