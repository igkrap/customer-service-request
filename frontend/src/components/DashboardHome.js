import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  People as UsersIcon,
  Business as CompanyIcon,
  Work as ProjectIcon,
  Assignment as RequestIcon,
  Folder as MyProjectIcon,
  HourglassEmpty as PendingIcon,
  Pause as OnHoldIcon,
  CheckCircle as CompletedIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const API_BASE_URL = 'http://localhost:8080/api';

function DashboardHome() {
  const { user } = useAuth();
  const [data, setData] = useState({
    users: [],
    companies: [],
    projects: [],
    requests: [],
    myProjects: [],
    unassignedRequests: [],
    pendingRequests: [],
    onHoldRequests: [],
    completedRequests: [],
    allRequests: [], // For calendar due dates
  });

  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isManager = user?.role === 'ROLE_MANAGER';
  const isCustomer = user?.role === 'ROLE_CUSTOMER';

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      console.log('=== Dashboard Data Fetch Start ===');
      console.log('User:', user);
      console.log('isAdmin:', isAdmin, 'isManager:', isManager, 'isCustomer:', isCustomer);

      if (isAdmin) {
        const [usersRes, companiesRes, projectsRes, requestsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/users`, config),
          axios.get(`${API_BASE_URL}/companies`, config),
          axios.get(`${API_BASE_URL}/projects`, config),
          axios.get(`${API_BASE_URL}/service-requests`, config),
        ]);

        console.log('Users Response:', usersRes.data);
        console.log('Companies Response:', companiesRes.data);
        console.log('Projects Response:', projectsRes.data);
        console.log('Requests Response:', requestsRes.data);

        const dashboardData = {
          users: usersRes.data.slice(0, 5),
          companies: companiesRes.data.slice(0, 5),
          projects: projectsRes.data.slice(0, 5),
          requests: requestsRes.data.slice(0, 5),
          allRequests: requestsRes.data,
        };

        console.log('Setting Dashboard Data:', dashboardData);
        setData(dashboardData);
      } else if (isManager) {
        const projectsEndpoint = user.companyId
          ? `${API_BASE_URL}/projects/company/${user.companyId}`
          : `${API_BASE_URL}/projects`;

        console.log('Manager Projects Endpoint:', projectsEndpoint);

        const [projectsRes, requestsRes] = await Promise.all([
          axios.get(projectsEndpoint, config),
          axios.get(`${API_BASE_URL}/service-requests`, config),
        ]);

        console.log('Projects Response:', projectsRes.data);
        console.log('Requests Response:', requestsRes.data);

        const allRequests = requestsRes.data;
        const dashboardData = {
          myProjects: projectsRes.data.slice(0, 5),
          unassignedRequests: allRequests.filter(r => !r.managerName || r.managerName === '미배정').slice(0, 5),
          pendingRequests: allRequests.filter(r => r.status === 'IN_PROGRESS').slice(0, 5),
          onHoldRequests: allRequests.filter(r => r.status === 'HOLD').slice(0, 5),
          allRequests: allRequests,
        };

        console.log('Setting Dashboard Data:', dashboardData);
        setData(dashboardData);
      } else if (isCustomer) {
        console.log('Customer companyId:', user.companyId);

        // Customer는 companyId가 있어야 프로젝트 조회 가능
        if (user.companyId) {
          const [projectsRes, requestsRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/projects/company/${user.companyId}`, config),
            axios.get(`${API_BASE_URL}/service-requests`, config),
          ]);

          console.log('Projects Response:', projectsRes.data);
          console.log('Requests Response:', requestsRes.data);

          const allRequests = requestsRes.data;
          const dashboardData = {
            myProjects: projectsRes.data.slice(0, 5),
            pendingRequests: allRequests.filter(r => r.status === 'IN_PROGRESS').slice(0, 5),
            onHoldRequests: allRequests.filter(r => r.status === 'HOLD').slice(0, 5),
            completedRequests: allRequests.filter(r => r.status === 'RESOLVED').slice(0, 5),
            allRequests: allRequests,
          };

          console.log('Setting Dashboard Data:', dashboardData);
          setData(dashboardData);
        } else {
          // companyId가 없으면 service requests만 조회
          console.log('Customer has no companyId, fetching only service requests');
          const requestsRes = await axios.get(`${API_BASE_URL}/service-requests`, config);

          console.log('Requests Response:', requestsRes.data);

          const allRequests = requestsRes.data;
          const dashboardData = {
            myProjects: [],
            pendingRequests: allRequests.filter(r => r.status === 'IN_PROGRESS').slice(0, 5),
            onHoldRequests: allRequests.filter(r => r.status === 'HOLD').slice(0, 5),
            completedRequests: allRequests.filter(r => r.status === 'RESOLVED').slice(0, 5),
            allRequests: allRequests,
          };

          console.log('Setting Dashboard Data:', dashboardData);
          setData(dashboardData);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const getRoleText = () => {
    if (isAdmin) return '관리자';
    if (isManager) return '매니저';
    if (isCustomer) return '고객';
    return '사용자';
  };

  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const weekday = weekdays[today.getDay()];

    return {
      formatted: `${year}년 ${month}월 ${day}일`,
      weekday: weekday,
      monthDay: `${parseInt(month)}월 ${parseInt(day)}일 ${weekday}`
    };
  };

  const dateInfo = getCurrentDate();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  useEffect(() => {
    fetchWeatherData();
  }, []);

  // 달력 타일에 마우스 이벤트 추가
  useEffect(() => {
    const handleTileMouseEnter = (e) => {
      const tile = e.target.closest('.react-calendar__tile');
      if (tile && tile.querySelector('abbr')) {
        const dateStr = tile.querySelector('abbr').getAttribute('aria-label');
        if (dateStr) {
          try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
              setHoveredDate(date);
            }
          } catch (err) {
            console.error('Date parse error:', err);
          }
        }
      }
    };

    const handleTileMouseLeave = () => {
      setHoveredDate(null);
    };

    const calendar = document.querySelector('.react-calendar');
    if (calendar) {
      const tiles = calendar.querySelectorAll('.react-calendar__tile');
      tiles.forEach(tile => {
        tile.addEventListener('mouseenter', handleTileMouseEnter);
        tile.addEventListener('mouseleave', handleTileMouseLeave);
      });

      return () => {
        tiles.forEach(tile => {
          tile.removeEventListener('mouseenter', handleTileMouseEnter);
          tile.removeEventListener('mouseleave', handleTileMouseLeave);
        });
      };
    }
  }, [selectedDate, data.allRequests]);

  const fetchWeatherData = async () => {
    try {
      setWeatherLoading(true);
      const API_KEY = process.env.REACT_APP_WEATHER_API_KEY || 'demo';
      const city = 'Seoul';
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=kr`
      );

      if (response.ok) {
        const data = await response.json();
        setWeather(data);
      }
    } catch (error) {
      console.error('날씨 정보를 가져오는데 실패했습니다:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  // 마감일별 요청 그룹화 - 특정 날짜의 마감일 요청 반환
  const getRequestsByDate = (date) => {
    if (!date || !data.allRequests) return [];

    // date를 yyyyMMdd 형식으로 변환
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const targetDate = `${year}${month}${day}`;

    return data.allRequests.filter(req => {
      if (!req.dueDate) return false;
      // dueDate가 yyyyMMdd 형식이므로 직접 비교
      return req.dueDate === targetDate;
    });
  };

  // 타일 컨텐츠 - 마감일이 있는 날짜에 배지 표시
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;

    const requests = getRequestsByDate(date);
    if (requests.length === 0) return null;

    return (
      <Box
        sx={{
          position: 'absolute',
          top: 2,
          right: 2,
          width: 8,
          height: 8,
          borderRadius: '50%',
          bgcolor: 'warning.main',
        }}
      />
    );
  };

  // 타일 클래스명 - 마감일이 있는 날짜 스타일링
  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return null;

    const requests = getRequestsByDate(date);
    if (requests.length > 0) {
      return 'has-due-date';
    }
    return null;
  };

  const renderUserGrid = (users, title, icon) => {
    console.log('Rendering User Grid with data:', users);
    return (
      <Card sx={{ width: '100%', minHeight: '350px', maxHeight: '350px', display: 'flex', flexDirection: 'column' }}>
        <CardHeader
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{icon}</Avatar>}
          title={title}
          titleTypographyProps={{ variant: 'h6' }}
        />
        <CardContent sx={{ flex: 1, overflow: 'auto' }}>
          {!users || users.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
              데이터가 없습니다
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>사용자ID</TableCell>
                    <TableCell>사용자명</TableCell>
                    <TableCell>역할</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.userId}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role?.replace('ROLE_', '')}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderCompanyGrid = (companies, title, icon) => (
    <Card sx={{ width: '100%', minHeight: '350px', maxHeight: '350px', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{icon}</Avatar>}
        title={title}
        titleTypographyProps={{ variant: 'h6' }}
      />
      <CardContent sx={{ flex: 1, overflow: 'auto' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>회사코드</TableCell>
                <TableCell>회사명</TableCell>
                <TableCell>사업자번호</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>{company.companyCode}</TableCell>
                  <TableCell>{company.companyName}</TableCell>
                  <TableCell>{company.businessNumber || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderProjectGrid = (projects, title, icon) => (
    <Card sx={{ width: '100%', minHeight: '350px', maxHeight: '350px', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{icon}</Avatar>}
        title={title}
        titleTypographyProps={{ variant: 'h6' }}
      />
      <CardContent sx={{ flex: 1, overflow: 'auto' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>프로젝트명</TableCell>
                <TableCell>회사</TableCell>
                <TableCell>서비스유형</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>{project.projectName}</TableCell>
                  <TableCell>{project.companyName || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={project.serviceType === 'MAINTENANCE' ? '유지보수' : '하자보수'}
                      size="small"
                      color={project.serviceType === 'MAINTENANCE' ? 'primary' : 'secondary'}
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderRequestGrid = (requests, title, icon) => (
    <Card sx={{ width: '100%', minHeight: '350px', maxHeight: '350px', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{icon}</Avatar>}
        title={title}
        titleTypographyProps={{ variant: 'h6' }}
      />
      <CardContent sx={{ flex: 1, overflow: 'auto' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>제목</TableCell>
                <TableCell>고객</TableCell>
                <TableCell>우선순위</TableCell>
                <TableCell>상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.title}</TableCell>
                  <TableCell>{request.customerName || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={request.priority}
                      size="small"
                      color={
                        request.priority === 'URGENT' ? 'error' :
                        request.priority === 'HIGH' ? 'warning' :
                        request.priority === 'MEDIUM' ? 'info' :
                        'default'
                      }
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.status}
                      size="small"
                      color={
                        request.status === 'RESOLVED' ? 'success' :
                        request.status === 'HOLD' ? 'warning' :
                        request.status === 'IN_PROGRESS' ? 'info' :
                        'default'
                      }
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderAdminDashboard = () => (
    <Grid container spacing={2} direction="column">
      <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
        {renderUserGrid(data.users, '사용자 목록', <UsersIcon />)}
      </Grid>
      <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
        {renderCompanyGrid(data.companies, '회사 목록', <CompanyIcon />)}
      </Grid>
      <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
        {renderProjectGrid(data.projects, '프로젝트 목록', <ProjectIcon />)}
      </Grid>
      <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
        {renderRequestGrid(data.requests, '요청 목록', <RequestIcon />)}
      </Grid>
    </Grid>
  );

  const renderManagerDashboard = () => (
    <Grid container spacing={2} direction="column">
      <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
        {renderProjectGrid(data.myProjects, '할당된 프로젝트', <MyProjectIcon />)}
      </Grid>
      <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
        {renderRequestGrid(data.unassignedRequests, '미배정 요청', <RequestIcon />)}
      </Grid>
      <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
        {renderRequestGrid(data.pendingRequests, '처리 대기 요청', <PendingIcon />)}
      </Grid>
      <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
        {renderRequestGrid(data.onHoldRequests, '보류 대기 요청', <OnHoldIcon />)}
      </Grid>
    </Grid>
  );

  const renderCustomerDashboard = () => (
    <Grid container spacing={2} direction="column">
      <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
        {renderProjectGrid(data.myProjects, '할당된 프로젝트', <MyProjectIcon />)}
      </Grid>
      <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
        {renderRequestGrid(data.pendingRequests, '처리 대기 요청', <PendingIcon />)}
      </Grid>
      <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
        {renderRequestGrid(data.onHoldRequests, '보류 대기 요청', <OnHoldIcon />)}
      </Grid>
      <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
        {renderRequestGrid(data.completedRequests, '처리 완료 목록', <CompletedIcon />)}
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
      {/* 왼쪽 400px - 사용자 정보 및 달력 */}
      <Box sx={{ width: '400px', flexShrink: 0 }}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            bgcolor: 'background.paper',
          }}
        >
          {/* 사용자 정보 */}
          <Box sx={{ textAlign: 'center' }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                margin: '0 auto',
                mb: 2,
                bgcolor: 'primary.main',
                fontSize: '2rem',
              }}
            >
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="h5" gutterBottom>
              {user?.username}
            </Typography>
            <Chip
              label={getRoleText()}
              color="primary"
              sx={{ mb: 2 }}
            />
          </Box>

          {/* 달력 */}
          <Paper
            elevation={2}
            sx={{
              p: 2,
              bgcolor: 'background.paper',
              '& .react-calendar': {
                width: '100%',
                border: 'none',
                fontFamily: 'inherit',
              },
              '& .react-calendar__navigation': {
                marginBottom: '1em',
              },
              '& .react-calendar__navigation button': {
                minWidth: '44px',
                background: 'none',
                fontSize: '16px',
                fontWeight: 'bold',
              },
              '& .react-calendar__navigation button:enabled:hover': {
                backgroundColor: '#f0f0f0',
              },
              '& .react-calendar__month-view__weekdays': {
                textAlign: 'center',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                fontSize: '0.75em',
              },
              '& .react-calendar__month-view__weekdays__weekday': {
                padding: '0.5em',
              },
              '& .react-calendar__month-view__weekdays__weekday abbr': {
                textDecoration: 'none',
              },
              '& .react-calendar__month-view__weekdays__weekday:first-child abbr': {
                color: '#d32f2f',
              },
              '& .react-calendar__month-view__weekdays__weekday:last-child abbr': {
                color: '#1976d2',
              },
              '& .react-calendar__tile': {
                maxWidth: '100%',
                padding: '10px 6px',
                background: 'none',
                textAlign: 'center',
                lineHeight: '16px',
                position: 'relative',
                fontSize: '0.875rem',
              },
              '& .react-calendar__tile:enabled:hover': {
                backgroundColor: '#f0f0f0',
              },
              '& .react-calendar__tile--now': {
                backgroundColor: '#e3f2fd',
                color: '#333',
                fontWeight: 'bold',
              },
              '& .react-calendar__tile--now:enabled:hover': {
                backgroundColor: '#bbdefb',
              },
              '& .react-calendar__tile--active': {
                backgroundColor: 'transparent !important',
                color: '#006edc',
                border: '2px solid #1976d2',
                fontWeight: 'bold',
              },
              '& .react-calendar__tile--active:enabled:hover': {
                backgroundColor: 'transparent !important',
              },
              '& .react-calendar__tile.has-due-date': {
                backgroundColor: 'transparent',
              },
              '& .react-calendar__month-view__days__day--weekend': {
                color: '#d32f2f',
              },
              '& .react-calendar__month-view__days__day--weekend:nth-child(7n)': {
                color: '#1976d2',
              },
            }}
          >
            <Tooltip
              open={hoveredDate !== null}
              title={
                hoveredDate ? (
                  <Box>
                    {getRequestsByDate(hoveredDate).length > 0 ? (
                      <>
                        <Typography variant="caption" display="block" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          마감 예정 ({getRequestsByDate(hoveredDate).length}건)
                        </Typography>
                        {getRequestsByDate(hoveredDate).map((req, idx) => (
                          <Typography key={idx} variant="caption" display="block" sx={{ mb: 0.3 }}>
                            • {req.title} ({req.priority})
                          </Typography>
                        ))}
                      </>
                    ) : (
                      <Typography variant="caption">마감일이 없습니다</Typography>
                    )}
                  </Box>
                ) : ''
              }
              arrow
              placement="top"
              PopperProps={{
                anchorEl: {
                  getBoundingClientRect: () => {
                    const tile = document.querySelector('.react-calendar__tile:hover');
                    if (tile) {
                      return tile.getBoundingClientRect();
                    }
                    return new DOMRect();
                  }
                }
              }}
            >
              <Box>
                <Calendar
                  onChange={setSelectedDate}
                  value={selectedDate}
                  locale="en-US"
                  tileContent={tileContent}
                  tileClassName={tileClassName}
                  formatDay={(locale, date) => date.getDate().toString()}
                  formatShortWeekday={(locale, date) => {
                    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
                    return weekdays[date.getDay()];
                  }}
                />
              </Box>
            </Tooltip>

            {/* 날씨 정보 */}
            <Box
              sx={{
                mt: 2,
                p: 2.5,
                backgroundColor: '#1a1a1a',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                color: 'white',
              }}
            >
              {weatherLoading ? (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  날씨 정보 로딩 중...
                </Typography>
              ) : weather ? (
                <>
                  {/* 현재 라벨 */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'rgba(255,255,255,0.6)',
                      mb: 1,
                      display: 'block'
                    }}
                  >
                    현재
                  </Typography>

                  {/* 온도와 아이콘 */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', mb: 1.5 }}>
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 'bold',
                        mr: 1,
                        lineHeight: 1
                      }}
                    >
                      {Math.round(weather.main.temp)}°C
                    </Typography>
                    <img
                      src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                      alt={weather.weather[0].description}
                      style={{
                        width: 48,
                        height: 48,
                      }}
                    />
                  </Box>

                  {/* 날씨 설명 */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'rgba(255,255,255,0.8)',
                      mb: 2
                    }}
                  >
                    {weather.weather[0].description}
                  </Typography>

                  {/* 구분선 */}
                  <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)', mb: 2 }} />

                  {/* 날짜와 위치 */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        📅
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        {dateInfo.monthDay}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                        📍
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        서울특별시, KR
                      </Typography>
                    </Box>
                  </Box>
                </>
              ) : (
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  날씨 정보를 불러올 수 없습니다
                </Typography>
              )}
            </Box>
          </Paper>

          {/* 추가 정보 영역 (필요시 사용) */}
          <Box sx={{ flex: 1 }} />
        </Paper>
      </Box>

      {/* 오른쪽 - Role별 대시보드 그리드 (나머지 공간) */}
      <Box sx={{ flex: 1, height: '100%', overflow: 'auto', p: 2 }}>
        {isAdmin && renderAdminDashboard()}
        {isManager && renderManagerDashboard()}
        {isCustomer && renderCustomerDashboard()}
      </Box>
    </Box>
  );
}

export default DashboardHome;
