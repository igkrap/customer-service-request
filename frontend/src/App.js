import React, { useEffect, useRef, useState } from 'react';
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
import AnnouncementCenter from './components/AnnouncementCenter';
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
  Slide,
  Dialog,
  DialogContent,
  DialogTitle,
  Popover,
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
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Assessment as AssessmentIcon,
  SmartToy as AiIcon,
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
const chatbotPanelWidth = 420;
const sidebarBrandHeight = 68;
const sidebarUserUtilityHeight = 112;
const sidebarRailSlotSx = {
  width: collapsedDrawerWidth,
  minWidth: collapsedDrawerWidth,
  flex: `0 0 ${collapsedDrawerWidth}px`,
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
};
const sidebarRailActionSx = {
  width: 56,
  height: 48,
  borderRadius: 1,
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
};
const sidebarUtilityIconButtonSx = {
  width: 36,
  height: 36,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  '&:hover': {
    bgcolor: 'primary.light',
  },
};
const drawerTransition = 'width 220ms cubic-bezier(0.2, 0, 0, 1)';
const sidebarTextTransition = 'opacity 140ms ease, max-width 220ms cubic-bezier(0.2, 0, 0, 1)';
const drawerCloseDelayMs = 120;

const ChatbotTransition = React.forwardRef(function ChatbotTransition(props, ref) {
  return <Slide direction="left" ref={ref} {...props} />;
});

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
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    createdAt: null,
  });
  const [notificationList, setNotificationList] = useState([]);
  const drawerCloseTimerRef = useRef(null);
  const notificationPopoverOpen = Boolean(notificationAnchorEl);

  const openDrawer = () => {
    if (drawerCloseTimerRef.current) {
      window.clearTimeout(drawerCloseTimerRef.current);
      drawerCloseTimerRef.current = null;
    }
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (notificationPopoverOpen) {
      if (drawerCloseTimerRef.current) {
        window.clearTimeout(drawerCloseTimerRef.current);
        drawerCloseTimerRef.current = null;
      }
      return;
    }

    if (drawerCloseTimerRef.current) {
      window.clearTimeout(drawerCloseTimerRef.current);
    }
    drawerCloseTimerRef.current = window.setTimeout(() => {
      setDrawerOpen(false);
      drawerCloseTimerRef.current = null;
    }, drawerCloseDelayMs);
  };

  const handleNotificationClick = (event) => {
    openDrawer();
    setNotificationAnchorEl((current) => (current ? null : event.currentTarget));
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const getNotificationTypeMeta = (type) => {
    switch (type) {
      case 'SERVICE_REQUEST_CREATED':
        return { label: '신규 요청', color: 'primary' };
      case 'SERVICE_REQUEST_STATUS_UPDATED':
        return { label: '상태 변경', color: 'info' };
      case 'SERVICE_REQUEST_RESOLVED':
        return { label: '처리 완료', color: 'success' };
      case 'MANAGER_ASSIGNED':
        return { label: '담당자 배정', color: 'success' };
      case 'ANNOUNCEMENT':
        return { label: '공지', color: 'warning' };
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

  const formatNotificationTime = (value) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return date.toLocaleString('ko-KR');
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
      label: '메인 메뉴',
      shortLabel: '메인',
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
        { key: 'announcementcenter', label: '공지 알림 전송', icon: <NotificationsIcon />, show: isAdmin },
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
    if (activeTab === 'announcementcenter' && isAdmin) return <AnnouncementCenter />;
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
        setNotification({ open: true, message, createdAt });
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
        const createdAt = new Date();
        setNotification({ open: true, message: '새 알림이 도착했습니다.', createdAt });
        setNotificationList((prev) => [
          {
            id: `${Date.now()}-${prev.length}`,
            message: '새 알림이 도착했습니다.',
            type: 'GENERAL',
            createdAt,
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

  useEffect(() => () => {
    if (drawerCloseTimerRef.current) {
      window.clearTimeout(drawerCloseTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!notificationPopoverOpen) return;

    if (drawerCloseTimerRef.current) {
      window.clearTimeout(drawerCloseTimerRef.current);
      drawerCloseTimerRef.current = null;
    }
    setDrawerOpen(true);
  }, [notificationPopoverOpen]);

  const notificationButton = (
    <Tooltip title="알림" placement={drawerOpen ? 'top' : 'right'}>
      <IconButton
        size="small"
        onClick={handleNotificationClick}
        sx={{
          ...sidebarUtilityIconButtonSx,
          bgcolor: notificationPopoverOpen ? 'primary.light' : 'background.paper',
        }}
      >
        <Badge
          color="error"
          badgeContent={notificationList.length}
          overlap="circular"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: 10,
              height: 16,
              minWidth: 16,
            },
          }}
        >
          <NotificationsIcon fontSize="small" />
        </Badge>
      </IconButton>
    </Tooltip>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Drawer
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerOpen ? drawerWidth : collapsedDrawerWidth,
            boxSizing: 'border-box',
            transition: drawerTransition,
            willChange: 'width',
            overflow: 'hidden',
            position: 'fixed',
            height: '100vh',
            zIndex: 1200,
            left: 0,
            top: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          },
        }}
        variant="permanent"
        anchor="left"
        onMouseEnter={openDrawer}
        onMouseLeave={closeDrawer}
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
              alignItems: 'center',
              justifyContent: 'flex-start',
              px: 0,
              height: sidebarBrandHeight,
              minHeight: sidebarBrandHeight,
              flex: `0 0 ${sidebarBrandHeight}px`,
              boxSizing: 'border-box',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={sidebarRailSlotSx}>
              <Box className="notion-mark" aria-hidden="true">N</Box>
            </Box>
            <Box
              sx={{
                minWidth: 0,
                maxWidth: drawerOpen ? 180 : 0,
                opacity: drawerOpen ? 1 : 0,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                transition: sidebarTextTransition,
                pointerEvents: drawerOpen ? 'auto' : 'none',
              }}
            >
              <Typography variant="h6" sx={{ lineHeight: 1, fontWeight: 700 }}>
                CSR Desk
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Service operations
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              px: 0,
              py: 1.25,
              height: sidebarUserUtilityHeight,
              minHeight: sidebarUserUtilityHeight,
              flex: `0 0 ${sidebarUserUtilityHeight}px`,
              boxSizing: 'border-box',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <Box
                sx={{
                  height: 48,
                  minWidth: 0,
                  width: '100%',
                  boxSizing: 'border-box',
                  px: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  overflow: 'hidden',
                }}
              >
                <Box sx={sidebarRailSlotSx}>
                  <Box
                    sx={{
                      ...sidebarRailActionSx,
                      bgcolor: 'transparent',
                    }}
                  >
                  <Avatar
                    src={getProfilePictureUrl(user?.profilePictureId)}
                    sx={{
                      width: 40,
                      height: 40,
                      border: '2px solid',
                      borderColor: 'divider',
                      flex: '0 0 40px',
                      fontSize: 16,
                      lineHeight: 1,
                      '& img': {
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      },
                    }}
                  >
                    {!user?.profilePictureId && user?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  </Box>
                </Box>
                <Box
                  sx={{
                    minWidth: 0,
                    maxWidth: drawerOpen ? 184 : 0,
                    opacity: drawerOpen ? 1 : 0,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    transition: sidebarTextTransition,
                    pointerEvents: drawerOpen ? 'auto' : 'none',
                  }}
                >
                  <Chip
                    label={getRoleText()}
                    size="small"
                    sx={{
                      mb: 0.5,
                      height: 22,
                      bgcolor: 'action.selected',
                      color: 'text.primary',
                      fontWeight: 700,
                    }}
                  />
                  <Typography
                    variant="caption"
                    display="block"
                    color="text.secondary"
                    sx={{
                      lineHeight: '16px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user?.username}
                  </Typography>
                </Box>
              </Box>
            </ListItem>
            <Box
              sx={{
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                overflow: 'hidden',
              }}
            >
              {drawerOpen ? (
                <Box
                  sx={{
                    pl: `${(collapsedDrawerWidth - 36) / 2}px`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                  }}
                >
                  {notificationButton}
                  <Tooltip title="설정" placement="top">
                    <IconButton
                      size="small"
                      onClick={() => setActiveTab('profile')}
                      sx={{
                        ...sidebarUtilityIconButtonSx,
                        bgcolor: activeTab === 'profile' ? 'primary.light' : 'background.paper',
                      }}
                    >
                      <SettingsIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="로그아웃" placement="top">
                    <IconButton
                      size="small"
                      onClick={logout}
                      sx={sidebarUtilityIconButtonSx}
                    >
                      <LogoutIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ) : (
                <Box sx={sidebarRailSlotSx}>
                  {notificationButton}
                </Box>
              )}
            </Box>
          </Box>
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': {
                display: 'none',
              },
            }}
          >
            <List sx={{ py: 0.5 }}>
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
                      px: 0,
                      py: 0.75,
                      minHeight: 'auto',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      mx: 'auto',
                      textAlign: 'center',
                    }}
                  >
                    <Tooltip title={group.label} placement="right">
                      <Box
                        component="span"
                        sx={{
                          ...sidebarRailSlotSx,
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: 0
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
                        aria-current={activeTab === item.key ? 'page' : undefined}
                        onClick={() => setActiveTab(item.key)}
                        sx={{
                          height: 48,
                          minWidth: 0,
                          width: '100%',
                          boxSizing: 'border-box',
                          m: 0,
                          px: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-start',
                          overflow: 'hidden',
                          bgcolor: activeTab === item.key ? 'secondary.main' : 'transparent',
                          transition: 'background-color 120ms ease, color 120ms ease',
                          '&:hover': {
                            bgcolor: activeTab === item.key ? 'secondary.main' : 'action.hover',
                          },
                          }}
                        >
                        <ListItemIcon
                          sx={{
                            ...sidebarRailSlotSx,
                          }}
                        >
                            <Box
                              sx={{
                                ...sidebarRailActionSx,
                                bgcolor: 'transparent',
                                color: activeTab === item.key ? 'secondary.contrastText' : 'text.secondary',
                              }}
                            >
                              {item.icon}
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={item.label}
                            sx={{
                              ml: 0,
                              minWidth: 0,
                              maxWidth: drawerOpen ? 190 : 0,
                              opacity: drawerOpen ? 1 : 0,
                              overflow: 'hidden',
                              transition: sidebarTextTransition,
                              pointerEvents: drawerOpen ? 'auto' : 'none',
                              '& .MuiTypography-root': {
                                lineHeight: '24px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: activeTab === item.key ? 'secondary.contrastText' : 'text.secondary',
                                fontWeight: activeTab === item.key ? 700 : 500,
                              }
                            }}
                          />
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
          <Box className="notion-page-shell" sx={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            {renderContent()}
          </Box>
        </Fade>
      </Box>

      <Tooltip title={chatbotOpen ? 'AI 챗봇 닫기' : 'AI 챗봇 열기'} placement="left">
        <Box
          component="button"
          type="button"
          aria-label={chatbotOpen ? 'AI 챗봇 닫기' : 'AI 챗봇 열기'}
          aria-expanded={chatbotOpen}
          onClick={() => setChatbotOpen((current) => !current)}
          sx={{
            position: 'fixed',
            top: '50%',
            right: { xs: 0, sm: chatbotOpen ? chatbotPanelWidth : 0 },
            transform: 'translateY(-50%)',
            zIndex: (theme) => theme.zIndex.modal + 1,
            width: 40,
            height: 88,
            border: '1px solid',
            borderColor: 'divider',
            borderRight: 0,
            borderRadius: '8px 0 0 8px',
            bgcolor: chatbotOpen ? 'secondary.main' : 'background.paper',
            color: chatbotOpen ? 'secondary.contrastText' : 'text.secondary',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.12)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            transition: 'right 220ms cubic-bezier(0.2, 0, 0, 1), background-color 120ms ease, color 120ms ease, width 120ms ease',
            '&:hover': {
              width: 46,
              bgcolor: chatbotOpen ? 'secondary.main' : 'primary.light',
              color: chatbotOpen ? 'secondary.contrastText' : 'primary.main',
            },
          }}
        >
          <AiIcon fontSize="small" />
          <Typography
            component="span"
            sx={{
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            AI
          </Typography>
        </Box>
      </Tooltip>

      {/* Chatbot Dialog */}
      <Dialog
        open={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        TransitionComponent={ChatbotTransition}
        transitionDuration={220}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            position: 'fixed',
            top: 0,
            right: 0,
            m: 0,
            width: { xs: '100vw', sm: chatbotPanelWidth },
            maxWidth: { xs: '100vw', sm: chatbotPanelWidth },
            height: '100vh',
            maxHeight: '100vh',
            borderRadius: 0,
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(26, 26, 26, 0.12)',
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'secondary.main',
            color: 'white',
            py: 1.5,
            px: 2.5,
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

      <Popover
        open={notificationPopoverOpen}
        anchorEl={notificationAnchorEl}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: 'left' }}
        PaperProps={{
          onMouseEnter: openDrawer,
          onMouseLeave: closeDrawer,
          sx: {
            ml: 1.5,
            width: { xs: 'calc(100vw - 96px)', sm: 380 },
            maxWidth: 'calc(100vw - 96px)',
            height: { xs: 260, sm: 320 },
            maxHeight: 'calc(100vh - 96px)',
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
          },
        }}
      >
        <DialogContent sx={{ p: 0, height: '100%' }}>
          {notificationList.length === 0 ? (
            <Box
              sx={{
                height: '100%',
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: 'text.secondary',
              }}
            >
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
                      sx={{
                        width: 96,
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    />
                    <ListItemText
                      primary={item.message}
                      secondary={formatNotificationTime(item.createdAt)}
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Popover>

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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2">{notification.message}</Typography>
            {notification.createdAt && (
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {formatNotificationTime(notification.createdAt)}
              </Typography>
            )}
          </Box>
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
