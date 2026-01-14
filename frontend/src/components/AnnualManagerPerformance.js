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
import { serviceRequestAPI, userAPI } from '../services/api';

const getYearFromDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getFullYear();
};

function AnnualManagerPerformance() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const columns = useMemo(() => ([
    { field: 'managerName', headerName: '매니저', flex: 1, minWidth: 160 },
    { field: 'totalRequests', headerName: '접수 건수', width: 140 },
    { field: 'resolvedRequests', headerName: '완료 건수', width: 140 },
    {
      field: 'completionRate',
      headerName: '완료율',
      width: 120,
      valueFormatter: ({ value }) => `${Number.isFinite(value) ? value : 0}%`
    },
    {
      field: 'hoursSpent',
      headerName: '투입 공수 (m/d)',
      width: 140,
      valueFormatter: ({ value }) => `${(Number(value) || 0).toFixed(1)}m/d`
    }
  ]), []);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const yearNumber = Number(selectedYear);
        const [requestsResponse, usersResponse] = await Promise.all([
          serviceRequestAPI.getAll(),
          userAPI.getAll()
        ]);

        const managers = usersResponse.data.filter((user) => user.role === 'ROLE_MANAGER');
        const stats = new Map();
        requestsResponse.data.forEach((request) => {
          const requestYear = getYearFromDate(request.createdAt);
          if (requestYear !== yearNumber) {
            return;
          }
          if (!request.managerId) {
            return;
          }
          const entry = stats.get(request.managerId) || {
            totalRequests: 0,
            resolvedRequests: 0,
            hoursSpent: 0
          };
          entry.totalRequests += 1;
          if (request.status === 'RESOLVED') {
            entry.resolvedRequests += 1;
          }
          if (typeof request.hoursSpent === 'number') {
            entry.hoursSpent += request.hoursSpent;
          }
          stats.set(request.managerId, entry);
        });

        const nextRows = managers.map((manager) => {
          const entry = stats.get(manager.id) || {
            totalRequests: 0,
            resolvedRequests: 0,
            hoursSpent: 0
          };
          const completionRate = entry.totalRequests
            ? Math.round((entry.resolvedRequests / entry.totalRequests) * 100)
            : 0;
          return {
            id: manager.id,
            managerName: manager.username,
            totalRequests: entry.totalRequests,
            resolvedRequests: entry.resolvedRequests,
            completionRate,
            hoursSpent: entry.hoursSpent
          };
        });

        setRows(nextRows);
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
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
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
        <Paper sx={{ p: 2 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          )}
          {error && <Alert severity="error">{error}</Alert>}
          {!loading && !error && (
            <DataGrid
              autoHeight
              rows={rows}
              columns={columns}
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
