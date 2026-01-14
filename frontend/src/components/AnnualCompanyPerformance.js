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
import { companyAPI, serviceRequestAPI, userAPI } from '../services/api';

const getYearFromDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getFullYear();
};

function AnnualCompanyPerformance() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const columns = useMemo(() => ([
    { field: 'companyName', headerName: '회사', flex: 1, minWidth: 180 },
    { field: 'totalRequests', headerName: '요청 건수', width: 140 },
    { field: 'resolvedRequests', headerName: '완료 건수', width: 140 },
    {
      field: 'completionRate',
      headerName: '완료율',
      width: 120,
      valueFormatter: ({ value }) => `${value}%`
    }
  ]), []);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const yearNumber = Number(selectedYear);
        const [requestsResponse, usersResponse, companiesResponse] = await Promise.all([
          serviceRequestAPI.getAll(),
          userAPI.getAll(),
          companyAPI.getAll()
        ]);

        const userMap = new Map(usersResponse.data.map((user) => [user.id, user]));
        const companyMap = new Map(companiesResponse.data.map((company) => [company.id, company]));
        const stats = new Map();

        requestsResponse.data.forEach((request) => {
          const candidateDate = request.resolvedAt || request.updatedAt || request.createdAt;
          const requestYear = getYearFromDate(candidateDate);
          if (requestYear !== yearNumber) {
            return;
          }
          const customer = userMap.get(request.customerId);
          if (!customer || !customer.companyId) {
            return;
          }
          const entry = stats.get(customer.companyId) || {
            totalRequests: 0,
            resolvedRequests: 0
          };
          entry.totalRequests += 1;
          if (request.status === 'RESOLVED') {
            entry.resolvedRequests += 1;
          }
          stats.set(customer.companyId, entry);
        });

        const nextRows = Array.from(stats.entries()).map(([companyId, entry]) => {
          const company = companyMap.get(companyId);
          const completionRate = entry.totalRequests
            ? Math.round((entry.resolvedRequests / entry.totalRequests) * 100)
            : 0;
          return {
            id: companyId,
            companyName: company?.companyName || `회사 ${companyId}`,
            totalRequests: entry.totalRequests,
            resolvedRequests: entry.resolvedRequests,
            completionRate
          };
        });

        setRows(nextRows);
      } catch (err) {
        setError(`연간 회사별 실적을 불러오는 중 오류가 발생했습니다: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [selectedYear]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        연간 회사별 실적 처리 현황
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
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
  );
}

export default AnnualCompanyPerformance;
