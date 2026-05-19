import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
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
  Fade,
} from '@mui/material';
import {
  Assignment as RequestIcon,
  HourglassEmpty as PendingIcon,
  Pause as OnHoldIcon,
  CheckCircle as CompletedIcon,
  Settings as SettingsIcon,
  PriorityHigh as PriorityIcon,
  Schedule as ScheduleIcon,
  FactCheck as SummaryIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { getServiceTypeLabel } from '../utils/serviceTypeLabel';
import UserProfile from './UserProfile';
import axios from 'axios';
import { getProfilePictureUrl } from '../services/api';
import PageHeader from './common/PageHeader';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

// 역할을 한글로 변환하는 함수
const getRoleLabel = (role) => {
  const roleMap = {
    'ROLE_ADMIN': '관리자',
    'ROLE_MANAGER': '매니저',
    'ROLE_CUSTOMER': '유저'
  };
  return roleMap[role] || role?.replace('ROLE_', '');
};

const STATUS_META = {
  OPEN: { label: '접수 대기', color: '#64748b' },
  TRIAGE: { label: '접수검토', color: '#7c3aed' },
  ASSIGNED: { label: '배정완료', color: '#0ea5e9' },
  IN_PROGRESS: { label: '진행중', color: '#2563eb' },
  WAITING_CUSTOMER: { label: '고객응답대기', color: '#d97706' },
  HOLD: { label: '보류', color: '#d97706' },
  RESOLVED: { label: '고객확인대기', color: '#059669' },
  REOPENED: { label: '재처리', color: '#dc2626' },
  CLOSED: { label: '종료', color: '#334155' },
  CANCELLED: { label: '취소', color: '#94a3b8' },
};

const PRIORITY_META = {
  URGENT: { label: '긴급', color: '#dc2626' },
  HIGH: { label: '높음', color: '#ea580c' },
  MEDIUM: { label: '보통', color: '#2563eb' },
  LOW: { label: '낮음', color: '#64748b' },
};

const ROLE_ORDER = ['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CUSTOMER'];
const STATUS_ORDER = ['OPEN', 'TRIAGE', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'HOLD', 'RESOLVED', 'REOPENED', 'CLOSED', 'CANCELLED'];
const PRIORITY_ORDER = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
const CHART_AXIS_COLOR = '#94a3b8';
const CHART_GRID_COLOR = '#e2e8f0';

const getStatusLabel = (status) => STATUS_META[status]?.label || status || '-';
const getPriorityLabel = (priority) => PRIORITY_META[priority]?.label || priority || '-';

const parseDashboardDate = (value) => {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{8}$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6)) - 1;
    const day = Number(value.slice(6, 8));
    return new Date(year, month, day);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getRequestBaseDate = (request) => (
  parseDashboardDate(request?.receivedAt)
  || parseDashboardDate(request?.createdAt)
  || parseDashboardDate(request?.updatedAt)
  || parseDashboardDate(request?.dueDate)
);

