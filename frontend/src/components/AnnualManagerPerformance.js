import React, { useMemo, useState } from 'react';
import {
  Box,
  TextField,
  Alert,
  CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { reportAPI } from '../services/api';
import PageHeader, { PageActionButton } from './common/PageHeader';
import { DataSurface, FilterPanel } from './common/WorkspaceLayout';

function AnnualManagerPerformance() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

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

  const fetchReport = async () => {
    setSearched(true);
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

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="연간 매니저별 실적 현황"
        subtitle="연도별 매니저 처리 실적을 비교합니다."
        actions={<PageActionButton action="search" onClick={fetchReport} />}
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
          <TextField
            label="연도"
            type="number"
            size="small"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            inputProps={{ min: 2000, max: 2100 }}
            sx={{ width: 160 }}
          />
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
            />
          )}
        </DataSurface>
      </Box>
    </Box>
  );
}

export default AnnualManagerPerformance;
