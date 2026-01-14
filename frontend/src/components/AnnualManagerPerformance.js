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

const getYearFromDateValue = (value) => {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{8}$/.test(value)) {
    return Number(value.slice(0, 4));
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getFullYear();
};

const calculateCompletionRate = (resolvedCount, totalCount) => {
  const total = Number(totalCount) || 0;
  if (!total) return 0;
  return Math.round(((Number(resolvedCount) || 0) / total) * 100);
};

const normalizeStatus = (status) => {
  if (typeof status !== 'string') return 'UNKNOWN';
  const normalized = status.trim().toUpperCase();
  return normalized || 'UNKNOWN';
};

const normalizeId = (value) => (value === null || value === undefined ? null : String(value));

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
          const receivedYear = getYearFromDateValue(request.receivedAt || request.createdAt);
          if (receivedYear !== yearNumber) {
            return;
          }
          const normalizedStatus = normalizeStatus(request.status);
          if (normalizedStatus === 'CANCELLED') {
            return;
          }
          const managerKey = normalizeId(request.managerId);
          if (!managerKey) {
            return;
          }
          const entry = stats.get(managerKey) || {
            totalRequests: 0,
            resolvedRequests: 0,
            hoursSpent: 0
          };
          entry.totalRequests += 1;
          if (normalizedStatus === 'RESOLVED') {
            const resolvedYear = getYearFromDateValue(request.resolvedAt || request.createdAt);
            if (resolvedYear === yearNumber) {
              entry.resolvedRequests += 1;
              const parsedHours = Number(request.hoursSpent);
              if (Number.isFinite(parsedHours)) {
                entry.hoursSpent += parsedHours;
              }
            }
          }
          stats.set(managerKey, entry);
        });

        const nextRows = managers.map((manager) => {
          const entry = stats.get(normalizeId(manager.id)) || {
            totalRequests: 0,
            resolvedRequests: 0,
            hoursSpent: 0
          };
          const completionRate = calculateCompletionRate(entry.resolvedRequests, entry.totalRequests);
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
