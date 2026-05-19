import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
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
import PageHeader, { PageActionButton } from './common/PageHeader';
import { DataSurface, FilterPanel } from './common/WorkspaceLayout';

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
  const [searched, setSearched] = useState(false);

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

  const fetchReport = async () => {
    if (!selectedCompanyId) {
      setRows([]);
      setSearched(false);
      return;
    }

    setSearched(true);
    setLoading(true);
    setError(null);
    try {
      const isAllCompanies = selectedCompanyId === 'all';
      const companyId = isAllCompanies ? null : Number(selectedCompanyId);
      const response = await reportAPI.getCompanyPerformance(companyId);
      const normalized = (response.data || []).map(normalizeRow);
      setRows(normalized);
    } catch (err) {
      setError(`회사별 실적을 불러오는 중 오류가 발생했습니다: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

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
      <PageHeader
        title="회사별 실적 현황"
        subtitle="회사와 프로젝트 단위의 처리 실적을 확인합니다."
        actions={<PageActionButton action="search" onClick={fetchReport} disabled={!selectedCompanyId} />}
      />
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0,
          overflow: 'auto',
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 0
        }}
      >
        <FilterPanel>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel>회사 선택</InputLabel>
            <Select
              value={selectedCompanyId}
              onChange={(event) => {
                setSelectedCompanyId(event.target.value);
                setRows([]);
                setSearched(false);
              }}
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
        </FilterPanel>
        <DataSurface>
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
              localeText={{ noRowsLabel: searched ? '조회 결과가 없습니다.' : '조회 버튼을 눌러 데이터를 조회하세요.' }}
              pagination={false}
              hideFooter
              hideFooterPagination
              pageSizeOptions={[5, 10, 20]}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } }
              }}
              onRowClick={handleRowClick}
            />
          )}
        </DataSurface>
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
