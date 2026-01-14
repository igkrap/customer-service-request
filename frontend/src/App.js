import React, { useEffect, useState } from 'react';
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
import ManagerMonthlyReport from './components/ManagerMonthlyReport';
import EmailSettings from './components/EmailSettings';
import EmailTemplates from './components/EmailTemplates';
import ChatBot from './components/ChatBot';
import LlmSettings from './components/LlmSettings';
import RagManagement from './components/RagManagement';
import AnnualManagerPerformance from './components/AnnualManagerPerformance';
import CompanyPerformance from './components/CompanyPerformance';
import OverallPerformance from './components/OverallPerformance';
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
  DialogTitle,
  Snackbar,
  Alert,
  Badge,
  ListSubheader
} from '@mui/material';
import {
  Home as HomeIcon,
  Assignment as RequestIcon,
  Folder as MyProjectIcon,
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
  MenuBook as KnowledgeIcon,
  Notifications as NotificationsIcon,
  Timeline as TimelineIcon,
  Business as BusinessReportIcon,
  Insights as InsightsIcon
} from '@mui/icons-material';
import { Avatar } from '@mui/material';
import { getProfilePictureUrl, getWebSocketUrl } from './services/api';
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
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
  });
  const [notificationList, setNotificationList] = useState([]);

  const getNotificationTypeMeta = (type) => {
    switch (type) {
      case 'SERVICE_REQUEST_CREATED':
        return { label: '신규 요청', color: 'primary' };
      case 'SERVICE_REQUEST_STATUS_UPDATED':
        return { label: '상태 변경', color: 'info' };
      case 'MANAGER_ASSIGNED':
        return { label: '담당자 배정', color: 'success' };
      default:
        return { label: '알림', color: 'default' };
    }
  };

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
        gap: 2,
        p: 3,
        textAlign: 'center',
      }}
    >
      <Typography variant="h5" fontWeight={700} color="text.primary">
        역할이 아직 부여되지 않았습니다.
      </Typography>
      <Typography variant="body1" color="text.secondary">
        관리자의 승인을 받은 후 다시 접속해 주세요. 필요한 경우 프로필 화면에서 정보를 확인할 수 있습니다.
      </Typography>
    </Box>
  );

  const menuGroups = [
    {
      label: '기본 메뉴',
      shortLabel: '기본',
      items: [
        { key: 'home', label: '홈', icon: <HomeIcon />, show: true },
        {
          key: 'requests',
          label: isCustomer ? '서비스 요청 등록' : isManager ? '서비스 요청 처리' : '서비스 요청 관리',
          icon: <RequestIcon />,
          show: hasKnownRole
        },
        { key: 'myprojects', label: '프로젝트 조회', icon: <MyProjectIcon />, show: isCustomerOrManager }
      ]
    },
    {
      label: '기준 정보',
      shortLabel: '기준',
      items: [
        { key: 'users', label: '사용자 관리', icon: <UsersIcon />, show: isAdmin },
        { key: 'companies', label: '회사 관리', icon: <CompanyIcon />, show: isAdmin },
        { key: 'projects', label: '프로젝트 관리', icon: <ProjectIcon />, show: isAdmin },
        { key: 'userprojects', label: '사용자별 프로젝트 등록', icon: <MappingIcon />, show: isAdmin }
      ]
    },
    {
      label: '실적 현황',
      shortLabel: '실적',
      items: [
        { key: 'managerreport', label: '월간 매니저별 실적 현황', icon: <AssessmentIcon />, show: isAdmin },
        { key: 'annualmanagerperformance', label: '연간 매니저별 실적 현황', icon: <TimelineIcon />, show: isAdmin },
        { key: 'companyperformance', label: '회사별 실적 현황', icon: <BusinessReportIcon />, show: isAdmin },
        { key: 'overallperformance', label: '전체 실적 처리 현황', icon: <InsightsIcon />, show: isAdmin }
      ]
    },
    {
      label: '시스템 설정',
      shortLabel: '설정',
      items: [
        { key: 'emailsettings', label: '이메일 서버 설정', icon: <EmailIcon />, show: isAdmin },
        { key: 'emailtemplates', label: '이메일 템플릿 관리', icon: <TemplateIcon />, show: isAdmin },
        { key: 'llmsettings', label: 'LLM 설정', icon: <SettingsIcon />, show: isAdmin },
        { key: 'ragmanagement', label: 'RAG 지식베이스 관리', icon: <KnowledgeIcon />, show: isAdmin }
      ]
    }
  ];

  const renderContent = () => {
    if (!hasKnownRole && activeTab !== 'profile') return renderUnauthorized();

    if (activeTab === 'home') return <DashboardHome />;
    if (activeTab === 'requests') return <ServiceRequestList />;
    if (activeTab === 'myprojects' && isCustomerOrManager) return <MyProjectList />;
    if (activeTab === 'users' && isAdmin) return <UserList />;
    if (activeTab === 'companies' && isAdmin) return <CompanyList />;
    if (activeTab === 'projects' && isAdmin) return <ProjectList />;
    if (activeTab === 'userprojects' && isAdmin) return <AdminProjectMapping />;
    if (activeTab === 'managerreport' && isAdmin) return <ManagerMonthlyReport />;
    if (activeTab === 'emailsettings' && isAdmin) return <EmailSettings />;
    if (activeTab === 'emailtemplates' && isAdmin) return <EmailTemplates />;
    if (activeTab === 'llmsettings' && isAdmin) return <LlmSettings />;
    if (activeTab === 'ragmanagement' && isAdmin) return <RagManagement />;
    if (activeTab === 'annualmanagerperformance' && isAdmin) return <AnnualManagerPerformance />;
    if (activeTab === 'companyperformance' && isAdmin) return <CompanyPerformance />;
    if (activeTab === 'overallperformance' && isAdmin) return <OverallPerformance />;
    if (activeTab === 'profile') return <UserProfile />;
    return null;
  };


  useEffect(() => {
    if (!user) {
      return undefined;
    }

    const socket = new WebSocket(getWebSocketUrl());

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const message = payload.message || '새 알림이 도착했습니다.';
        const type = payload.type || 'GENERAL';
        const createdAt = payload.createdAt ? new Date(payload.createdAt) : new Date();
        setNotification({ open: true, message });
        setNotificationList((prev) => [
          {
            id: `${createdAt.getTime()}-${prev.length}`,
            message,
            type,
            createdAt,
          },
          ...prev,
        ]);
      } catch (error) {
        setNotification({ open: true, message: '새 알림이 도착했습니다.' });
        setNotificationList((prev) => [
          {
            id: `${Date.now()}-${prev.length}`,
            message: '새 알림이 도착했습니다.',
            type: 'GENERAL',
            createdAt: new Date(),
          },
          ...prev,
        ]);
      }
    };

    socket.onerror = () => {
      socket.close();
    };

    return () => {
      socket.close();
    };
  }, [user]);

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Drawer
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerOpen ? drawerWidth : collapsedDrawerWidth,
            boxSizing: 'border-box',
            transition: 'width 0.3s ease',
            overflow: 'hidden',
            position: 'fixed',
            height: '100vh',
            zIndex: 1200,
            left: 0,
            top: 0,
          },
        }}
        variant="persistent"
        open={true}
        anchor="left"
        onMouseEnter={() => setDrawerOpen(true)}
        onMouseLeave={() => setDrawerOpen(false)}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            pt: 4,
            pb: 1,
            boxSizing: 'border-box'
          }}
        >
          {/* User Info Section with Fixed Height */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              px: drawerOpen ? 2 : 1,
              minHeight: 80,
              pb: 2
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
          <Box
            sx={{
              flex: 1,
              overflowY: drawerOpen ? 'auto' : 'hidden',
              overflowX: 'hidden'
            }}
          >
            <List>
            {menuGroups.map((group) => {
              const visibleItems = group.items.filter((item) => item.show);
              if (visibleItems.length === 0) return null;
              const groupLabel = group.shortLabel || group.label?.slice(0, 2) || '';
              return (
                <Box key={group.label}>
                  <ListSubheader
                    disableSticky
                    sx={{
                      bgcolor: 'transparent',
                      color: 'text.secondary',
                      fontWeight: 600,
                      fontSize: 11,
                      lineHeight: 1.2,
                      px: 1.5,
                      py: 0.75,
                      minHeight: 'auto',
                      width: drawerOpen ? drawerWidth : collapsedDrawerWidth,
                      minWidth: drawerOpen ? drawerWidth : collapsedDrawerWidth,
                      maxWidth: drawerOpen ? drawerWidth : collapsedDrawerWidth,
                      boxSizing: 'border-box',
                      overflow: 'visible',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      textAlign: 'center'
                    }}
                  >
                    <Tooltip title={group.label} placement="right">
                      <Box
                        component="span"
                        sx={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: 0.6
                        }}
                      >
                        {groupLabel}
                      </Box>
                    </Tooltip>
                  </ListSubheader>
                  {visibleItems.map((item) => (
                    <ListItem key={item.key} disablePadding>
                      <Tooltip title={!drawerOpen ? item.label : ""} placement="right">
                      <ListItemButton
                        selected={activeTab === item.key}
                        onClick={() => setActiveTab(item.key)}
                        sx={{
                          height: 48, // Fixed height
                          px: drawerOpen ? 2.5 : 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: drawerOpen ? 'flex-start' : 'center',
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
                            minWidth: drawerOpen ? 40 : 0,
                            width: 40,
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
                  <Divider sx={{ my: 1 }} />
                </Box>
              );
            })}
            </List>
          </Box>
          <Box sx={{ mt: 'auto', pb: 2 }}>
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
          <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
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

      {/* Floating Notifications Button */}
      <Fab
        color="primary"
        aria-label="notifications"
        onClick={() => setNotificationOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 96,
          right: 24,
          zIndex: 1000,
        }}
      >
        <Badge
          color="error"
          badgeContent={notificationList.length}
          overlap="circular"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: 11,
              height: 18,
              minWidth: 18,
            },
          }}
        >
          <NotificationsIcon />
        </Badge>
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
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'transparent',
            color: 'white',
            py: 1.5,
            px: 2.5,
            backgroundImage: 'linear-gradient(120deg, #1e88e5 0%, #42a5f5 100%)',
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

      {/* Notifications Dialog */}
      <Dialog
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            position: 'fixed',
            bottom: 110,
            right: 24,
            m: 0,
            maxHeight: '60vh',
            height: '420px',
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'transparent',
            color: 'white',
            py: 1.5,
            px: 2.5,
            backgroundImage: 'linear-gradient(120deg, #1e88e5 0%, #42a5f5 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsIcon />
            <Typography variant="h6">알림</Typography>
          </Box>
          <IconButton
            onClick={() => setNotificationOpen(false)}
            size="small"
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {notificationList.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
              아직 도착한 알림이 없습니다.
            </Box>
          ) : (
            <List>
              {notificationList.map((item) => (
                <ListItem
                  key={item.id}
                  divider
                  button
                  onClick={() =>
                    setNotificationList((prev) => prev.filter((entry) => entry.id !== item.id))
                  }
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Chip
                      label={getNotificationTypeMeta(item.type).label}
                      color={getNotificationTypeMeta(item.type).color}
                      size="small"
                    />
                    <ListItemText
                      primary={item.message}
                      secondary={item.createdAt.toLocaleString('ko-KR')}
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity="info"
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
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
