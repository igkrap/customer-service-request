import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './components/AuthPage';
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
import ManagerMonthlyReport from './components/ManagerMonthlyReport';
import EmailSettings from './components/EmailSettings';
import EmailTemplates from './components/EmailTemplates';
import ChatBot from './components/ChatBot';
import LlmSettings from './components/LlmSettings';
import RagManagement from './components/RagManagement';
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
  Fade,
  Fab,
  Dialog,
  DialogContent,
  DialogTitle
} from '@mui/material';
import {
  Home as HomeIcon,
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
  ChevronRight as ChevronRightIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Chat as ChatIcon,
  SmartToy as AiIcon,
  Storage as StorageIcon,
  Close as CloseIcon
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
  const [chatbotOpen, setChatbotOpen] = useState(false);

  const getRoleText = () => {
    if (isAdmin) return '관리자';
    if (isManager) return '매니저';
    if (isCustomer) return '유저';
    return '사용자';
  };

  const menuItems = [
    { key: 'home', label: '홈', icon: <HomeIcon />, show: true },
    { key: 'users', label: '사용자 관리', icon: <UsersIcon />, show: isAdmin },
    { key: 'companies', label: '회사 관리', icon: <CompanyIcon />, show: isAdmin },
    { key: 'projects', label: '프로젝트 관리', icon: <ProjectIcon />, show: isAdmin },
    { key: 'requests', label: isCustomer ? '서비스 요청 등록' : isManager ? '서비스 요청 처리' : '서비스 요청 관리', icon: <RequestIcon />, show: true },
    { key: 'projectrequests', label: '프로젝트 등록 요청', icon: <ProjectRequestIcon />, show: isCustomer },
    { key: 'myprojects', label: '프로젝트 조회', icon: <MyProjectIcon />, show: isCustomerOrManager },
    { key: 'projectrequestapproval', label: '프로젝트 요청 승인', icon: <ApprovalIcon />, show: isAdmin },
    { key: 'userprojects', label: '사용자별 프로젝트 등록', icon: <MappingIcon />, show: isAdmin },
    { key: 'managerreport', label: '매니저별 월간 처리 현황', icon: <AssessmentIcon />, show: isAdmin },
    { key: 'emailsettings', label: '이메일 서버 설정', icon: <SettingsIcon />, show: isAdmin },
    { key: 'emailtemplates', label: '이메일 템플릿 관리', icon: <SettingsIcon />, show: isAdmin },
    { key: 'llmsettings', label: 'LLM 설정', icon: <AiIcon />, show: isAdmin },
    { key: 'ragmanagement', label: 'RAG 지식베이스 관리', icon: <StorageIcon />, show: isAdmin },
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
    if (activeTab === 'managerreport' && isAdmin) return <ManagerMonthlyReport />;
    if (activeTab === 'emailsettings' && isAdmin) return <EmailSettings />;
    if (activeTab === 'emailtemplates' && isAdmin) return <EmailTemplates />;
    if (activeTab === 'llmsettings' && isAdmin) return <LlmSettings />;
    if (activeTab === 'ragmanagement' && isAdmin) return <RagManagement />;
    if (activeTab === 'profile') return <UserProfile />;
    return null;
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
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
        anchor="left"
      >
        <Box sx={{ overflow: 'auto', mt: 4 }}>
          {/* User Info Section with Fixed Height */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: drawerOpen ? 'space-between' : 'center',
              alignItems: 'center',
              px: drawerOpen ? 2 : 1,
              minHeight: 80, // Fixed height
              pb: 2
            }}
          >
            {drawerOpen && (
              <Box sx={{ minHeight: 56 }}> {/* Fixed height for user info */}
                <Chip
                  label={getRoleText()}
                  color="primary"
                  size="small"
                  sx={{ mb: 1, height: 24 }}
                />
                <Typography
                  variant="caption"
                  display="block"
                  color="text.secondary"
                  sx={{
                    lineHeight: '16px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  환영합니다, {user?.username}님
                </Typography>
              </Box>
            )}
            <Tooltip title={drawerOpen ? "사이드바 접기" : "사이드바 펼치기"} placement="right">
              <IconButton
                onClick={() => setDrawerOpen(!drawerOpen)}
                size="small"
                sx={{ minHeight: 40, minWidth: 40 }} // Fixed button size
              >
                {drawerOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </IconButton>
            </Tooltip>
          </Box>
          <Divider />
          <List>
            {menuItems.filter(item => item.show).map((item) => (
              <ListItem key={item.key} disablePadding>
                <Tooltip title={!drawerOpen ? item.label : ""} placement="right">
                  <ListItemButton
                    selected={activeTab === item.key}
                    onClick={() => setActiveTab(item.key)}
                    sx={{
                      height: 48, // Fixed height
                      px: 2.5,
                      display: 'flex',
                      alignItems: 'center',
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
                        minWidth: 40, // Fixed width
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {drawerOpen && (
                      <ListItemText
                        primary={item.label}
                        sx={{
                          ml: 1,
                          '& .MuiTypography-root': {
                            lineHeight: '24px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}
          </List>
          <Divider />
          <List>
            <ListItem disablePadding>
              <Tooltip title={!drawerOpen ? "로그아웃" : ""} placement="right">
                <ListItemButton
                  onClick={logout}
                  sx={{
                    height: 48, // Fixed height
                    px: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40, // Fixed width
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <LogoutIcon />
                  </ListItemIcon>
                  {drawerOpen && (
                    <ListItemText
                      primary="로그아웃"
                      sx={{
                        ml: 1,
                        '& .MuiTypography-root': {
                          lineHeight: '24px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          </List>
        </Box>
      </Drawer>

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

      {/* Floating Chatbot Button */}
      <Fab
        color="primary"
        aria-label="chatbot"
        onClick={() => setChatbotOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <ChatIcon />
      </Fab>

      {/* Chatbot Dialog */}
      <Dialog
        open={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            position: 'fixed',
            bottom: 24,
            right: 24,
            m: 0,
            maxHeight: '70vh',
            height: '600px',
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'primary.main',
            color: 'white',
            py: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AiIcon />
            <Typography variant="h6">AI 챗봇</Typography>
          </Box>
          <IconButton
            onClick={() => setChatbotOpen(false)}
            size="small"
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <ChatBot />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<Navigate to="/login" />} />
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
