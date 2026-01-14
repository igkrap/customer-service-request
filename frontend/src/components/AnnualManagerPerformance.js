import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { reportAPI } from '../services/api';

function AnnualManagerPerformance() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const normalizeNumber = (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const normalizeRow = (row) => ({
    id: row.id ?? row.managerId ?? row.manager_id,
    managerName: row.managerName ?? row.manager_name ?? '',
    totalRequests: normalizeNumber(row.totalRequests ?? row.total_requests),
    resolvedRequests: normalizeNumber(row.resolvedRequests ?? row.resolved_requests),
    completionRate: normalizeNumber(row.completionRate ?? row.completion_rate),
    hoursSpent: normalizeNumber(row.hoursSpent ?? row.hours_spent)
  });

  const columns = useMemo(() => ([
    { field: 'managerName', headerName: '매니저', flex: 1, minWidth: 160 },
    { field: 'totalRequests', headerName: '접수 건수', width: 140 },
    { field: 'resolvedRequests', headerName: '완료 건수', width: 140 },
    {
      field: 'completionRate',
      headerName: '완료율',
      width: 120,
      renderCell: (params) => (params.value === null || params.value === undefined ? '-' : `${params.value}%`)
    },
    {
      field: 'hoursSpent',
      headerName: '투입 공수 (m/d)',
      width: 140,
      renderCell: (params) => (params.value === null || params.value === undefined ? '-' : `${params.value}m/d`)
    }
  ]), []);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const yearNumber = Number(selectedYear);
        const response = await reportAPI.getAnnualManagerPerformance(yearNumber);
        const normalized = (response.data || []).map(normalizeRow);
        setRows(normalized);
      } catch (err) {
        setError(`연간 매니저별 실적을 불러오는 중 오류가 발생했습니다: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [selectedYear]);

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
          연간 매니저별 실적 현황
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
          <TextField
            label="연도"
            type="number"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            inputProps={{ min: 2000, max: 2100 }}
            sx={{ width: 160 }}
          />
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
            />
          )}
        </Paper>
      </Box>
    </Box>
  );
}

export default AnnualManagerPerformance;
