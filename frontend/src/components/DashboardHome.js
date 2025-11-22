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

      if (isAdmin) {
        const [usersRes, companiesRes, projectsRes, requestsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/admin/users`, config),
          axios.get(`${API_BASE_URL}/companies`, config),
          axios.get(`${API_BASE_URL}/projects`, config),
          axios.get(`${API_BASE_URL}/requests`, config),
        ]);

        setData({
          users: usersRes.data.slice(0, 5),
          companies: companiesRes.data.slice(0, 5),
          projects: projectsRes.data.slice(0, 5),
          requests: requestsRes.data.slice(0, 5),
        });
      } else if (isManager) {
        const [projectsRes, requestsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/projects/my`, config),
          axios.get(`${API_BASE_URL}/requests`, config),
        ]);

        const allRequests = requestsRes.data;
        setData({
          myProjects: projectsRes.data.slice(0, 5),
          unassignedRequests: allRequests.filter(r => !r.assignedTo).slice(0, 5),
          pendingRequests: allRequests.filter(r => r.status === 'PENDING').slice(0, 5),
          onHoldRequests: allRequests.filter(r => r.status === 'ON_HOLD').slice(0, 5),
        });
      } else if (isCustomer) {
        const [projectsRes, requestsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/projects/my`, config),
          axios.get(`${API_BASE_URL}/requests`, config),
        ]);

        const allRequests = requestsRes.data;
        setData({
          myProjects: projectsRes.data.slice(0, 5),
          pendingRequests: allRequests.filter(r => r.status === 'PENDING').slice(0, 5),
          onHoldRequests: allRequests.filter(r => r.status === 'ON_HOLD').slice(0, 5),
          completedRequests: allRequests.filter(r => r.status === 'COMPLETED').slice(0, 5),
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[today.getDay()];

    return {
      formatted: `${year}년 ${month}월 ${day}일`,
      weekday: `${weekday}요일`
    };
  };

  const dateInfo = getCurrentDate();

  const renderUserGrid = (users, title, icon) => (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{icon}</Avatar>}
        title={title}
        titleTypographyProps={{ variant: 'h6' }}
      />
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>사용자명</TableCell>
                <TableCell>이메일</TableCell>
                <TableCell>역할</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
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
      </CardContent>
    </Card>
  );

  const renderCompanyGrid = (companies, title, icon) => (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{icon}</Avatar>}
        title={title}
        titleTypographyProps={{ variant: 'h6' }}
      />
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>회사명</TableCell>
                <TableCell>설명</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>{company.name}</TableCell>
                  <TableCell>{company.description || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );

  const renderProjectGrid = (projects, title, icon) => (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{icon}</Avatar>}
        title={title}
        titleTypographyProps={{ variant: 'h6' }}
      />
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>프로젝트명</TableCell>
                <TableCell>회사</TableCell>
                <TableCell>상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{project.company?.name || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={project.status}
                      size="small"
                      color={project.status === 'ACTIVE' ? 'success' : 'default'}
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
    <Card sx={{ height: '100%' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{icon}</Avatar>}
        title={title}
        titleTypographyProps={{ variant: 'h6' }}
      />
      <CardContent>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>제목</TableCell>
                <TableCell>프로젝트</TableCell>
                <TableCell>상태</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.title}</TableCell>
                  <TableCell>{request.project?.name || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={request.status}
                      size="small"
                      color={
                        request.status === 'COMPLETED' ? 'success' :
                        request.status === 'ON_HOLD' ? 'warning' :
                        'info'
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
    <Grid container spacing={2}>
      <Grid item xs={12}>
        {renderUserGrid(data.users, '사용자 목록', <UsersIcon />)}
      </Grid>
      <Grid item xs={12}>
        {renderCompanyGrid(data.companies, '회사 목록', <CompanyIcon />)}
      </Grid>
      <Grid item xs={12}>
        {renderProjectGrid(data.projects, '프로젝트 목록', <ProjectIcon />)}
      </Grid>
      <Grid item xs={12}>
        {renderRequestGrid(data.requests, '요청 목록', <RequestIcon />)}
      </Grid>
    </Grid>
  );

  const renderManagerDashboard = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        {renderProjectGrid(data.myProjects, '할당된 프로젝트', <MyProjectIcon />)}
      </Grid>
      <Grid item xs={12}>
        {renderRequestGrid(data.unassignedRequests, '미배정 요청', <RequestIcon />)}
      </Grid>
      <Grid item xs={12}>
        {renderRequestGrid(data.pendingRequests, '처리 대기 요청', <PendingIcon />)}
      </Grid>
      <Grid item xs={12}>
        {renderRequestGrid(data.onHoldRequests, '보류 대기 요청', <OnHoldIcon />)}
      </Grid>
    </Grid>
  );

  const renderCustomerDashboard = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        {renderProjectGrid(data.myProjects, '할당된 프로젝트', <MyProjectIcon />)}
      </Grid>
      <Grid item xs={12}>
        {renderRequestGrid(data.pendingRequests, '처리 대기 요청', <PendingIcon />)}
      </Grid>
      <Grid item xs={12}>
        {renderRequestGrid(data.onHoldRequests, '보류 대기 요청', <OnHoldIcon />)}
      </Grid>
      <Grid item xs={12}>
        {renderRequestGrid(data.completedRequests, '처리 완료 목록', <CompletedIcon />)}
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 2 }}>
      {/* 왼쪽 30% - 사용자 정보 및 달력 */}
      <Box sx={{ width: '30%', minWidth: '300px' }}>
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

          {/* 달력 및 날짜 */}
          <Paper
            elevation={2}
            sx={{
              p: 3,
              textAlign: 'center',
              bgcolor: 'primary.main',
              color: 'white',
            }}
          >
            <CalendarIcon sx={{ fontSize: 60, mb: 2, color: 'white' }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
              {dateInfo.formatted}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
              {dateInfo.weekday}
            </Typography>
          </Paper>

          {/* 오늘 날짜 강조 표시 */}
          <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              오늘
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {new Date().getDate()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date().getFullYear()}년 {new Date().getMonth() + 1}월
            </Typography>
          </Box>

          {/* 추가 정보 영역 (필요시 사용) */}
          <Box sx={{ flex: 1 }} />
        </Paper>
      </Box>

      {/* 오른쪽 70% - Role별 대시보드 그리드 */}
      <Box sx={{ width: '70%', overflow: 'auto' }}>
        {isAdmin && renderAdminDashboard()}
        {isManager && renderManagerDashboard()}
        {isCustomer && renderCustomerDashboard()}
      </Box>
    </Box>
  );
}

export default DashboardHome;
