import React, { useEffect, useMemo, useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import CloseIcon from '@mui/icons-material/Close';
import { companyAPI, reportAPI } from '../services/api';

const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeRow = (row) => ({
  id: row.id
    ?? row.project_id
    ?? row.projectId
    ?? `${row.companyId ?? row.company_id}-${row.projectName ?? row.project_name ?? 'unknown'}`,
  companyName: row.companyName ?? row.company_name ?? '',
  projectName: row.projectName ?? row.project_name ?? '',
  plannedManDays: normalizeNumber(row.plannedManDays ?? row.planned_man_days),
  actualManDays: normalizeNumber(row.actualManDays ?? row.actual_man_days),
  totalRequests: normalizeNumber(row.totalRequests ?? row.total_requests),
  resolvedRequests: normalizeNumber(row.resolvedRequests ?? row.resolved_requests),
  achievementRate: normalizeNumber(row.achievementRate ?? row.achievement_rate),
  completionRate: normalizeNumber(row.completionRate ?? row.completion_rate)
});

const normalizeMonthlyRow = (row) => ({
  projectId: row.projectId ?? row.project_id,
  companyName: row.companyName ?? row.company_name ?? '',
  projectName: row.projectName ?? row.project_name ?? '',
  yearMonth: row.yearMonth ?? row.year_month ?? '',
  plannedManDays: normalizeNumber(row.plannedManDays ?? row.planned_man_days),
  actualManDays: normalizeNumber(row.actualManDays ?? row.actual_man_days),
  achievementRate: normalizeNumber(row.achievementRate ?? row.achievement_rate)
});

const formatNumber = (value) => (value === null || value === undefined ? '-' : value);
const formatPercent = (value) => (value === null || value === undefined ? '-' : `${value}%`);

function CompanyPerformance() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [monthlyRows, setMonthlyRows] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyError, setMonthlyError] = useState(null);

  // console.log('[CompanyPerformance] render', {
  //   selectedCompanyId,
  //   loading,
  //   error,
  //   rowCount: rows.length
  // });

  const columns = useMemo(() => ([
    { field: 'companyName', headerName: '회사', flex: 1, minWidth: 160 },
    { field: 'projectName', headerName: '프로젝트', flex: 1.2, minWidth: 180 },
    {
      field: 'plannedManDays',
      headerName: '계획 공수 (m/d)',
      width: 150
    },
    {
      field: 'actualManDays',
      headerName: '투입 공수 (m/d)',
      width: 150
    },
    {
      field: 'achievementRate',
      headerName: '달성률',
      width: 120,
      renderCell: (params) => (params.value === null || params.value === undefined ? '-' : `${params.value}%`)
    },
    { field: 'totalRequests', headerName: '요청 수', width: 120 },
    { field: 'resolvedRequests', headerName: '완료 건수', width: 120 },
    {
      field: 'completionRate',
      headerName: '완료율',
      width: 120,
      renderCell: (params) => (params.value === null || params.value === undefined ? '-' : `${params.value}%`)
    }
  ]), []);

  useEffect(() => {
    // console.log('[CompanyPerformance] mounted');
    const fetchCompanies = async () => {
      try {
        const response = await companyAPI.getAll();
        setCompanies(response.data || []);
        // console.log('[CompanyPerformance] company list response', response.data);
      } catch (err) {
        setError(`회사 목록을 불러오는 중 오류가 발생했습니다: ${err.message}`);
      }
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      // console.log('[CompanyPerformance] fetch report start', {
      //   selectedCompanyId
      // });
      if (!selectedCompanyId) {
        // console.log('[CompanyPerformance] skipped report fetch (no selection)');
        setRows([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const isAllCompanies = selectedCompanyId === 'all';
        const companyId = isAllCompanies ? null : Number(selectedCompanyId);
        const response = await reportAPI.getCompanyPerformance(companyId);
        const normalized = (response.data || []).map(normalizeRow);
        // console.log('[CompanyPerformance] report request', {
        //   selectedCompanyId,
        //   isAllCompanies,
        //   companyId
        // });
        // console.log('[CompanyPerformance] report response', response.data);
        // console.log('[CompanyPerformance] normalized rows', normalized);
        setRows(normalized);
      } catch (err) {
        setError(`회사별 실적을 불러오는 중 오류가 발생했습니다: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [selectedCompanyId]);

  const handleRowClick = async (params) => {
    const project = params.row;
    if (!project?.id) {
      return;
    }
    setSelectedProject(project);
    setDialogOpen(true);
    setMonthlyLoading(true);
    setMonthlyError(null);
    try {
      const response = await reportAPI.getCompanyPerformanceMonthly(project.id);
      const normalized = (response.data || []).map(normalizeMonthlyRow);
      setMonthlyRows(normalized);
    } catch (err) {
      setMonthlyError(`월별 실적을 불러오는 중 오류가 발생했습니다: ${err.message}`);
      setMonthlyRows([]);
    } finally {
      setMonthlyLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedProject(null);
    setMonthlyRows([]);
    setMonthlyError(null);
  };

  const monthlyHeader = useMemo(() => {
    if (monthlyRows.length === 0) {
      return { companyName: '', projectName: '' };
    }
    const [first] = monthlyRows;
    return {
      companyName: first.companyName,
      projectName: first.projectName
    };
  }, [monthlyRows]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 3,
          minHeight: 72,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          회사별 실적 현황
        </Typography>
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          overflow: 'auto',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 3
        }}
      >
        <Paper sx={{ p: 3 }}>
          <FormControl sx={{ minWidth: 240 }}>
            <InputLabel>회사 선택</InputLabel>
            <Select
              value={selectedCompanyId}
              onChange={(event) => setSelectedCompanyId(event.target.value)}
              label="회사 선택"
            >
              <MenuItem value="">회사 선택</MenuItem>
              <MenuItem value="all">전체 회사</MenuItem>
              {companies.map((companyItem) => (
                <MenuItem key={companyItem.id} value={companyItem.id}>
                  {companyItem.companyName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
        <Paper sx={{ p: 2, flex: 1, minHeight: 0, display: 'flex' }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {!loading && !error && (
            <DataGrid
              sx={{ height: '100%', flex: 1, scrollbarGutter: 'stable' }}
              rows={rows}
              columns={columns}
              pagination={false}
              hideFooter
              hideFooterPagination
              pageSizeOptions={[5, 10, 20]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } }
              }}
              localeText={{ noRowsLabel: '조회 결과가 없습니다.' }}
              onRowClick={handleRowClick}
            />
          )}
        </Paper>
      </Box>
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                {monthlyHeader.companyName || selectedProject?.companyName || '회사명'}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {monthlyHeader.projectName || selectedProject?.projectName || '프로젝트명'}
              </Typography>
            </Box>
            <IconButton onClick={handleCloseDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Divider sx={{ mb: 2 }} />
          {monthlyLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}
          {monthlyError && <Alert severity="error">{monthlyError}</Alert>}
          {!monthlyLoading && !monthlyError && monthlyRows.length > 0 && (
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table stickyHeader sx={{ minWidth: 520 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>년월</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>
                      계획 공수
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>
                      투입 공수
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>
                      달성률
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlyRows.map((item) => (
                    <TableRow key={`${item.projectId}-${item.yearMonth}`}>
                      <TableCell>{item.yearMonth}</TableCell>
                      <TableCell align="right">{formatNumber(item.plannedManDays)}</TableCell>
                      <TableCell align="right">{formatNumber(item.actualManDays)}</TableCell>
                      <TableCell align="right">{formatPercent(item.achievementRate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {!monthlyLoading && !monthlyError && monthlyRows.length === 0 && (
            <Alert severity="info">표시할 월별 데이터가 없습니다.</Alert>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default CompanyPerformance;
