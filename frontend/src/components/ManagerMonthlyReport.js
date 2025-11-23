import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from '@mui/material';
import { userAPI, projectAPI, serviceRequestAPI } from '../services/api';

function ManagerMonthlyReport() {
  const [managers, setManagers] = useState([]);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [projects, setProjects] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [daysInMonth, setDaysInMonth] = useState([]);

  useEffect(() => {
    fetchManagers();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      calculateDaysInMonth(selectedMonth);
    }
  }, [selectedMonth]);

  useEffect(() => {
    if (selectedManagerId && selectedMonth) {
      fetchReportData();
    }
  }, [selectedManagerId, selectedMonth]);

  const fetchManagers = async () => {
    try {
      const response = await userAPI.getAll();
      const managerList = response.data.filter(u => u.role === 'ROLE_MANAGER');
      setManagers(managerList);
    } catch (err) {
      setError('매니저 목록 불러오기 실패: ' + err.message);
    }
  };

  const calculateDaysInMonth = (yearMonth) => {
    const [year, month] = yearMonth.split('-').map(Number);
    const daysCount = new Date(year, month, 0).getDate();
    const days = [];

    for (let day = 1; day <= daysCount; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      days.push({
        day,
        date,
        dayOfWeek,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        dayName: ['일', '월', '화', '수', '목', '금', '토'][dayOfWeek]
      });
    }

    setDaysInMonth(days);
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [year, month] = selectedMonth.split('-').map(Number);

      // 1. 매니저의 프로젝트 가져오기
      const managerProjectsResponse = await userAPI.getProjects(selectedManagerId);
      const managerProjectIds = managerProjectsResponse.data;

      if (managerProjectIds.length === 0) {
        setProjects([]);
        setReportData([]);
        setLoading(false);
        return;
      }

      // 2. 모든 프로젝트 정보 가져오기
      const allProjectsResponse = await projectAPI.getAll();
      const allProjects = allProjectsResponse.data;

      // 3. 매니저의 프로젝트 중 해당 월에 기간이 걸쳐있는 프로젝트 필터링
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0);

      const relevantProjects = allProjects.filter(p => {
        if (!managerProjectIds.includes(p.id)) return false;
        if (!p.contractStartDate || !p.contractEndDate) return false;

        const projectStart = new Date(p.contractStartDate);
        const projectEnd = new Date(p.contractEndDate);

        // 프로젝트 기간이 해당 월과 겹치는지 확인
        return projectStart <= monthEnd && projectEnd >= monthStart;
      });

      setProjects(relevantProjects);

      // 4. 서비스 요청 데이터 가져오기
      const requestsResponse = await serviceRequestAPI.getAll();
      const allRequests = requestsResponse.data;

      // 5. 해당 매니저가 RESOLVED 처리한 요청만 필터링
      const managerResolvedRequests = allRequests.filter(req =>
        req.managerId === parseInt(selectedManagerId) &&
        req.status === 'RESOLVED' &&
        req.resolvedAt &&
        req.hoursSpent
      );

      // 6. 각 프로젝트별, 날짜별로 소요시간 집계
      const reportRows = relevantProjects.map(project => {
        const dailyHours = {};
        let totalHours = 0;

        daysInMonth.forEach(dayInfo => {
          const targetDate = `${year}-${String(month).padStart(2, '0')}-${String(dayInfo.day).padStart(2, '0')}`;

          // 해당 날짜에 해당 프로젝트에서 완료된 요청의 소요시간 합계
          const dayRequests = managerResolvedRequests.filter(req => {
            if (req.projectId !== project.id) return false;
            if (!req.resolvedAt) return false;

            // resolvedAt을 날짜 형식으로 변환 (yyyy-MM-dd)
            const resolvedDate = req.resolvedAt.split('T')[0];
            return resolvedDate === targetDate;
          });

          const dayTotal = dayRequests.reduce((sum, req) => sum + (parseFloat(req.hoursSpent) || 0), 0);
          dailyHours[dayInfo.day] = dayTotal;
          totalHours += dayTotal;
        });

        return {
          project,
          dailyHours,
          totalHours
        };
      });

      setReportData(reportRows);
      setLoading(false);
    } catch (err) {
      setError('리포트 데이터 불러오기 실패: ' + err.message);
      setLoading(false);
    }
  };

  const handleManagerChange = (event) => {
    setSelectedManagerId(event.target.value);
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography
          variant="h5"
          component="h2"
          sx={{
            mb: 3,
            fontWeight: 600,
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          매니저별 월간 처리 현황
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>매니저 선택</InputLabel>
            <Select
              value={selectedManagerId}
              onChange={handleManagerChange}
              label="매니저 선택"
            >
              <MenuItem value="">선택하세요</MenuItem>
              {managers.map(manager => (
                <MenuItem key={manager.id} value={manager.id}>
                  {manager.username} ({manager.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            type="month"
            label="연월 선택"
            value={selectedMonth}
            onChange={handleMonthChange}
            InputLabelProps={{
              shrink: true,
            }}
            sx={{ minWidth: 200 }}
          />
        </Box>

        {selectedManagerId && selectedMonth && (
          <TableContainer
            sx={{
              mt: 3,
              maxHeight: 600,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'grey.100',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'grey.400',
                borderRadius: '4px',
                '&:hover': {
                  backgroundColor: 'grey.500',
                },
              },
            }}
          >
            <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                      color: 'white',
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                      minWidth: 200,
                      borderRight: '2px solid rgba(255,255,255,0.3)',
                      boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    프로젝트
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                      color: 'white',
                      position: 'sticky',
                      left: 200,
                      zIndex: 3,
                      minWidth: 80,
                      borderRight: '2px solid rgba(255,255,255,0.3)',
                      boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    m/d
                  </TableCell>
                  {daysInMonth.map(dayInfo => (
                    <TableCell
                      key={dayInfo.day}
                      align="center"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        background: dayInfo.isWeekend
                          ? 'linear-gradient(135deg, #ef5350 0%, #e53935 100%)'
                          : 'linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%)',
                        color: 'white',
                        minWidth: 60,
                        borderRight: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{dayInfo.day}</div>
                      <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>({dayInfo.dayName})</div>
                    </TableCell>
                  ))}
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      background: 'linear-gradient(135deg, #66bb6a 0%, #43a047 100%)',
                      color: 'white',
                      minWidth: 80,
                      borderLeft: '2px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    합계
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={daysInMonth.length + 3}
                      align="center"
                      sx={{
                        py: 6,
                        fontSize: '1rem',
                        color: 'text.secondary',
                        fontWeight: 500,
                      }}
                    >
                      해당 조건의 데이터가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  reportData.map((row, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        '&:hover': {
                          bgcolor: 'action.hover',
                          '& td': {
                            bgcolor: 'inherit',
                          },
                        },
                        '&:nth-of-type(even)': {
                          bgcolor: 'rgba(0, 0, 0, 0.02)',
                        },
                      }}
                    >
                      <TableCell
                        sx={{
                          position: 'sticky',
                          left: 0,
                          bgcolor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'background.paper',
                          zIndex: 2,
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          borderRight: '1px solid',
                          borderColor: 'divider',
                          boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
                        }}
                      >
                        {row.project.projectName}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          position: 'sticky',
                          left: 200,
                          bgcolor: index % 2 === 0 ? 'rgba(0, 0, 0, 0.02)' : 'background.paper',
                          zIndex: 2,
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          borderRight: '1px solid',
                          borderColor: 'divider',
                          boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
                        }}
                      >
                        {row.project.contractManDays}
                      </TableCell>
                      {daysInMonth.map(dayInfo => (
                        <TableCell
                          key={dayInfo.day}
                          align="center"
                          sx={{
                            bgcolor: dayInfo.isWeekend ? 'rgba(239, 83, 80, 0.08)' : 'inherit',
                            fontSize: '0.85rem',
                            fontWeight: row.dailyHours[dayInfo.day] > 0 ? 600 : 400,
                            color: row.dailyHours[dayInfo.day] > 0 ? 'text.primary' : 'text.disabled',
                            borderRight: '1px solid',
                            borderColor: 'divider',
                            transition: 'all 0.2s',
                            '&:hover': row.dailyHours[dayInfo.day] > 0 ? {
                              bgcolor: 'primary.light',
                              color: 'white',
                              transform: 'scale(1.05)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            } : {},
                          }}
                        >
                          {row.dailyHours[dayInfo.day] > 0 ? row.dailyHours[dayInfo.day].toFixed(1) : '-'}
                        </TableCell>
                      ))}
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          bgcolor: 'rgba(102, 187, 106, 0.15)',
                          color: 'success.dark',
                          borderLeft: '2px solid',
                          borderColor: 'success.main',
                        }}
                      >
                        {row.totalHours.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}

export default ManagerMonthlyReport;
