import React, { useState, useEffect } from 'react';
import { serviceRequestAPI, userAPI, projectAPI } from '../services/api';
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
  Grid,
  Divider,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  Check as CompleteIcon,
  Close as CloseIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

function ServiceRequestList() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    customerId: '',
    managerId: '',
    projectId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Dynamically fetch projects when customer is selected (for ADMIN creating requests for customers)
  useEffect(() => {
    const fetchProjectsForCustomer = async () => {
      if (!formData.customerId) {
        // No customer selected, load projects based on logged-in user
        if (user?.id) {
          try {
            const userResponse = await userAPI.getById(user.id);
            const userData = userResponse.data;

            if (userData.companyId) {
              const projectsResponse = await projectAPI.getByCompanyId(userData.companyId);
              setProjects(projectsResponse.data);
            } else {
              setProjects([]);
            }
          } catch (err) {
            console.error('Failed to fetch projects:', err);
          }
        }
      } else {
        // Customer selected, load projects for that customer's company
        try {
          const customerResponse = await userAPI.getById(parseInt(formData.customerId));
          const customerData = customerResponse.data;

          if (customerData.companyId) {
            const projectsResponse = await projectAPI.getByCompanyId(customerData.companyId);
            setProjects(projectsResponse.data);
          } else {
            setProjects([]);
          }
        } catch (err) {
          console.error('Failed to fetch projects for selected customer:', err);
          setProjects([]);
        }
      }
    };

    if (showForm) {
      fetchProjectsForCustomer();
    }
  }, [formData.customerId, showForm, user?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const requestsResponse = await serviceRequestAPI.getAll();
      setRequests(requestsResponse.data);

      // Fetch managers for the dropdown
      try {
        const managersResponse = await userAPI.getAllManagers();
        setManagers(managersResponse.data);
      } catch (err) {
        if (err.response?.status !== 403) {
          console.error('Failed to fetch managers:', err);
        }
      }

      // Fetch all users (customers) if admin
      if (user?.role === 'ROLE_ADMIN') {
        try {
          const usersResponse = await userAPI.getAll();
          setCustomers(usersResponse.data.filter(u => u.role === 'ROLE_CUSTOMER'));
        } catch (err) {
          if (err.response?.status !== 403) {
            console.error('Failed to fetch customers:', err);
          }
        }
      }

      // Fetch projects based on user's company
      if (user?.id) {
        try {
          const userResponse = await userAPI.getById(user.id);
          const userData = userResponse.data;

          if (userData.companyId) {
            const projectsResponse = await projectAPI.getByCompanyId(userData.companyId);
            setProjects(projectsResponse.data);
          } else {
            setProjects([]);
          }
        } catch (err) {
          if (err.response?.status !== 403) {
            console.error('Failed to fetch projects:', err);
          }
        }
      }

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
    const { name, value } = e.target;

    // If customer changes, clear the selected project (since projects are company-specific)
    if (name === 'customerId') {
      setFormData({
        ...formData,
        [name]: value,
        projectId: ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        customerId: parseInt(formData.customerId || user?.id),
        managerId: formData.managerId ? parseInt(formData.managerId) : null,
        projectId: formData.projectId ? parseInt(formData.projectId) : null
      };

      if (editingRequest) {
        await serviceRequestAPI.update(editingRequest.id, submitData);
      } else {
        await serviceRequestAPI.create(submitData);
      }

      setFormData({
        title: '',
        description: '',
        status: 'OPEN',
        priority: 'MEDIUM',
        customerId: '',
        managerId: '',
        projectId: ''
      });
      setShowForm(false);
      setEditingRequest(null);
      fetchData();
    } catch (err) {
      setError('Failed to save service request: ' + err.message);
    }
  };

  const handleEdit = (request) => {
    setEditingRequest(request);
    setFormData({
      title: request.title,
      description: request.description || '',
      status: request.status,
      priority: request.priority,
      customerId: request.customerId.toString(),
      managerId: request.managerId ? request.managerId.toString() : '',
      projectId: request.projectId ? request.projectId.toString() : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('이 서비스 요청을 삭제하시겠습니까?')) {
      try {
        await serviceRequestAPI.delete(id);
        fetchData();
      } catch (err) {
        setError('Failed to delete service request: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRequest(null);
    setFormData({
      title: '',
      description: '',
      status: 'OPEN',
      priority: 'MEDIUM',
      customerId: '',
      managerId: '',
      projectId: ''
    });
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await serviceRequestAPI.updateStatus(requestId, newStatus);
      fetchData();
      setError(null);
    } catch (err) {
      setError('Failed to update status: ' + (err.response?.data || err.message));
    }
  };

  const handleRowClick = (params) => {
    setSelectedRequest(params.row);
    setShowDetailDialog(true);
  };

  const canEditRequest = (request) => {
    if (user?.role === 'ROLE_ADMIN') return true;
    if (user?.role === 'ROLE_CUSTOMER' && request.customerId === user?.id) return true;
    return false;
  };

  const canChangeStatus = (request) => {
    if (user?.role === 'ROLE_ADMIN') return true;
    if (user?.role === 'ROLE_MANAGER' && request.managerId === user?.id) return true;
    return false;
  };

  const getStatusChip = (status) => {
    const colorMap = {
      'OPEN': 'primary',
      'IN_PROGRESS': 'info',
      'RESOLVED': 'success',
      'CLOSED': 'default',
      'CANCELLED': 'error'
    };
    return <Chip label={status} color={colorMap[status] || 'default'} size="small" />;
  };

  const getPriorityChip = (priority) => {
    const colorMap = {
      'LOW': 'default',
      'MEDIUM': 'info',
      'HIGH': 'warning',
      'URGENT': 'error'
    };
    return <Chip label={priority} color={colorMap[priority] || 'default'} size="small" />;
  };

  const columns = [
    { field: 'id', headerName: '요청 ID', flex: 0.6, minWidth: 70 },
    { field: 'title', headerName: '제목', flex: 2, minWidth: 150 },
    { field: 'customerName', headerName: '고객', flex: 1.3, minWidth: 130 },
    {
      field: 'projectName',
      headerName: '프로젝트',
      flex: 1.2,
      minWidth: 120,
      valueGetter: (params) => params.row?.projectName || '없음'
    },
    {
      field: 'status',
      headerName: '상태',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => params.value ? getStatusChip(params.value) : null
    },
    {
      field: 'priority',
      headerName: '우선순위',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => params.value ? getPriorityChip(params.value) : null
    },
    {
      field: 'managerName',
      headerName: '담당자',
      flex: 1.3,
      minWidth: 130,
      valueGetter: (params) => {
        const name = params.row?.managerName;
        return (name && name.trim() !== '') ? name : '미배정';
      }
    },
    {
      field: 'createdAt',
      headerName: '생성일',
      flex: 1,
      minWidth: 100,
      valueGetter: (params) => {
        if (!params.row || !params.value) return '';
        return new Date(params.value).toLocaleDateString();
      }
    },
    {
      field: 'actions',
      headerName: '작업',
      flex: 1.5,
      minWidth: 150,
      sortable: false,
      renderCell: (params) => {
        if (!params.row) return null;

        return (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {canEditRequest(params.row) && (
              <>
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
              </>
            )}
            {canChangeStatus(params.row) && user?.role === 'ROLE_MANAGER' && (
              <>
                {params.row.status !== 'IN_PROGRESS' && (
                  <IconButton
                    size="small"
                    color="success"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(params.row.id, 'IN_PROGRESS');
                    }}
                    title="Start"
                  >
                    <StartIcon fontSize="small" />
                  </IconButton>
                )}
                {params.row.status !== 'RESOLVED' && (
                  <IconButton
                    size="small"
                    color="info"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(params.row.id, 'RESOLVED');
                    }}
                    title="Complete"
                  >
                    <CompleteIcon fontSize="small" />
                  </IconButton>
                )}
                {params.row.status !== 'CLOSED' && (
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(params.row.id, 'CLOSED');
                    }}
                    title="Close"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </>
            )}
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
            서비스 요청 관리
          </Typography>
          {!showForm && (user?.role === 'ROLE_CUSTOMER' || user?.role === 'ROLE_ADMIN') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowForm(true)}
            >
              새 요청 생성
            </Button>
          )}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Create/Edit Form Dialog */}
        <Dialog open={showForm} onClose={handleCancel} maxWidth="md" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              {editingRequest ? '서비스 요청 수정' : '새 서비스 요청 생성'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                {user?.role === 'ROLE_ADMIN' && customers.length > 0 && (
                  <FormControl fullWidth required>
                    <InputLabel>고객</InputLabel>
                    <Select
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleInputChange}
                      label="고객"
                    >
                      <MenuItem value="">고객 선택</MenuItem>
                      {customers.map(c => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.username} - {c.email}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <TextField
                  fullWidth
                  required
                  label="제목"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="설명"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />

                <FormControl fullWidth required>
                  <InputLabel>우선순위</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    label="우선순위"
                  >
                    <MenuItem value="LOW">낮음</MenuItem>
                    <MenuItem value="MEDIUM">보통</MenuItem>
                    <MenuItem value="HIGH">높음</MenuItem>
                    <MenuItem value="URGENT">긴급</MenuItem>
                  </Select>
                </FormControl>

                {user?.role === 'ROLE_ADMIN' && (
                  <FormControl fullWidth required>
                    <InputLabel>상태</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      label="상태"
                    >
                      <MenuItem value="OPEN">열림</MenuItem>
                      <MenuItem value="IN_PROGRESS">진행중</MenuItem>
                      <MenuItem value="RESOLVED">해결됨</MenuItem>
                      <MenuItem value="CLOSED">종료됨</MenuItem>
                      <MenuItem value="CANCELLED">취소됨</MenuItem>
                    </Select>
                  </FormControl>
                )}

                <FormControl fullWidth>
                  <InputLabel>프로젝트</InputLabel>
                  <Select
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleInputChange}
                    label="프로젝트"
                  >
                    <MenuItem value="">프로젝트 선택 (선택사항)</MenuItem>
                    {projects.map(project => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.projectName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>담당 매니저</InputLabel>
                  <Select
                    name="managerId"
                    value={formData.managerId}
                    onChange={handleInputChange}
                    label="담당 매니저"
                  >
                    <MenuItem value="">담당 매니저 선택 (선택사항)</MenuItem>
                    {managers.map(m => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.username} - {m.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancel}>취소</Button>
              <Button type="submit" variant="contained">
                {editingRequest ? '수정' : '생성'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Detail View Dialog */}
        <Dialog open={showDetailDialog} onClose={() => setShowDetailDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">서비스 요청 상세</Typography>
              <IconButton onClick={() => setShowDetailDialog(false)}>
                <CloseIcon />
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
                    <Typography variant="subtitle2" color="text.secondary">생성일</Typography>
                    <Typography variant="body1">
                      {new Date(selectedRequest.createdAt).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">제목</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedRequest.title}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">설명</Typography>
                    <Typography variant="body1">
                      {selectedRequest.description || '설명이 제공되지 않았습니다'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">고객</Typography>
                    <Typography variant="body1">{selectedRequest.customerName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">담당자</Typography>
                    <Typography variant="body1">{selectedRequest.managerName && selectedRequest.managerName.trim() !== '' ? selectedRequest.managerName : '미배정'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">프로젝트</Typography>
                    <Typography variant="body1">{selectedRequest.projectName || '없음'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">상태</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {getStatusChip(selectedRequest.status)}
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">우선순위</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {getPriorityChip(selectedRequest.priority)}
                    </Box>
                  </Grid>
                  {selectedRequest.resolvedAt && (
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">해결일</Typography>
                      <Typography variant="body1">
                        {new Date(selectedRequest.resolvedAt).toLocaleString()}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDetailDialog(false)}>Close</Button>
          </DialogActions>
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
            onRowClick={handleRowClick}
            sx={{
              '& .MuiDataGrid-row:hover': {
                cursor: 'pointer',
                backgroundColor: 'action.hover'
              }
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}

export default ServiceRequestList;
