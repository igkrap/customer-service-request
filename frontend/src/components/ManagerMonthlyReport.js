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

  // 한국 공휴일 체크 (양력 공휴일만)
  const getKoreanHoliday = (month, day) => {
    const holidays = {
      '1-1': '신정',
      '3-1': '삼일절',
      '5-5': '어린이날',
      '6-6': '현충일',
      '8-15': '광복절',
      '10-3': '개천절',
      '10-9': '한글날',
      '12-25': '크리스마스'
    };
    return holidays[`${month}-${day}`] || null;
  };

  const calculateDaysInMonth = (yearMonth) => {
    const [year, month] = yearMonth.split('-').map(Number);
    const daysCount = new Date(year, month, 0).getDate();
    const days = [];

    for (let day = 1; day <= daysCount; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      const holiday = getKoreanHoliday(month, day);
      days.push({
        day,
        date,
        dayOfWeek,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        isHoliday: holiday !== null,
        holidayName: holiday,
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
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
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
          <TableContainer sx={{ mt: 3, maxHeight: 600 }}>
            <Table stickyHeader size="small" sx={{ minWidth: 1200 }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      bgcolor: 'primary.main',
                      color: 'white',
                      position: 'sticky',
                      left: 0,
                      zIndex: 3,
                      minWidth: 200
                    }}
                  >
                    프로젝트
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 'bold',
                      bgcolor: 'primary.main',
                      color: 'white',
                      position: 'sticky',
                      left: 200,
                      zIndex: 3,
                      minWidth: 80
                    }}
                  >
                    m/d
                  </TableCell>
                  {daysInMonth.map(dayInfo => (
                    <TableCell
                      key={dayInfo.day}
                      align="center"
                      sx={{
                        fontWeight: 'bold',
                        bgcolor: dayInfo.isHoliday ? 'warning.main' : dayInfo.isWeekend ? 'error.light' : 'primary.main',
                        color: 'white',
                        minWidth: 60
                      }}
                    >
                      <div>{dayInfo.day}</div>
                      <div style={{ fontSize: '0.75rem' }}>
                        ({dayInfo.dayName})
                        {dayInfo.isHoliday && <div style={{ fontSize: '0.65rem' }}>{dayInfo.holidayName}</div>}
                      </div>
                    </TableCell>
                  ))}
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 'bold',
                      bgcolor: 'success.main',
                      color: 'white',
                      minWidth: 80
                    }}
                  >
                    합계
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={daysInMonth.length + 3} align="center" sx={{ py: 4 }}>
                      해당 조건의 데이터가 없습니다
                    </TableCell>
                  </TableRow>
                ) : (
                  reportData.map((row, index) => (
                    <TableRow key={index} hover>
                      <TableCell
                        sx={{
                          position: 'sticky',
                          left: 0,
                          bgcolor: 'background.paper',
                          zIndex: 2,
                          fontWeight: 'medium'
                        }}
                      >
                        {row.project.projectName}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          position: 'sticky',
                          left: 200,
                          bgcolor: 'background.paper',
                          zIndex: 2
                        }}
                      >
                        {row.project.contractManDays}
                      </TableCell>
                      {daysInMonth.map(dayInfo => (
                        <TableCell
                          key={dayInfo.day}
                          align="center"
                          sx={{
                            bgcolor: dayInfo.isWeekend ? 'grey.100' : 'inherit'
                          }}
                        >
                          {row.dailyHours[dayInfo.day] > 0 ? row.dailyHours[dayInfo.day].toFixed(1) : '-'}
                        </TableCell>
                      ))}
                      <TableCell
                        align="center"
                        sx={{
                          fontWeight: 'bold',
                          bgcolor: 'success.light'
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
