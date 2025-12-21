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
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  Chat as ChatIcon,
  SmartToy as AiIcon,
  Storage as StorageIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Description as TemplateIcon,
  MenuBook as KnowledgeIcon
} from '@mui/icons-material';
import { Avatar } from '@mui/material';
import { getProfilePictureUrl } from './services/api';
import './styles/App.css';

const drawerWidth = 280;
const collapsedDrawerWidth = 72;

function Dashboard() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isCustomer = user?.role === 'ROLE_CUSTOMER';
  const isManager = user?.role === 'ROLE_MANAGER';
  const hasKnownRole = isAdmin || isCustomer || isManager;
  const isCustomerOrManager = isCustomer || isManager;
  const [activeTab, setActiveTab] = useState('home');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  const getRoleText = () => {
    if (isAdmin) return '관리자';
    if (isManager) return '매니저';
    if (isCustomer) return '유저';
    return '사용자';
  };

  const renderUnauthorized = () => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2.5,
        p: { xs: 3, md: 5 },
        textAlign: 'center',
      }}
    >
      <Box
        className="glass-surface"
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          maxWidth: 520,
        }}
      >
        <Typography variant="h5" fontWeight={800} color="text.primary" gutterBottom>
          역할이 아직 부여되지 않았습니다.
        </Typography>
        <Typography variant="body1" color="text.secondary">
          관리자의 승인을 받은 후 다시 접속해 주세요. 필요한 경우 프로필 화면에서 정보를 확인할 수 있습니다.
        </Typography>
      </Box>
    </Box>
  );

  const menuItems = [
    { key: 'home', label: '홈', icon: <HomeIcon />, show: true },
    { key: 'users', label: '사용자 관리', icon: <UsersIcon />, show: isAdmin },
    { key: 'companies', label: '회사 관리', icon: <CompanyIcon />, show: isAdmin },
    { key: 'projects', label: '프로젝트 관리', icon: <ProjectIcon />, show: isAdmin },
    { key: 'requests', label: isCustomer ? '서비스 요청 등록' : isManager ? '서비스 요청 처리' : '서비스 요청 관리', icon: <RequestIcon />, show: hasKnownRole },
    { key: 'projectrequests', label: '프로젝트 등록 요청', icon: <ProjectRequestIcon />, show: isCustomer },
    { key: 'myprojects', label: '프로젝트 조회', icon: <MyProjectIcon />, show: isCustomerOrManager },
    { key: 'projectrequestapproval', label: '프로젝트 요청 승인', icon: <ApprovalIcon />, show: isAdmin },
    { key: 'userprojects', label: '사용자별 프로젝트 등록', icon: <MappingIcon />, show: isAdmin },
    { key: 'managerreport', label: '매니저별 월간 처리 현황', icon: <AssessmentIcon />, show: isAdmin },
    { key: 'emailsettings', label: '이메일 서버 설정', icon: <EmailIcon />, show: isAdmin },
    { key: 'emailtemplates', label: '이메일 템플릿 관리', icon: <TemplateIcon />, show: isAdmin },
    { key: 'llmsettings', label: 'LLM 설정', icon: <SettingsIcon />, show: isAdmin },
    { key: 'ragmanagement', label: 'RAG 지식베이스 관리', icon: <KnowledgeIcon />, show: isAdmin },
  ];

  const renderContent = () => {
    if (!hasKnownRole && activeTab !== 'profile') return renderUnauthorized();

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

  const floatingOffset = drawerOpen ? drawerWidth : collapsedDrawerWidth;
  const currentMenu = menuItems.find((item) => item.key === activeTab);

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      <Drawer
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerOpen ? drawerWidth : collapsedDrawerWidth,
            boxSizing: 'border-box',
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
            position: 'fixed',
            height: '100vh',
            zIndex: 1200,
            left: 0,
            top: 0,
            background: drawerOpen
              ? 'linear-gradient(180deg, rgba(11,16,33,0.92), rgba(11,16,33,0.82))'
              : 'linear-gradient(180deg, rgba(11,16,33,0.94), rgba(11,16,33,0.88))',
            color: '#e6e9f5',
            borderRight: '1px solid rgba(255,255,255,0.05)',
          },
        }}
        variant="persistent"
        open={true}
        anchor="left"
        onMouseEnter={() => setDrawerOpen(true)}
        onMouseLeave={() => setDrawerOpen(false)}
      >
        <Box sx={{ overflowY: 'auto', overflowX: 'hidden', mt: 4 }}>
          {/* User Info Section with Fixed Height */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              px: drawerOpen ? 2 : 1,
              minHeight: 80,
              pb: 2,
            }}
          >
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              gap: drawerOpen ? 2 : 0,
              justifyContent: drawerOpen ? 'flex-start' : 'center',
              transition: 'gap 0.3s ease, justify-content 0.3s ease'
            }}>
              <Avatar
                src={getProfilePictureUrl(user?.profilePictureId)}
                sx={{
                  width: drawerOpen ? 56 : 40,
                  height: drawerOpen ? 56 : 40,
                  border: '2px solid',
                  borderColor: 'primary.main',
                  transition: 'width 0.3s ease, height 0.3s ease',
                  flexShrink: 0
                }}
              >
                {!user?.profilePictureId && user?.username?.charAt(0).toUpperCase()}
              </Avatar>
              {drawerOpen && (
                <Box sx={{
                  flex: 1,
                  minWidth: 0,
                  opacity: drawerOpen ? 1 : 0,
                  transition: 'opacity 0.3s ease'
                }}>
                  <Chip
                    label={getRoleText()}
                    color="primary"
                    size="small"
                    sx={{ mb: 0.5, height: 24 }}
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
            </Box>
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
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          bgcolor: 'background.default',
          ml: `${collapsedDrawerWidth}px`,
          transition: 'margin-left 0.3s ease',
          minWidth: 0
        }}
      >
        <Fade in={true} timeout={300} key={activeTab}>
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              minHeight: 0,
              background: 'radial-gradient(circle at 20% 20%, rgba(90,103,255,0.08), transparent 32%), radial-gradient(circle at 80% 0%, rgba(11,212,183,0.12), transparent 28%)',
            }}
          >
            <Box
              sx={{
                maxWidth: 1440,
                mx: 'auto',
                p: { xs: 2, sm: 3, md: 4 },
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                minHeight: '100%',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.4 }}>
                    {isAdmin ? '어드민 콘솔' : isManager ? '매니저 허브' : '서비스 스테이션'}
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="text.primary">
                    {currentMenu?.label ?? '홈'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    최신 디자인 토큰과 유리질 카드 레이아웃으로 통일된 2025년형 UI를 제공합니다.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Chip label={getRoleText()} color="primary" sx={{ fontWeight: 700, px: 0.5 }} />
                  <Chip label={user?.username} variant="outlined" sx={{ borderColor: 'rgba(90,103,255,0.4)' }} />
                </Box>
              </Box>

              <Box className="glass-surface" sx={{ flex: 1, minHeight: 0, p: { xs: 2.5, md: 3.5 }, borderRadius: 4 }}>
                {renderContent()}
              </Box>
            </Box>
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
          left: floatingOffset + 16,
          right: 'auto',
          zIndex: 1000,
          transition: 'left 0.3s ease',
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
            left: floatingOffset + 16,
            right: 'auto',
            m: 0,
            maxHeight: '70vh',
            height: '600px',
            transition: 'left 0.3s ease',
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
