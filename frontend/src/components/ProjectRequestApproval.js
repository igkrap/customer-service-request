import React, { useState, useEffect } from 'react';
import { projectRequestAPI } from '../services/api';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Grid
} from '@mui/material';
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { formatDateTime } from '../utils/dateFormatter';
import * as XLSX from 'xlsx';

function ProjectRequestApproval() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await projectRequestAPI.getAll();
      setRequests(response.data);
      setError(null);
    } catch (err) {
      if (err.response?.status !== 403) {
        setError('데이터 가져오기 실패: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setApprovalAction('approve');
    setApprovalNotes('');
    setShowApprovalDialog(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setApprovalAction('reject');
    setApprovalNotes('');
    setShowApprovalDialog(true);
  };

  const handleSubmitApproval = async () => {
    try {
      if (approvalAction === 'approve') {
        await projectRequestAPI.approve(selectedRequest.id, approvalNotes);
        setSuccess('프로젝트 요청이 성공적으로 승인되었습니다! 프로젝트가 생성되었습니다.');
      } else {
        await projectRequestAPI.reject(selectedRequest.id, approvalNotes);
        setSuccess('프로젝트 요청이 거부되었습니다.');
      }

      setShowApprovalDialog(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      setApprovalAction(null);
      fetchData();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('승인 처리 실패: ' + (err.response?.data || err.message));
    }
  };

  const handleRowClick = (params) => {
    setSelectedRequest(params.row);
    setShowDetailDialog(true);
  };

  const getStatusChip = (status) => {
    const colorMap = {
      'PENDING': 'warning',
      'APPROVED': 'success',
      'REJECTED': 'error'
    };
    const labelMap = {
      'PENDING': '대기중',
      'APPROVED': '승인됨',
      'REJECTED': '거부됨'
    };
    return <Chip label={labelMap[status] || status} color={colorMap[status] || 'default'} size="small" />;
  };

  const columns = [
    { field: 'id', headerName: '프로젝트 요청 ID', flex: 0.8, minWidth: 100 },
    { field: 'requestedByUsername', headerName: '요청자', flex: 1.3, minWidth: 130 },
    { field: 'companyName', headerName: '회사', flex: 1.5, minWidth: 120 },
    { field: 'projectName', headerName: '프로젝트명', flex: 2, minWidth: 150 },
    {
      field: 'serviceType',
      headerName: '서비스 유형',
      flex: 1,
      minWidth: 120,
      valueFormatter: (params) => {
        const value = params?.value !== undefined ? params.value : params;
        if (!value) return '';
        return value === 'MAINTENANCE' ? '유지보수' : value === 'DEFECT_REPAIR' ? '하자보수' : value === 'ETC' ? '기타' : '';
      }
    },
    {
      field: 'contractStartDate',
      headerName: '시작일',
      flex: 1,
      minWidth: 100,
      valueFormatter: (params) => {
        const value = params?.value !== undefined ? params.value : params;
        if (!value) return '';
        return new Date(value).toLocaleDateString();
      }
    },
    {
      field: 'contractManDays',
      headerName: 'm/d',
      flex: 0.8,
      minWidth: 80
    },
    {
      field: 'requestStatus',
      headerName: '상태',
      flex: 1,
      minWidth: 100,
      renderCell: (params) => params.value ? getStatusChip(params.value) : null
    },
    {
      field: 'createdAt',
      headerName: '생성일',
      flex: 1.5,
      minWidth: 180,
      valueFormatter: (params) => {
        const value = params?.value !== undefined ? params.value : params;
        if (!value) return '';
        return formatDateTime(value) || '';
      }
    },
    {
      field: 'actions',
      headerName: '작업',
      flex: 1.5,
      minWidth: 150,
      sortable: false,
      renderCell: (params) => {
        if (!params.row || params.row.requestStatus !== 'PENDING') return null;

        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              size="small"
              color="success"
              onClick={(e) => {
                e.stopPropagation();
                handleApprove(params.row);
              }}
              title="승인"
            >
              <ApproveIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleReject(params.row);
              }}
              title="거부"
            >
              <RejectIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick({ row: params.row });
              }}
              title="상세 보기"
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      }
    }
  ];

  const handleExportToExcel = () => {
    const headers = ['프로젝트 요청 ID', '요청자', '회사', '프로젝트명', '서비스 유형', '시작일', 'm/d', '상태', '생성일'];

    const serviceTypeMap = {
      'MAINTENANCE': '유지보수',
      'DEFECT_REPAIR': '하자보수',
      'ETC': '기타'
    };

    const statusMap = {
      'PENDING': '대기',
      'APPROVED': '승인',
      'REJECTED': '거부'
    };

    const excelData = requests.map(req => [
      req.id,
      req.requestedByUsername,
      req.companyName,
      req.projectName,
      serviceTypeMap[req.serviceType] || req.serviceType,
      req.contractStartDate ? new Date(req.contractStartDate).toLocaleDateString() : '',
      req.contractManDays || '',
      statusMap[req.requestStatus] || req.requestStatus,
      req.createdAt ? formatDateTime(req.createdAt) : ''
    ]);

    const worksheetData = [headers, ...excelData];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    const columnWidths = [
      { wch: 15 }, // 프로젝트 요청 ID
      { wch: 15 }, // 요청자
      { wch: 20 }, // 회사
      { wch: 25 }, // 프로젝트명
      { wch: 15 }, // 서비스 유형
      { wch: 12 }, // 시작일
      { wch: 10 }, // m/d
      { wch: 10 }, // 상태
      { wch: 20 }  // 생성일
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '프로젝트 요청');

    const fileName = `프로젝트요청목록_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  function CustomToolbar() {
    return (
      <GridToolbarContainer
        sx={{
          p: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(25, 118, 210, 0.04)',
        }}
      >
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          onClick={handleExportToExcel}
          sx={{
            color: 'success.main',
            fontWeight: 600,
            '&:hover': {
              bgcolor: 'success.light',
              color: 'white',
            },
          }}
        >
          Excel 내보내기
        </Button>
      </GridToolbarContainer>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          프로젝트 요청 승인
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3, display: 'flex', flexDirection: 'column' }}>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Alert severity="info" sx={{ mb: 2 }}>
          요청자의 프로젝트 요청을 검토하고 승인 또는 거부하세요. 승인된 요청은 새 프로젝트를 생성합니다.
        </Alert>

        {/* Approval Dialog */}
        <Dialog open={showApprovalDialog} onClose={() => setShowApprovalDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {approvalAction === 'approve' ? '프로젝트 요청 승인' : '프로젝트 요청 거부'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedRequest?.projectName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                회사: {selectedRequest?.companyName}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="메모 (선택사항)"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                sx={{ mt: 2 }}
                placeholder={approvalAction === 'approve' ?
                  '승인에 대한 메모를 추가하세요...' :
                  '거부 사유를 입력하세요...'}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowApprovalDialog(false)}>취소</Button>
            <Button
              variant="contained"
              color={approvalAction === 'approve' ? 'success' : 'error'}
              onClick={handleSubmitApproval}
            >
              {approvalAction === 'approve' ? '승인' : '거부'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Detail View Dialog */}
        <Dialog open={showDetailDialog} onClose={() => setShowDetailDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">프로젝트 요청 상세</Typography>
              <IconButton onClick={() => setShowDetailDialog(false)}>
                <RejectIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedRequest && (
              <Box sx={{ pt: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">ID</Typography>
                    <Typography variant="body1">{selectedRequest.id}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">상태</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {getStatusChip(selectedRequest.requestStatus)}
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">요청자</Typography>
                    <Typography variant="body1">{selectedRequest.requestedByUsername}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">회사</Typography>
                    <Typography variant="body1">{selectedRequest.companyName}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">프로젝트명</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedRequest.projectName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">서비스 유형</Typography>
                    <Typography variant="body1">
                      {selectedRequest.serviceType === 'MAINTENANCE' ? '유지보수' : selectedRequest.serviceType === 'DEFECT_REPAIR' ? '하자보수' : '기타'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">계약 m/d</Typography>
                    <Typography variant="body1">{selectedRequest.contractManDays}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">계약 시작일</Typography>
                    <Typography variant="body1">
                      {new Date(selectedRequest.contractStartDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">계약 종료일</Typography>
                    <Typography variant="body1">
                      {new Date(selectedRequest.contractEndDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">생성일</Typography>
                    <Typography variant="body1">
                      {formatDateTime(selectedRequest.createdAt)}
                    </Typography>
                  </Grid>
                  {selectedRequest.approvedByUsername && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {selectedRequest.requestStatus === 'APPROVED' ? '승인자' : '거부자'}
                        </Typography>
                        <Typography variant="body1">{selectedRequest.approvedByUsername}</Typography>
                      </Grid>
                      {selectedRequest.approvalNotes && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">메모</Typography>
                          <Typography variant="body1">{selectedRequest.approvalNotes}</Typography>
                        </Grid>
                      )}
                    </>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {selectedRequest && selectedRequest.requestStatus === 'PENDING' && (
              <>
                <Button
                  color="success"
                  variant="contained"
                  startIcon={<ApproveIcon />}
                  onClick={() => {
                    setShowDetailDialog(false);
                    handleApprove(selectedRequest);
                  }}
                >
                  승인
                </Button>
                <Button
                  color="error"
                  variant="contained"
                  startIcon={<RejectIcon />}
                  onClick={() => {
                    setShowDetailDialog(false);
                    handleReject(selectedRequest);
                  }}
                >
                  거부
                </Button>
              </>
            )}
            <Button onClick={() => setShowDetailDialog(false)}>닫기</Button>
          </DialogActions>
        </Dialog>

        {/* DataGrid */}
        <Box sx={{ flex: 1, width: '100%' }}>
          <DataGrid
            rows={requests}
            columns={columns}
            pagination={false}
            hideFooterPagination
            hideFooter
            disableSelectionOnClick
            autoHeight={false}
            onRowClick={handleRowClick}
            slots={{
              toolbar: CustomToolbar,
            }}
            sx={{
              '& .MuiDataGrid-row:hover': {
                cursor: 'pointer',
                backgroundColor: 'action.hover'
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default ProjectRequestApproval;
