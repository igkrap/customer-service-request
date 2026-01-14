import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
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

  const columns = useMemo(() => ([
    { field: 'status', headerName: '상태', flex: 1, minWidth: 160 },
    { field: 'count', headerName: '건수', width: 140 }
  ]), []);

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
        const totalRequests = response.data.length;
        const resolvedRequests = counts.RESOLVED || 0;
        const completionRate = totalRequests
          ? Math.round((resolvedRequests / totalRequests) * 100)
          : 0;

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
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        전체 실적 처리 현황
      </Typography>
      <Paper sx={{ p: 3, mb: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
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
  );
}

export default OverallPerformance;
