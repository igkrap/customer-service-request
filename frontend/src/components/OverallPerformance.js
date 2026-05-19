import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { serviceRequestAPI } from '../services/api';
import PageHeader, { PageActionButton } from './common/PageHeader';
import { DataSurface, SectionPanel } from './common/WorkspaceLayout';

function OverallPerformance() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const statusMeta = useMemo(() => ({
    OPEN: { label: '접수 대기', color: 'primary' },
    TRIAGE: { label: '접수검토', color: 'secondary' },
    ASSIGNED: { label: '배정완료', color: 'info' },
    IN_PROGRESS: { label: '진행중', color: 'info' },
    WAITING_CUSTOMER: { label: '고객응답대기', color: 'warning' },
    HOLD: { label: '보류', color: 'warning' },
    RESOLVED: { label: '완료보고', color: 'success' },
    REOPENED: { label: '재처리', color: 'error' },
    CLOSED: { label: '종료', color: 'default' },
    CANCELLED: { label: '취소', color: 'error' },
    UNKNOWN: { label: '알 수 없음', color: 'default' }
  }), []);

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

  const fetchReport = async () => {
    setSearched(true);
    setLoading(true);
    setError(null);
    try {
      const response = await serviceRequestAPI.getAll();
      const counts = response.data.reduce((acc, request) => {
        const status = normalizeStatus(request.status);
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      const totalRequests = response.data.filter(
        (request) => normalizeStatus(request.status) !== 'CANCELLED'
      ).length;
      const resolvedRequests = (counts.CLOSED || 0) + (counts.RESOLVED || 0);
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

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="전체 실적 처리 현황"
        subtitle="서비스 요청 상태별 처리 현황을 한눈에 봅니다."
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
        <SectionPanel contentSx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
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
        </SectionPanel>
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

export default OverallPerformance;
