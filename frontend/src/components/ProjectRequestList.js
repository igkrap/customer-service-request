import React, { useState, useEffect } from 'react';
import { projectRequestAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { formatDateTime } from '../utils/dateFormatter';
import * as XLSX from 'xlsx';

function ProjectRequestList() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [formData, setFormData] = useState({
    projectName: '',
    serviceType: 'MAINTENANCE',
    contractStartDate: '',
    contractEndDate: '',
    contractManDays: ''
  });

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
        setError('Failed to fetch data: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        contractManDays: parseFloat(formData.contractManDays)
      };

      if (editingRequest) {
        await projectRequestAPI.update(editingRequest.id, submitData);
      } else {
        await projectRequestAPI.create(submitData);
      }

      setFormData({
        projectName: '',
        serviceType: 'MAINTENANCE',
        contractStartDate: '',
        contractEndDate: '',
        contractManDays: ''
      });
      setShowForm(false);
      setEditingRequest(null);
      fetchData();
    } catch (err) {
      setError('Failed to save project request: ' + (err.response?.data || err.message));
    }
  };

  const handleEdit = (request) => {
    setEditingRequest(request);
    setFormData({
      projectName: request.projectName,
      serviceType: request.serviceType,
      contractStartDate: request.contractStartDate,
      contractEndDate: request.contractEndDate,
      contractManDays: request.contractManDays.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this project request?')) {
      try {
        await projectRequestAPI.delete(id);
        fetchData();
      } catch (err) {
        setError('Failed to delete project request: ' + (err.response?.data || err.message));
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRequest(null);
    setFormData({
      projectName: '',
      serviceType: 'MAINTENANCE',
      contractStartDate: '',
      contractEndDate: '',
      contractManDays: ''
    });
  };

  const getStatusChip = (status) => {
    const colorMap = {
      'PENDING': 'warning',
      'APPROVED': 'success',
      'REJECTED': 'error'
    };
    return <Chip label={status} color={colorMap[status] || 'default'} size="small" />;
  };

  const columns = [
    { field: 'id', headerName: '프로젝트 요청 ID', flex: 0.8, minWidth: 100 },
    { field: 'projectName', headerName: '프로젝트명', flex: 2, minWidth: 150 },
    { field: 'companyName', headerName: '회사', flex: 1.5, minWidth: 120 },
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
      field: 'contractEndDate',
      headerName: '종료일',
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
      flex: 1,
      minWidth: 100,
      sortable: false,
      renderCell: (params) => {
        if (!params.row || params.row.requestStatus !== 'PENDING') return null;

        return (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '100%' }}>
            <IconButton
              size="small"
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(params.row);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(params.row.id);
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      }
    }
  ];

  const handleExportToExcel = () => {
    const headers = ['프로젝트 요청 ID', '프로젝트명', '회사', '서비스 유형', '시작일', '종료일', 'm/d', '상태', '생성일'];

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
      req.projectName,
      req.companyName,
      serviceTypeMap[req.serviceType] || req.serviceType,
      req.contractStartDate ? new Date(req.contractStartDate).toLocaleDateString() : '',
      req.contractEndDate ? new Date(req.contractEndDate).toLocaleDateString() : '',
      req.contractManDays || '',
      statusMap[req.requestStatus] || req.requestStatus,
      req.createdAt ? formatDateTime(req.createdAt) : ''
    ]);

    const worksheetData = [headers, ...excelData];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    const columnWidths = [
      { wch: 15 }, // 프로젝트 요청 ID
      { wch: 25 }, // 프로젝트명
      { wch: 20 }, // 회사
      { wch: 15 }, // 서비스 유형
      { wch: 12 }, // 시작일
      { wch: 12 }, // 종료일
      { wch: 10 }, // m/d
      { wch: 10 }, // 상태
      { wch: 20 }  // 생성일
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '프로젝트 요청');

    const fileName = `내프로젝트요청목록_${new Date().toISOString().split('T')[0]}.xlsx`;
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
      <Box sx={{ p: 3, minHeight: 72, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', display: 'flex', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            내 프로젝트 등록 요청
          </Typography>
          {!showForm && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowForm(true)}
            >
              새 프로젝트 등록 요청
            </Button>
          )}
        </Box>
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3, display: 'flex', flexDirection: 'column' }}>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Alert severity="info" sx={{ mb: 2 }}>
          회사의 새 프로젝트 등록을 요청하세요. 관리자가 검토 후 승인합니다.
        </Alert>

        {/* Create/Edit Form Dialog */}
        <Dialog open={showForm} onClose={handleCancel} maxWidth="md" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              {editingRequest ? '프로젝트 등록 요청 수정' : '새 프로젝트 등록 요청'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  fullWidth
                  required
                  label="프로젝트명"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                />

                <FormControl fullWidth required>
                  <InputLabel>서비스 유형</InputLabel>
                  <Select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    label="서비스 유형"
                  >
                    <MenuItem value="MAINTENANCE">유지보수</MenuItem>
                    <MenuItem value="DEFECT_REPAIR">하자보수</MenuItem>
                    <MenuItem value="ETC">기타</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  required
                  type="date"
                  label="계약 시작일"
                  name="contractStartDate"
                  value={formData.contractStartDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  required
                  type="date"
                  label="계약 종료일"
                  name="contractEndDate"
                  value={formData.contractEndDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  required
                  type="number"
                  label="계약 m/d"
                  name="contractManDays"
                  value={formData.contractManDays}
                  onChange={handleInputChange}
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancel}>취소</Button>
              <Button type="submit" variant="contained">
                {editingRequest ? '수정' : '요청 제출'}
              </Button>
            </DialogActions>
          </form>
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
            slots={{
              toolbar: CustomToolbar,
            }}
            showToolbar
          />
        </Box>
      </Box>
    </Box>
  );
}

export default ProjectRequestList;
