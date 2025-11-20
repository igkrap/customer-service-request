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
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { formatDateTime } from '../utils/dateFormatter';

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
        return value === 'MAINTENANCE' ? '유지보수' : value === 'DEFECT_REPAIR' ? '하자보수' : '';
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
      headerName: '맨데이',
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
          <Box sx={{ display: 'flex', gap: 0.5 }}>
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1, height: '100%' }}>
      <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
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
                  label="계약 맨데이"
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
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            autoHeight={false}
          />
        </Box>
      </Paper>
    </Box>
  );
}

export default ProjectRequestList;