const formatDashboardDate = (value) => {
  const date = parseDashboardDate(value);
  if (!date) return '-';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

const isTerminalRequest = (request) => ['CLOSED', 'CANCELLED'].includes(request?.status);
const isActiveRequest = (request) => !isTerminalRequest(request);
const isCompletedRequest = (request) => ['CLOSED', 'RESOLVED'].includes(request?.status);
const isUnassignedRequest = (request) => !request?.managerId || !request?.managerName || request?.managerName === '미배정';

function DashboardHome() {
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
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

      if (isAdmin) {
        const [usersRes, companiesRes, projectsRes, requestsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/users`, config),
          axios.get(`${API_BASE_URL}/companies`, config),
          axios.get(`${API_BASE_URL}/projects`, config),
          axios.get(`${API_BASE_URL}/service-requests`, config),
        ]);

        const dashboardData = {
          users: usersRes.data,
          companies: companiesRes.data,
          projects: projectsRes.data,
          requests: requestsRes.data,
          allRequests: requestsRes.data,
        };

        setData(dashboardData);
      } else if (isManager) {
        const projectsEndpoint = user.companyId
          ? `${API_BASE_URL}/projects/company/${user.companyId}`
          : `${API_BASE_URL}/projects`;

        const [projectsRes, requestsRes] = await Promise.all([
          axios.get(projectsEndpoint, config),
          axios.get(`${API_BASE_URL}/service-requests`, config),
        ]);

        const allRequests = requestsRes.data;
        const dashboardData = {
          myProjects: projectsRes.data,
          unassignedRequests: allRequests.filter(r => !r.managerName || r.managerName === '미배정'),
          pendingRequests: allRequests.filter(r => r.status === 'IN_PROGRESS'),
          onHoldRequests: allRequests.filter(r => r.status === 'HOLD'),
          completedRequests: allRequests.filter(r => r.status === 'CLOSED'),
          allRequests: allRequests,
        };

        setData(dashboardData);
      } else if (isCustomer) {
        // Customer는 할당된 프로젝트만 조회
        const [requestsRes, userProjectsRes, userDataRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/service-requests`, config),
          axios.get(`${API_BASE_URL}/users/${user.id}/projects`, config),
          axios.get(`${API_BASE_URL}/users/${user.id}`, config),
        ]);

        const allRequests = requestsRes.data;
        const assignedProjectIds = userProjectsRes.data;
        const userData = userDataRes.data;

        // 할당된 프로젝트 ID가 있으면 회사 프로젝트 목록에서 필터링
        let myProjects = [];
        if (assignedProjectIds.length > 0 && userData.companyId) {
          const companyProjectsRes = await axios.get(`${API_BASE_URL}/projects/company/${userData.companyId}`, config);
          myProjects = companyProjectsRes.data.filter(p => assignedProjectIds.includes(p.id));
        }

        const dashboardData = {
          myProjects: myProjects,
          pendingRequests: allRequests.filter(r => r.status === 'IN_PROGRESS'),
          onHoldRequests: allRequests.filter(r => r.status === 'HOLD'),
          completedRequests: allRequests.filter(r => r.status === 'CLOSED'),
          allRequests: allRequests,
        };

        setData(dashboardData);
      }
    } catch (error) {
      // Error handling without console
    }
  };

  const getRoleText = () => {
    if (isAdmin) return '관리자';
    if (isManager) return '매니저';
    if (isCustomer) return '유저';
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
  const dashboardGridSx = {
    height: '100%',
    minWidth: 1120,
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gridTemplateRows: 'repeat(2, minmax(0, 1fr))',
    borderTop: '1px solid',
    borderLeft: '1px solid',
    borderColor: 'divider',
  };
  const dashboardTileSx = {
    minWidth: 0,
    minHeight: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 0,
    boxShadow: 'none',
    borderRight: '1px solid',
    borderBottom: '1px solid',
    borderColor: 'divider',
  };
  const cardAvatarSx = {
    bgcolor: 'background.paper',
    color: 'text.secondary',
    border: '1px solid',
    borderColor: 'divider',
    borderRadius: 1,
  };

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
            // Error handling without console
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

      // 사용자 위치 정보를 가져오기 시도
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            // 위치 정보를 성공적으로 가져온 경우
            const { latitude, longitude } = position.coords;
            try {
              const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric&lang=kr`
              );

              if (response.ok) {
                const data = await response.json();
                setWeather(data);
              }
            } catch (error) {
              // 실패 시 기본 위치(서울)로 폴백
              await fetchDefaultWeather(API_KEY);
            } finally {
              setWeatherLoading(false);
            }
          },
          async (error) => {
            // 위치 정보를 가져오지 못한 경우 (거부, 에러 등)
            await fetchDefaultWeather(API_KEY);
            setWeatherLoading(false);
          }
        );
      } else {
        // Geolocation API를 지원하지 않는 경우
        await fetchDefaultWeather(API_KEY);
        setWeatherLoading(false);
      }
    } catch (error) {
      setWeatherLoading(false);
    }
  };

  const fetchDefaultWeather = async (API_KEY) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=Seoul&appid=${API_KEY}&units=metric&lang=kr`
      );

      if (response.ok) {
        const data = await response.json();
        setWeather(data);
      }
    } catch (error) {
      // Error handling without console
    }
  };

  // 마감일별 요청 그룹화 - 특정 날짜의 마감일 요청 반환 (완료되지 않은 것만)
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
      return req.dueDate === targetDate && isActiveRequest(req);
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

  const metrics = useMemo(() => {
    const allRequests = data.allRequests || [];
    const users = data.users || [];
    const companies = data.companies || [];
    const projects = data.projects || [];
    const myProjects = data.myProjects || [];
    const activeRequests = allRequests.filter(isActiveRequest);
    const managerAssignedRequests = allRequests.filter(
      (request) => request.managerId === user?.id || request.managerName === user?.username
    );
    const managerScopeRequests = managerAssignedRequests.length > 0 ? managerAssignedRequests : allRequests;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dueLimit = new Date(now);
    dueLimit.setDate(dueLimit.getDate() + 14);

    const countBy = (items, field) => items.reduce((acc, item) => {
      const key = item?.[field] || 'UNKNOWN';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const buildRows = (items, order, meta, field) => {
      const counts = countBy(items, field);
      const orderedRows = order.map((key) => ({
        key,
        label: meta[key]?.label || key,
        value: counts[key] || 0,
        color: meta[key]?.color || '#64748b',
      }));
      Object.entries(counts)
        .filter(([key]) => !order.includes(key))
        .forEach(([key, value]) => {
          orderedRows.push({ key, label: key, value, color: '#64748b' });
        });
      return orderedRows;
    };

    const buildMonthlyRows = (items) => {
      const buckets = [];
      for (let index = 5; index >= 0; index -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        buckets.push({ key, label: `${date.getMonth() + 1}월`, value: 0, color: '#2563eb' });
      }

      items.forEach((request) => {
        const date = getRequestBaseDate(request);
        if (!date) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const bucket = buckets.find((item) => item.key === key);
        if (bucket) bucket.value += 1;
      });

      return buckets;
    };

    const sortRecent = (items) => [...items]
      .sort((a, b) => (getRequestBaseDate(b)?.getTime() || 0) - (getRequestBaseDate(a)?.getTime() || 0));

    const buildDueSoonRequests = (items) => items
      .filter(isActiveRequest)
      .map((request) => ({ ...request, dueDateValue: parseDashboardDate(request.dueDate) }))
      .filter((request) => request.dueDateValue && request.dueDateValue >= now && request.dueDateValue <= dueLimit)
      .sort((a, b) => a.dueDateValue - b.dueDateValue);

    const buildOverdueRequests = (items) => items
      .filter(isActiveRequest)
      .map((request) => ({ ...request, dueDateValue: parseDashboardDate(request.dueDate) }))
      .filter((request) => request.dueDateValue && request.dueDateValue < now)
      .sort((a, b) => a.dueDateValue - b.dueDateValue);

    const dueSoonRequests = buildDueSoonRequests(allRequests);
    const managerDueSoonRequests = buildDueSoonRequests(managerScopeRequests);
    const overdueRequests = buildOverdueRequests(allRequests);
    const managerOverdueRequests = buildOverdueRequests(managerScopeRequests);

    const urgentRequests = activeRequests
      .filter((request) => request.priority === 'URGENT' || request.priority === 'HIGH')
      .sort((a, b) => {
        const priorityDiff = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
        if (priorityDiff !== 0) return priorityDiff;
        return (parseDashboardDate(a.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER)
          - (parseDashboardDate(b.dueDate)?.getTime() || Number.MAX_SAFE_INTEGER);
      });

    const managerRankMap = new Map();
    allRequests.filter((request) => !isUnassignedRequest(request)).forEach((request) => {
      const key = request.managerId || request.managerName;
      const current = managerRankMap.get(key) || {
        key,
        label: request.managerName || '담당자',
        value: 0,
        total: 0,
        color: '#2563eb',
      };
      current.total += 1;
      if (isCompletedRequest(request)) current.value += 1;
      managerRankMap.set(key, current);
    });

    const serviceTypeCounts = projects.reduce((acc, project) => {
      const key = project.serviceType || 'UNKNOWN';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const roleCounts = countBy(users, 'role');
    const nonCancelledRequests = allRequests.filter((request) => request.status !== 'CANCELLED');
    const resolvedCount = allRequests.filter(isCompletedRequest).length;
    const managerNonCancelledRequests = managerScopeRequests.filter((request) => request.status !== 'CANCELLED');
    const managerResolvedCount = managerScopeRequests.filter(isCompletedRequest).length;

    const statusRows = buildRows(allRequests, STATUS_ORDER, STATUS_META, 'status');
    const managerStatusRows = buildRows(managerScopeRequests, STATUS_ORDER, STATUS_META, 'status');
    const priorityRows = buildRows(allRequests, PRIORITY_ORDER, PRIORITY_META, 'priority');
    const managerPriorityRows = buildRows(managerScopeRequests, PRIORITY_ORDER, PRIORITY_META, 'priority');
    const monthlyRows = buildMonthlyRows(allRequests);
    const managerMonthlyRows = buildMonthlyRows(managerScopeRequests);

    const openRequests = allRequests.filter((request) => request.status === 'OPEN');
    const assignmentWaitingRequests = allRequests.filter((request) => ['OPEN', 'TRIAGE'].includes(request.status) && isUnassignedRequest(request));
    const inProgressRequests = allRequests.filter((request) => request.status === 'IN_PROGRESS');
    const customerConfirmRequests = allRequests.filter((request) => request.status === 'RESOLVED');
    const reopenedRequests = allRequests.filter((request) => request.status === 'REOPENED');
    const closedRequests = allRequests.filter((request) => request.status === 'CLOSED');

    const managerOpenRequests = managerScopeRequests.filter((request) => request.status === 'OPEN');
    const managerAssignmentWaitingRequests = managerScopeRequests.filter((request) => ['OPEN', 'TRIAGE'].includes(request.status) && isUnassignedRequest(request));
    const managerInProgressRequests = managerScopeRequests.filter((request) => request.status === 'IN_PROGRESS');
    const managerCustomerConfirmRequests = managerScopeRequests.filter((request) => request.status === 'RESOLVED');
    const managerReopenedRequests = managerScopeRequests.filter((request) => request.status === 'REOPENED');
    const managerClosedRequests = managerScopeRequests.filter((request) => request.status === 'CLOSED');

    const buildWorkflowRows = (scope) => [
      { key: 'OPEN', label: '접수 대기', value: scope.open.length, color: STATUS_META.OPEN.color },
      { key: 'ASSIGN', label: '배정 대기', value: scope.assignment.length, color: STATUS_META.ASSIGNED.color },
      { key: 'IN_PROGRESS', label: '처리 중', value: scope.progress.length, color: STATUS_META.IN_PROGRESS.color },
      { key: 'RESOLVED', label: '확인 대기', value: scope.confirm.length, color: STATUS_META.RESOLVED.color },
      { key: 'REOPENED', label: '재처리', value: scope.reopened.length, color: STATUS_META.REOPENED.color },
      { key: 'CLOSED', label: '종료', value: scope.closed.length, color: STATUS_META.CLOSED.color },
    ];

    const buildSlaRows = (active, dueSoon, overdue) => [
      { key: 'normal', label: '정상', value: Math.max(active.length - dueSoon.length - overdue.length, 0), color: '#2563eb' },
      { key: 'dueSoon', label: '임박', value: dueSoon.length, color: '#d97706' },
      { key: 'overdue', label: '지연', value: overdue.length, color: '#dc2626' },
    ];

    const mergeUniqueRequests = (...groups) => {
      const map = new Map();
      groups.flat().forEach((request) => {
        if (request?.id && !map.has(request.id)) {
          map.set(request.id, request);
        }
      });
      return sortRecent(Array.from(map.values()));
    };

    const workflowRows = buildWorkflowRows({
      open: openRequests,
      assignment: assignmentWaitingRequests,
      progress: inProgressRequests,
      confirm: customerConfirmRequests,
      reopened: reopenedRequests,
      closed: closedRequests,
    });

    const managerWorkflowRows = buildWorkflowRows({
      open: managerOpenRequests,
      assignment: managerAssignmentWaitingRequests,
      progress: managerInProgressRequests,
      confirm: managerCustomerConfirmRequests,
      reopened: managerReopenedRequests,
      closed: managerClosedRequests,
    });

    const slaRows = buildSlaRows(activeRequests, dueSoonRequests, overdueRequests);
    const managerActiveRequests = managerScopeRequests.filter(isActiveRequest);
    const managerSlaRows = buildSlaRows(managerActiveRequests, managerDueSoonRequests, managerOverdueRequests);
    const criticalRequests = mergeUniqueRequests(overdueRequests, reopenedRequests, urgentRequests);
    const managerCriticalRequests = mergeUniqueRequests(managerOverdueRequests, managerReopenedRequests, managerScopeRequests.filter((request) => ['URGENT', 'HIGH'].includes(request.priority)));

    return {
      allRequests,
      activeRequests,
      managerScopeRequests,
      users,
      companies,
      projects,
      myProjects,
      statusRows,
      managerStatusRows,
      priorityRows,
      managerPriorityRows,
      monthlyRows,
      managerMonthlyRows,
      workflowRows,
      managerWorkflowRows,
      slaRows,
      managerSlaRows,
      dueSoonRequests,
      managerDueSoonRequests,
      overdueRequests,
      managerOverdueRequests,
      criticalRequests,
      managerCriticalRequests,
      urgentRequests,
      unassignedRequests: activeRequests.filter(isUnassignedRequest),
      openRequests,
      assignmentWaitingRequests,
      inProgressRequests,
      customerConfirmRequests,
      reopenedRequests,
      closedRequests,
      managerOpenRequests,
      managerAssignmentWaitingRequests,
      managerInProgressRequests,
      managerCustomerConfirmRequests,
      managerReopenedRequests,
      managerClosedRequests,
      pendingRequests: allRequests.filter((request) => request.status === 'IN_PROGRESS'),
      onHoldRequests: allRequests.filter((request) => request.status === 'HOLD'),
      managerPendingRequests: managerScopeRequests.filter((request) => request.status === 'IN_PROGRESS'),
      managerOnHoldRequests: managerScopeRequests.filter((request) => request.status === 'HOLD'),
      completedRequests: allRequests.filter((request) => request.status === 'CLOSED'),
      recentRequests: sortRecent(allRequests),
      managerRecentRequests: sortRecent(managerScopeRequests),
      managerRankRows: Array.from(managerRankMap.values())
        .sort((a, b) => b.value - a.value || b.total - a.total)
        .slice(0, 5)
        .map((row) => ({ ...row, subLabel: `전체 ${row.total}건` })),
      serviceTypeRows: Object.entries(serviceTypeCounts).map(([key, value]) => ({
        key,
        label: getServiceTypeLabel(key),
        value,
        color: '#475569',
      })),
      roleRows: ROLE_ORDER.map((role) => ({
        key: role,
        label: getRoleLabel(role),
        value: roleCounts[role] || 0,
        color: role === 'ROLE_ADMIN' ? '#1e293b' : role === 'ROLE_MANAGER' ? '#2563eb' : '#64748b',
      })),
      completionRate: nonCancelledRequests.length > 0
        ? Math.round((resolvedCount / nonCancelledRequests.length) * 100)
        : 0,
      managerCompletionRate: managerNonCancelledRequests.length > 0
        ? Math.round((managerResolvedCount / managerNonCancelledRequests.length) * 100)
        : 0,
    };
  }, [data, user]);

  const renderEmptyState = (message = '표시할 데이터가 없습니다') => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.secondary',
      }}
    >
      <Typography variant="body2">{message}</Typography>
    </Box>
  );

  const visibleChartRows = (rows) => (rows || []).filter((row) => Number(row.value) > 0);

  const renderChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0]?.payload || {};
    return (
      <Box
        sx={{
          px: 1.25,
          py: 0.75,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 2,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {item.label || label || item.name}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {item.value ?? payload[0].value}건
        </Typography>
      </Box>
    );
  };

  const renderChartLegend = (rows, { maxItems = 6 } = {}) => {
    const visibleRows = visibleChartRows(rows).slice(0, maxItems);
    return (
      <Stack spacing={0.75} sx={{ minWidth: 118 }}>
        {visibleRows.map((row) => (
          <Box key={row.key || row.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
            <Box sx={{ width: 8, height: 8, bgcolor: row.color || '#64748b', flexShrink: 0 }} />
            <Typography variant="caption" noWrap sx={{ flex: 1, color: 'text.secondary' }}>
              {row.label}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              {row.value}
            </Typography>
          </Box>
        ))}
      </Stack>
    );
  };

  const renderDonutChart = (rows, { centerLabel = '전체', maxLegendItems = 6 } = {}) => {
    const visibleRows = visibleChartRows(rows);
    if (visibleRows.length === 0) return renderEmptyState();
    const total = visibleRows.reduce((sum, row) => sum + row.value, 0);

    return (
      <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: 1, alignItems: 'center' }}>
        <Box sx={{ height: '100%', minHeight: 0, position: 'relative' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={visibleRows}
                dataKey="value"
                nameKey="label"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={2}
                stroke="#fff"
                strokeWidth={2}
              >
                {visibleRows.map((row) => (
                  <Cell key={row.key || row.label} fill={row.color || '#64748b'} />
                ))}
              </Pie>
              <ChartTooltip content={renderChartTooltip} />
            </PieChart>
          </ResponsiveContainer>
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1 }}>
              {total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {centerLabel}
            </Typography>
          </Box>
        </Box>
        {renderChartLegend(visibleRows, { maxItems: maxLegendItems })}
      </Box>
    );
  };

  const renderHorizontalBarChart = (rows, { maxItems = 6 } = {}) => {
    const visibleRows = visibleChartRows(rows).slice(0, maxItems);
    if (visibleRows.length === 0) return renderEmptyState();

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={visibleRows} layout="vertical" margin={{ top: 6, right: 22, bottom: 6, left: 8 }}>
          <CartesianGrid stroke={CHART_GRID_COLOR} horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={{ fill: CHART_AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={76}
            tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
            axisLine={false}
            tickLine={false}
          />
          <ChartTooltip content={renderChartTooltip} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
            {visibleRows.map((row) => (
              <Cell key={row.key || row.label} fill={row.color || '#2563eb'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderColumnChart = (rows) => {
    const visibleRows = visibleChartRows(rows);
    if (visibleRows.length === 0) return renderEmptyState();

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={visibleRows} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: CHART_AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: CHART_AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
          <ChartTooltip content={renderChartTooltip} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={34}>
            {visibleRows.map((row) => (
              <Cell key={row.key || row.label} fill={row.color || '#2563eb'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderMonthlyTrend = (rows) => {
    const visibleRows = rows || [];
    if (visibleRows.every((row) => !row.value)) return renderEmptyState();

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={visibleRows} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="dashboardTrendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART_GRID_COLOR} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: CHART_AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: CHART_AXIS_COLOR, fontSize: 11 }} axisLine={false} tickLine={false} />
          <ChartTooltip content={renderChartTooltip} />
          <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} fill="url(#dashboardTrendFill)" />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const renderCompletionGauge = ({ rate, total, active, closed }) => (
    <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 132px', alignItems: 'center', gap: 1 }}>
      <Box sx={{ height: '100%', minHeight: 0, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={[{ name: '완료율', value: Math.max(rate, 0.1), fill: '#2563eb' }]}
            innerRadius="72%"
            outerRadius="96%"
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" background={{ fill: '#e2e8f0' }} cornerRadius={8} />
          </RadialBarChart>
        </ResponsiveContainer>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            pointerEvents: 'none',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1 }}>
            {rate}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            완료율
          </Typography>
        </Box>
      </Box>
      <Stack spacing={1}>
        {[
          { label: '전체', value: total, color: '#334155' },
          { label: '진행', value: active, color: '#2563eb' },
          { label: '종료', value: closed, color: '#059669' },
        ].map((item) => (
          <Box key={item.label} sx={{ borderLeft: '3px solid', borderColor: item.color, pl: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {item.label}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
              {item.value}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );

  const renderRequestTable = (requests, { maxRows = 5, showManager = false } = {}) => {
    const rows = requests.slice(0, maxRows);
    if (rows.length === 0) return renderEmptyState();

    return (
      <TableContainer sx={{ maxHeight: '100%' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>제목</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>{showManager ? '담당' : '마감'}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((request) => (
              <TableRow key={request.id} hover>
                <TableCell sx={{ maxWidth: 140 }}>
                  <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                    {request.title || '-'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {getPriorityLabel(request.priority)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(request.status)}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell sx={{ maxWidth: 90 }}>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {showManager ? (request.managerName || '미배정') : formatDashboardDate(request.dueDate)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderDashboardTile = ({ key, title, icon, children }) => (
    <Card key={key} sx={dashboardTileSx}>
      <CardHeader
        avatar={<Avatar sx={cardAvatarSx}>{icon}</Avatar>}
        title={title}
        titleTypographyProps={{ variant: 'subtitle1', sx: { fontWeight: 800 } }}
        sx={{
          px: 1.5,
          py: 1.25,
          '& .MuiCardHeader-avatar': { mr: 1 },
        }}
      />
      <CardContent
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          px: 1.5,
          pt: 0,
          pb: 1.5,
          '&:last-child': { pb: 1.5 },
        }}
      >
        {children}
      </CardContent>
    </Card>
  );

  const renderDashboardGrid = (tiles) => (
    <Box sx={dashboardGridSx}>
      {tiles.map(renderDashboardTile)}
    </Box>
  );

  const renderAdminDashboard = () => renderDashboardGrid([
    {
      key: 'admin-summary',
      title: '업무 처리율',
      icon: <SummaryIcon />,
      children: renderCompletionGauge({
        rate: metrics.completionRate,
        total: metrics.allRequests.length,
        active: metrics.activeRequests.length,
        closed: metrics.closedRequests.length,
      }),
    },
    {
      key: 'admin-status',
      title: '상태 분포',
      icon: <RequestIcon />,
      children: renderDonutChart(metrics.statusRows, { centerLabel: '요청' }),
    },
    {
      key: 'admin-workflow',
      title: '업무함 현황',
      icon: <PendingIcon />,
      children: renderHorizontalBarChart(metrics.workflowRows),
    },
    {
      key: 'admin-sla',
      title: 'SLA 현황',
      icon: <ScheduleIcon />,
      children: renderColumnChart(metrics.slaRows),
    },
    {
      key: 'admin-priority',
      title: '우선순위 분포',
      icon: <PriorityIcon />,
      children: renderDonutChart(metrics.priorityRows, { centerLabel: '우선순위', maxLegendItems: 4 }),
    },
    {
      key: 'admin-monthly',
      title: '월별 요청 추이',
      icon: <ScheduleIcon />,
      children: renderMonthlyTrend(metrics.monthlyRows),
    },
    {
      key: 'admin-manager-rank',
      title: '매니저 완료 현황',
      icon: <CompletedIcon />,
      children: renderHorizontalBarChart(metrics.managerRankRows, { maxItems: 5 }),
    },
    {
      key: 'admin-critical',
      title: '긴급/지연 목록',
      icon: <OnHoldIcon />,
      children: renderRequestTable(metrics.criticalRequests, { showManager: true }),
    },
  ]);

  const renderManagerDashboard = () => renderDashboardGrid([
    {
      key: 'manager-summary',
      title: '내 업무 처리율',
      icon: <SummaryIcon />,
      children: renderCompletionGauge({
        rate: metrics.managerCompletionRate,
        total: metrics.managerScopeRequests.length,
        active: metrics.managerScopeRequests.filter(isActiveRequest).length,
        closed: metrics.managerClosedRequests.length,
      }),
    },
    {
      key: 'manager-workflow',
      title: '내 업무함 현황',
      icon: <RequestIcon />,
      children: renderHorizontalBarChart(metrics.managerWorkflowRows),
    },
    {
      key: 'manager-status',
      title: '상태 분포',
      icon: <PendingIcon />,
      children: renderDonutChart(metrics.managerStatusRows, { centerLabel: '요청' }),
    },
    {
      key: 'manager-sla',
      title: 'SLA 현황',
      icon: <ScheduleIcon />,
      children: renderColumnChart(metrics.managerSlaRows),
    },
    {
      key: 'manager-priority',
      title: '우선순위 분포',
      icon: <PriorityIcon />,
      children: renderDonutChart(metrics.managerPriorityRows, { centerLabel: '우선순위', maxLegendItems: 4 }),
    },
    {
      key: 'manager-monthly',
      title: '월별 처리 추이',
      icon: <ScheduleIcon />,
      children: renderMonthlyTrend(metrics.managerMonthlyRows),
    },
    {
      key: 'manager-confirm',
      title: '고객 확인 대기',
      icon: <CompletedIcon />,
      children: renderRequestTable(metrics.managerCustomerConfirmRequests),
    },
    {
      key: 'manager-critical',
      title: '긴급/지연 목록',
      icon: <OnHoldIcon />,
      children: renderRequestTable(metrics.managerCriticalRequests),
    },
  ]);

  const renderCustomerDashboard = () => renderDashboardGrid([
    {
      key: 'customer-summary',
      title: '내 요청 처리율',
      icon: <SummaryIcon />,
      children: renderCompletionGauge({
        rate: metrics.completionRate,
        total: metrics.allRequests.length,
        active: metrics.activeRequests.length,
        closed: metrics.closedRequests.length,
      }),
    },
    {
      key: 'customer-status',
      title: '상태 분포',
      icon: <RequestIcon />,
      children: renderDonutChart(metrics.statusRows, { centerLabel: '요청' }),
    },
    {
      key: 'customer-workflow',
      title: '요청 업무함',
      icon: <PendingIcon />,
      children: renderHorizontalBarChart(metrics.workflowRows),
    },
    {
      key: 'customer-sla',
      title: 'SLA 현황',
      icon: <ScheduleIcon />,
      children: renderColumnChart(metrics.slaRows),
    },
    {
      key: 'customer-priority',
      title: '우선순위 분포',
      icon: <PriorityIcon />,
      children: renderDonutChart(metrics.priorityRows, { centerLabel: '우선순위', maxLegendItems: 4 }),
    },
    {
      key: 'customer-monthly',
      title: '월별 요청 추이',
      icon: <ScheduleIcon />,
      children: renderMonthlyTrend(metrics.monthlyRows),
    },
    {
      key: 'customer-confirm',
      title: '완료 확인 필요',
      icon: <CompletedIcon />,
      children: renderRequestTable(metrics.customerConfirmRequests),
    },
    {
      key: 'customer-critical',
      title: '긴급/지연 목록',
      icon: <OnHoldIcon />,
      children: renderRequestTable(metrics.criticalRequests),
    },
  ]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <PageHeader title="홈" />
      <Box sx={{ flex: 1, display: 'flex', gap: 0, p: 0, minHeight: 0 }}>
      {/* 왼쪽 400px - 사용자 정보, 달력, 날씨 */}
      <Paper
        elevation={1}
        sx={{
          width: 340,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          p: 1.5,
          overflow: 'auto',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 0,
        }}
      >
        {/* 사용자 정보 */}
        <Box sx={{ position: 'relative', textAlign: 'center' }}>
          <Tooltip title="설정" placement="right">
            <IconButton
              onClick={() => setShowProfile(!showProfile)}
              size="small"
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                color: showProfile ? 'primary.main' : 'text.secondary',
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Avatar
            src={getProfilePictureUrl(user?.profilePictureId)}
            sx={{
              width: 80,
              height: 80,
              margin: '0 auto',
              mb: 2,
              bgcolor: 'primary.main',
              fontSize: '2rem',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            {!user?.profilePictureId && user?.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="h5" gutterBottom>
            {user?.username}
          </Typography>
          <Chip
            label={getRoleText()}
            color="secondary"
          />
        </Box>

        {/* 달력 */}
        <Box
          sx={{
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
              fontWeight: 700,
            },
            '& .react-calendar__month-view__weekdays': {
              textAlign: 'center',
              textTransform: 'uppercase',
              fontWeight: 700,
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
              color: 'primary.main',
            },
            '& .react-calendar__tile': {
              maxWidth: '100%',
              padding: '10px 6px',
              background: 'none',
              textAlign: 'center',
              lineHeight: '16px',
              position: 'relative',
              fontSize: '0.875rem',
              border: '1px solid transparent',
            },
            '& .react-calendar__tile--now': {
              backgroundColor: 'primary.light',
              color: 'text.primary',
              fontWeight: 700,
            },
            '& .react-calendar__tile--active': {
              backgroundColor: 'secondary.main',
              color: 'secondary.contrastText',
              border: '1px solid',
              borderColor: 'secondary.main',
              fontWeight: 700,
            },
            '& .react-calendar__month-view__days__day--weekend': {
              color: '#d32f2f',
            },
            '& .react-calendar__month-view__days__day--weekend:nth-child(7n)': {
              color: 'primary.main',
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
                showFixedNumberOfWeeks={true}
                formatDay={(locale, date) => date.getDate().toString()}
                formatShortWeekday={(locale, date) => {
                  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
                  return weekdays[date.getDay()];
                }}
              />
            </Box>
          </Tooltip>
        </Box>

        {/* 날씨 */}
        <Box
          sx={{
            p: 2.5,
            backgroundColor: 'secondary.main',
            borderRadius: 0,
            boxShadow: 'none',
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
                      {weather.name}, {weather.sys?.country || 'KR'}
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

      {/* 오른쪽 - Role별 대시보드 그리드 또는 프로필 화면 (나머지 공간) */}
      <Box sx={{ flex: 1, height: '100%', overflow: 'auto', position: 'relative', minWidth: 0 }}>
        <Fade in={!showProfile} timeout={300} unmountOnExit>
          <Box sx={{ height: '100%' }}>
            {isAdmin && renderAdminDashboard()}
            {isManager && renderManagerDashboard()}
            {isCustomer && renderCustomerDashboard()}
          </Box>
        </Fade>
        <Fade in={showProfile} timeout={300} unmountOnExit>
          <Box sx={{ height: '100%', position: 'absolute', top: 0, left: 0, right: 0 }}>
            <UserProfile onBack={() => setShowProfile(false)} />
          </Box>
        </Fade>
      </Box>
      </Box>
    </Box>
  );
}

export default DashboardHome;
