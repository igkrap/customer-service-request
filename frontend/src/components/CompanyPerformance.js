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
  CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
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

function CompanyPerformance() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatPercent = (value) => (Number.isFinite(Number(value)) ? `${Number(value)}%` : '-');
  const formatManDays = (value) => (Number.isFinite(Number(value)) ? Number(value).toFixed(1) : '-');

  const columns = useMemo(() => ([
    { field: 'companyName', headerName: '회사', flex: 1, minWidth: 160 },
    { field: 'projectName', headerName: '프로젝트', flex: 1.2, minWidth: 180 },
    {
      field: 'plannedManDays',
      headerName: '계획 공수 (m/d)',
      width: 150,
      valueFormatter: ({ value }) => formatManDays(value)
    },
    {
      field: 'actualManDays',
      headerName: '투입 공수 (m/d)',
      width: 150,
      valueFormatter: ({ value }) => formatManDays(value)
    },
    {
      field: 'achievementRate',
      headerName: '달성률',
      width: 120,
      valueFormatter: ({ value }) => formatPercent(value)
    },
    { field: 'totalRequests', headerName: '요청 수', width: 120 },
    { field: 'resolvedRequests', headerName: '완료 건수', width: 120 },
    {
      field: 'completionRate',
      headerName: '완료율',
      width: 120,
      valueFormatter: ({ value }) => formatPercent(value)
    }
  ]), []);

  useEffect(() => {
    console.log('[CompanyPerformance] mounted');
    const fetchCompanies = async () => {
      try {
        const response = await companyAPI.getAll();
        setCompanies(response.data || []);
        console.log('[CompanyPerformance] company list response', response.data);
      } catch (err) {
        setError(`회사 목록을 불러오는 중 오류가 발생했습니다: ${err.message}`);
      }
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      console.log('[CompanyPerformance] fetch report start', {
        selectedCompanyId
      });
      if (!selectedCompanyId) {
        console.log('[CompanyPerformance] skipped report fetch (no selection)');
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
        console.log('[CompanyPerformance] report request', {
          selectedCompanyId,
          isAllCompanies,
          companyId
        });
        console.log('[CompanyPerformance] report response', response.data);
        console.log('[CompanyPerformance] normalized rows', normalized);
        setRows(normalized);
      } catch (err) {
        setError(`회사별 실적을 불러오는 중 오류가 발생했습니다: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [selectedCompanyId]);

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
            />
          )}
        </Paper>
      </Box>
    </Box>
  );
}

export default CompanyPerformance;
