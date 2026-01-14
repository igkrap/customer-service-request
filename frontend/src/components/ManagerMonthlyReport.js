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
  TextField,
  Chip,
  Button
} from '@mui/material';
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';
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
  const [columns, setColumns] = useState([]);
  const [rows, setRows] = useState([]);

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

  useEffect(() => {
    if (daysInMonth.length > 0) {
      generateColumns();
    }
  }, [daysInMonth]);

  useEffect(() => {
    if (reportData.length > 0) {
      generateRows();
    } else {
      setRows([]);
    }
  }, [reportData]);

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

            const resolvedValue = req.resolvedAt;
            const resolvedDate = resolvedValue && resolvedValue.length === 8
              ? `${resolvedValue.slice(0, 4)}-${resolvedValue.slice(4, 6)}-${resolvedValue.slice(6, 8)}`
              : resolvedValue?.split('T')[0];
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

  const generateColumns = () => {
    const cols = [
      {
        field: 'companyName',
        headerName: '회사명',
        width: 180,
        pinned: 'left',
        headerAlign: 'center',
        cellClassName: 'company-name-cell',
        headerClassName: 'header-cell-primary',
        renderCell: (params) => {
          // 이전 행과 회사명이 같으면 빈 값 표시 (병합 효과)
          const currentIndex = params.api.getRowIndexRelativeToVisibleRows(params.id);
          if (currentIndex > 0) {
            const prevRow = rows[currentIndex - 1];
            if (prevRow && prevRow.companyName === params.value) {
              return null; // 같은 회사명이면 빈 셀
            }
          }
          return params.value;
        },
      },
      {
        field: 'projectName',
        headerName: '프로젝트',
        width: 200,
        pinned: 'left',
        headerAlign: 'center',
        cellClassName: 'project-name-cell',
        headerClassName: 'header-cell-primary',
      },
      {
        field: 'contractManDays',
        headerName: 'm/d',
        width: 80,
        pinned: 'left',
        headerAlign: 'center',
        align: 'center',
        headerClassName: 'header-cell-primary',
      },
    ];

    // 날짜별 컬럼 추가
    daysInMonth.forEach(dayInfo => {
      cols.push({
        field: `day_${dayInfo.day}`,
        headerName: `${dayInfo.day}\n(${dayInfo.dayName})`,
        width: 70,
        headerAlign: 'center',
        align: 'center',
        headerClassName: dayInfo.isWeekend ? 'header-cell-weekend' : 'header-cell-day',
        cellClassName: dayInfo.isWeekend ? 'cell-weekend' : '',
        renderHeader: () => (
          <Box sx={{ textAlign: 'center', lineHeight: 1.2 }}>
            <div style={{ fontWeight: 700 }}>{dayInfo.day}</div>
            <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>({dayInfo.dayName})</div>
          </Box>
        ),
        renderCell: (params) => {
          const value = params.value;
          if (!value || value === 0) {
            return <span style={{ color: '#999' }}>-</span>;
          }
          return (
            <Chip
              label={value.toFixed(1)}
              size="small"
              sx={{
                bgcolor: 'primary.light',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 24,
                '&:hover': {
                  bgcolor: 'primary.main',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s',
              }}
            />
          );
        },
      });
    });

    // 합계 컬럼 추가
    cols.push({
      field: 'totalHours',
      headerName: '합계',
      width: 90,
      headerAlign: 'center',
      align: 'center',
      headerClassName: 'header-cell-total',
      cellClassName: 'cell-total',
      renderCell: (params) => (
        <Chip
          label={params.value.toFixed(1)}
          size="small"
          sx={{
            bgcolor: 'success.main',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.8rem',
            height: 26,
          }}
        />
      ),
    });

    setColumns(cols);
  };

  const generateRows = () => {
    // 회사명으로 정렬
    const sortedReportData = [...reportData].sort((a, b) => {
      const companyA = a.project.companyName || '';
      const companyB = b.project.companyName || '';
      // 회사명으로 먼저 정렬, 같으면 프로젝트명으로 정렬
      if (companyA !== companyB) {
        return companyA.localeCompare(companyB);
      }
      return (a.project.projectName || '').localeCompare(b.project.projectName || '');
    });

    const gridRows = sortedReportData.map((row, index) => {
      const rowData = {
        id: index,
        companyName: row.project.companyName || '-',
        projectName: row.project.projectName,
        contractManDays: row.project.contractManDays,
        totalHours: row.totalHours,
      };

      // 각 날짜별 데이터 추가
      daysInMonth.forEach(dayInfo => {
        rowData[`day_${dayInfo.day}`] = row.dailyHours[dayInfo.day] || 0;
      });

      return rowData;
    });

    setRows(gridRows);
  };

  const handleExportToExcel = () => {
    // 헤더 생성
    const headers = ['회사명', '프로젝트', 'm/d'];
    daysInMonth.forEach(dayInfo => {
      headers.push(`${dayInfo.day}(${dayInfo.dayName})`);
    });
    headers.push('합계');

    // 데이터를 회사명으로 정렬
    const sortedReportData = [...reportData].sort((a, b) => {
      const companyA = a.project.companyName || '';
      const companyB = b.project.companyName || '';
      if (companyA !== companyB) {
        return companyA.localeCompare(companyB);
      }
      return (a.project.projectName || '').localeCompare(b.project.projectName || '');
    });

    // 데이터 행 생성
    const excelData = sortedReportData.map(row => {
      const rowData = [
        row.project.companyName || '-',
        row.project.projectName,
        row.project.contractManDays
      ];

      daysInMonth.forEach(dayInfo => {
        const value = row.dailyHours[dayInfo.day];
        rowData.push(value > 0 ? value : '');
      });

      rowData.push(row.totalHours);
      return rowData;
    });

    // 헤더와 데이터 결합
    const worksheetData = [headers, ...excelData];

    // 워크시트 생성
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // 컬럼 너비 설정
    const columnWidths = [
      { wch: 20 }, // 회사명
      { wch: 25 }, // 프로젝트
      { wch: 8 },  // m/d
    ];
    daysInMonth.forEach(() => {
      columnWidths.push({ wch: 8 }); // 날짜
    });
    columnWidths.push({ wch: 10 }); // 합계
    worksheet['!cols'] = columnWidths;

    // 헤더 스타일링
    const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1976D2' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '월간 처리 현황');

    // 파일명 생성
    const selectedManager = managers.find(m => m.id === parseInt(selectedManagerId));
    const managerName = selectedManager ? selectedManager.username : '매니저';
    const [year, month] = selectedMonth.split('-');
    const fileName = `${managerName}_월간처리현황_${year}년${month}월.xlsx`;

    // 파일 다운로드
    XLSX.writeFile(workbook, fileName);
  };

  // 커스텀 툴바 컴포넌트
  function CustomToolbar() {
    return (
      <GridToolbarContainer
        sx={{
          p: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(25, 118, 210, 0.04)',
        }}
      >
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          onClick={handleExportToExcel}
          sx={{
            color: 'success.main',
            fontWeight: 600,
            '&:hover': {
              bgcolor: 'success.light',
              color: 'white',
            },
          }}
        >
          Excel 내보내기
        </Button>
      </GridToolbarContainer>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, minHeight: 72, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          월간 매니저별 실적 현황
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3, display: 'flex', flexDirection: 'column' }}>

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
          <Box
            sx={{
              flex: 1,
              width: '100%',
              '& .header-cell-primary': {
                fontWeight: 700,
                fontSize: '0.95rem',
                borderRight: '1px solid',
                borderColor: 'divider',
              },
              '& .header-cell-day': {
                fontWeight: 700,
                fontSize: '0.9rem',
              },
              '& .header-cell-weekend': {
                fontWeight: 700,
                fontSize: '0.9rem',
                color: 'error.main',
              },
              '& .header-cell-total': {
                fontWeight: 700,
                fontSize: '0.95rem',
                color: 'success.main',
                borderLeft: '1px solid',
                borderColor: 'divider',
              },
              '& .company-name-cell': {
                fontWeight: 700,
                fontSize: '0.9rem',
                borderRight: '2px solid',
                borderColor: 'divider',
              },
              '& .merged-cell': {
                borderTop: 'none !important',
              },
              '& .company-name-first': {
                verticalAlign: 'top',
              },
              '& .project-name-cell': {
                fontWeight: 600,
                fontSize: '0.9rem',
              },
              '& .cell-weekend': {
                bgcolor: 'rgba(239, 83, 80, 0.05)',
              },
              '& .cell-total': {
                bgcolor: 'rgba(102, 187, 106, 0.05)',
              },
              '& .MuiDataGrid-root': {
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              },
              '& .MuiDataGrid-row:nth-of-type(even)': {
                bgcolor: 'rgba(0, 0, 0, 0.02)',
              },
              '& .MuiDataGrid-row:hover': {
                bgcolor: 'rgba(25, 118, 210, 0.04)',
              },
              '& .MuiDataGrid-columnHeader': {
                outline: 'none !important',
                bgcolor: 'background.paper',
              },
              '& .MuiDataGrid-cell': {
                outline: 'none !important',
              },
              '& .MuiDataGrid-pinnedColumnHeaders': {
                boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
              },
              '& .MuiDataGrid-pinnedColumns': {
                boxShadow: '2px 0 4px rgba(0,0,0,0.03)',
              },
            }}
          >
            <DataGrid
              rows={rows}
              columns={columns}
              disableRowSelectionOnClick
              disableColumnMenu
              hideFooter
              autoHeight={false}
              slots={{
                toolbar: CustomToolbar,
              }}
              showToolbar
              getCellClassName={(params) => {
                // 회사명 셀 병합 스타일
                if (params.field === 'companyName') {
                  const currentIndex = params.api.getRowIndexRelativeToVisibleRows(params.id);
                  if (currentIndex > 0) {
                    const prevRow = rows[currentIndex - 1];
                    if (prevRow && prevRow.companyName === params.value) {
                      return 'merged-cell'; // 병합된 셀 (빈 셀)
                    }
                  }
                  return 'company-name-first'; // 회사명의 첫 번째 셀
                }
                return '';
              }}
              initialState={{
                pinnedColumns: { left: ['companyName', 'projectName', 'contractManDays'] },
              }}
              sx={{
                scrollbarGutter: 'stable',
                '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-track': {
                  backgroundColor: '#f1f1f1',
                },
                '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': {
                  backgroundColor: '#888',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: '#555',
                  },
                },
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default ManagerMonthlyReport;
