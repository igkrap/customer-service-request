import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { serviceRequestAPI } from '../services/api';

function OverallPerformance() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const statusMeta = useMemo(() => ({
    OPEN: { label: '대기', color: 'primary' },
    IN_PROGRESS: { label: '진행중', color: 'info' },
    RESOLVED: { label: '완료', color: 'success' },
    HOLD: { label: '보류', color: 'warning' },
    CANCELLED: { label: '취소', color: 'error' },
    UNKNOWN: { label: '알 수 없음', color: 'default' }
  }), []);

  const calculateCompletionRate = (resolvedCount, totalCount) => {
    const total = Number(totalCount) || 0;
    if (!total) return 0;
    return Math.round(((Number(resolvedCount) || 0) / total) * 100);
  };

  const columns = useMemo(() => ([
    {
      field: 'status',
      headerName: '상태',
      flex: 1,
      minWidth: 160,
      renderCell: (params) => {
        const meta = statusMeta[params.value] || { label: params.value, color: 'default' };
        return (
          <Chip
            label={meta.label}
            color={meta.color}
            size="small"
            variant="outlined"
          />
        );
      }
    },
    { field: 'count', headerName: '건수', width: 140 }
  ]), [statusMeta]);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await serviceRequestAPI.getAll();
        const counts = response.data.reduce((acc, request) => {
          const status = request.status || 'UNKNOWN';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        const totalRequests = response.data.filter((request) => request.status !== 'CANCELLED').length;
        const resolvedRequests = counts.RESOLVED || 0;
        const completionRate = calculateCompletionRate(resolvedRequests, totalRequests);

        setSummary({
          totalRequests,
          resolvedRequests,
          completionRate
        });

        const nextRows = Object.entries(counts).map(([status, count]) => ({
          id: status,
          status,
          count
        }));
        setRows(nextRows);
      } catch (err) {
        setError(`전체 실적 현황을 불러오는 중 오류가 발생했습니다: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

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
          전체 실적 처리 현황
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Paper sx={{ p: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              전체 요청 건수
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {summary ? summary.totalRequests : 0}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              완료 건수
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {summary ? summary.resolvedRequests : 0}
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              완료율
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {summary ? `${summary.completionRate}%` : '0%'}
            </Typography>
          </Box>
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

export default OverallPerformance;
