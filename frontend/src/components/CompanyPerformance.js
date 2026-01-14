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
import { companyAPI, projectAPI, serviceRequestAPI, userAPI } from '../services/api';

function CompanyPerformance() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const columns = useMemo(() => ([
    { field: 'companyName', headerName: '회사', flex: 1, minWidth: 160 },
    { field: 'projectName', headerName: '프로젝트', flex: 1.2, minWidth: 180 },
    { field: 'totalRequests', headerName: '요청 수', width: 120 },
    { field: 'resolvedRequests', headerName: '완료 건수', width: 120 },
    {
      field: 'completionRate',
      headerName: '완료율',
      width: 120,
      valueFormatter: ({ value }) => `${Number.isFinite(value) ? value : 0}%`
    }
  ]), []);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await companyAPI.getAll();
        setCompanies(response.data || []);
      } catch (err) {
        setError(`회사 목록을 불러오는 중 오류가 발생했습니다: ${err.message}`);
      }
    };

    fetchCompanies();
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      if (!selectedCompanyId) {
        setRows([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const companyId = Number(selectedCompanyId);
        const [projectsResponse, usersResponse, requestsResponse, companiesResponse] = await Promise.all([
          projectAPI.getByCompanyId(companyId),
          userAPI.getAll(),
          serviceRequestAPI.getAll(),
          companyAPI.getAll()
        ]);

        const company = companiesResponse.data.find((item) => item.id === companyId);
        const companyName = company?.companyName || `회사 ${companyId}`;
        const userMap = new Map(usersResponse.data.map((user) => [user.id, user]));
        const stats = new Map();

        requestsResponse.data.forEach((request) => {
          const customer = userMap.get(request.customerId);
          if (!customer || customer.companyId !== companyId) {
            return;
          }
          const entry = stats.get(request.projectId) || {
            totalRequests: 0,
            resolvedRequests: 0
          };
          entry.totalRequests += 1;
          if (request.status === 'RESOLVED') {
            entry.resolvedRequests += 1;
          }
          stats.set(request.projectId, entry);
        });

        const nextRows = projectsResponse.data.map((project) => {
          const entry = stats.get(project.id) || {
            totalRequests: 0,
            resolvedRequests: 0
          };
          const completionRate = entry.totalRequests
            ? Math.round((entry.resolvedRequests / entry.totalRequests) * 100)
            : 0;
          return {
            id: project.id,
            companyName,
            projectName: project.projectName,
            totalRequests: entry.totalRequests,
            resolvedRequests: entry.resolvedRequests,
            completionRate
          };
        });

        setRows(nextRows);
      } catch (err) {
        setError(`회사별 실적을 불러오는 중 오류가 발생했습니다: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [selectedCompanyId]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        회사별 실적 처리 현황
      </Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <FormControl sx={{ minWidth: 240 }}>
          <InputLabel>회사 선택</InputLabel>
          <Select
            value={selectedCompanyId}
            onChange={(event) => setSelectedCompanyId(event.target.value)}
            label="회사 선택"
          >
            <MenuItem value="">회사 선택</MenuItem>
            {companies.map((companyItem) => (
              <MenuItem key={companyItem.id} value={companyItem.id}>
                {companyItem.companyName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
            localeText={{ noRowsLabel: '조회 결과가 없습니다.' }}
          />
        )}
      </Paper>
    </Box>
  );
}

export default CompanyPerformance;
