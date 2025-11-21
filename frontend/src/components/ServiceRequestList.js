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
  Pause as HoldIcon,
  Visibility as ViewIcon,
  PersonRemove as UnassignIcon
} from '@mui/icons-material';
import { formatDateTime } from '../utils/dateFormatter';

function ServiceRequestList() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  const [resolvingRequest, setResolvingRequest] = useState(null);
  const [resolutionData, setResolutionData] = useState({
    hoursSpent: '',
    resolutionNotes: ''
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    customerId: '',
    projectId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Dynamically fetch projects when customer is selected (for ADMIN creating requests for customers)
  useEffect(() => {
    const fetchProjectsForCustomer = async () => {
      // Only for Admin when creating request for a customer
      if (user?.role !== 'ROLE_ADMIN') {
        return;
      }

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
        // Customer selected, load projects for that customer (mapped projects only)
        try {
          const customerResponse = await userAPI.getById(parseInt(formData.customerId));
          const customerData = customerResponse.data;

          // Get customer's assigned projects
          const userProjectsResponse = await userAPI.getProjects(parseInt(formData.customerId));
          const assignedProjectIds = userProjectsResponse.data;

          if (customerData.companyId && assignedProjectIds.length > 0) {
            const projectsResponse = await projectAPI.getByCompanyId(customerData.companyId);
            // Filter to only show assigned projects
            const assignedProjects = projectsResponse.data.filter(p => assignedProjectIds.includes(p.id));
            setProjects(assignedProjects);
          } else {
            setProjects([]);
          }
        } catch (err) {
          console.error('Failed to fetch projects for selected customer:', err);
          setProjects([]);
        }
      }
    };

    if (showForm && user?.role === 'ROLE_ADMIN') {
      fetchProjectsForCustomer();
    }
  }, [formData.customerId, showForm, user?.id, user?.role]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const requestsResponse = await serviceRequestAPI.getAll();
      setRequests(requestsResponse.data);

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

      // Fetch projects based on user's role
      if (user?.id) {
        try {
          if (user.role === 'ROLE_CUSTOMER') {
            // Customer: Only show assigned (mapped) projects
            const userProjectsResponse = await userAPI.getProjects(user.id);
            const assignedProjectIds = userProjectsResponse.data;

            const userResponse = await userAPI.getById(user.id);
            const userData = userResponse.data;

            if (userData.companyId && assignedProjectIds.length > 0) {
              const projectsResponse = await projectAPI.getByCompanyId(userData.companyId);
              // Filter to only show assigned projects
              const assignedProjects = projectsResponse.data.filter(p => assignedProjectIds.includes(p.id));
              setProjects(assignedProjects);
            } else {
              setProjects([]);
            }
          } else {
            // Admin/Manager: Show all projects from company
            const userResponse = await userAPI.getById(user.id);
            const userData = userResponse.data;

            if (userData.companyId) {
              const projectsResponse = await projectAPI.getByCompanyId(userData.companyId);
              setProjects(projectsResponse.data);
            } else {
              setProjects([]);
            }
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
        projectId: formData.projectId ? parseInt(formData.projectId) : null
      };

      console.log('=== Submitting Service Request ===');
      console.log('Form Data:', formData);
      console.log('Submit Data:', submitData);
      console.log('Editing Request:', editingRequest);

      if (editingRequest) {
        console.log('Updating request ID:', editingRequest.id);
        const response = await serviceRequestAPI.update(editingRequest.id, submitData);
        console.log('Update response:', response.data);
      } else {
        console.log('Creating new request');
        await serviceRequestAPI.create(submitData);
      }

      setFormData({
        title: '',
        description: '',
        status: 'OPEN',
        priority: 'MEDIUM',
        customerId: '',
        projectId: ''
      });
      setShowForm(false);
      setEditingRequest(null);
      await fetchData(); // Wait for data to load before closing
    } catch (err) {
      console.error('Submit error:', err);
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
      projectId: ''
    });
  };

  const handleStatusChange = async (requestId, newStatus) => {
    // If changing to RESOLVED, show dialog to collect hours and notes
    if (newStatus === 'RESOLVED') {
      setResolvingRequest(requestId);
      setShowResolutionDialog(true);
      return;
    }

    try {
      await serviceRequestAPI.updateStatus(requestId, newStatus);
      fetchData();
      setError(null);
    } catch (err) {
      setError('Failed to update status: ' + (err.response?.data || err.message));
    }
  };

  const handleResolve = async () => {
    if (!resolutionData.hoursSpent || !resolutionData.resolutionNotes) {
      setError('소요시간과 처리 내용을 모두 입력해주세요.');
      return;
    }

    try {
      await serviceRequestAPI.updateStatus(
        resolvingRequest,
        'RESOLVED',
        parseFloat(resolutionData.hoursSpent),
        resolutionData.resolutionNotes
      );
      setShowResolutionDialog(false);
      setResolvingRequest(null);
      setResolutionData({ hoursSpent: '', resolutionNotes: '' });
      fetchData();
      setError(null);
    } catch (err) {
      setError('완료 처리 실패: ' + (err.response?.data || err.message));
    }
  };

  const handleCancelResolve = () => {
    setShowResolutionDialog(false);
    setResolvingRequest(null);
    setResolutionData({ hoursSpent: '', resolutionNotes: '' });
  };

  const handleUnassign = async (requestId) => {
    if (!window.confirm('이 요청의 할당을 취소하시겠습니까? 상태가 OPEN으로 변경됩니다.')) {
      return;
    }

    try {
      await serviceRequestAPI.unassign(requestId);
      fetchData();
      setError(null);
    } catch (err) {
      setError('할당 취소 실패: ' + (err.response?.data || err.message));
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
    if (user?.role === 'ROLE_MANAGER') {
      // Manager can change status if:
      // 1. Request is assigned to them (managerId equals their ID)
      // 2. Request is not assigned to anyone yet (managerId is null) - they can take it
      // 3. Request is NOT assigned to another manager
      return request.managerId === user?.id || request.managerId === null;
    }
    return false;
  };

  const getStatusChip = (status) => {
    const colorMap = {
      'OPEN': 'primary',
      'IN_PROGRESS': 'info',
      'RESOLVED': 'success',
      'HOLD': 'warning',
      'CANCELLED': 'error'
    };
    const labelMap = {
      'OPEN': '대기',
      'IN_PROGRESS': '진행중',
      'RESOLVED': '완료',
      'HOLD': '보류',
      'CANCELLED': '취소'
    };
    return <Chip label={labelMap[status] || status} color={colorMap[status] || 'default'} size="small" />;
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
    { field: 'customerName', headerName: '요청자', flex: 1.3, minWidth: 130 },
    {
      field: 'projectName',
      headerName: '프로젝트',
      flex: 1.2,
      minWidth: 120,
      valueGetter: (value) => value || '없음'
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
      valueGetter: (value) => (value && value.trim() !== '') ? value : '미배정'
    },
    {
      field: 'createdAt',
      headerName: '생성일',
      flex: 1.5,
      minWidth: 180,
      valueFormatter: (value) => {
        if (!value) return '';
        return formatDateTime(value) || '';
      }
    },
    {
      field: 'hoursSpent',
      headerName: '소요시간(h)',
      flex: 0.8,
      minWidth: 100,
      valueFormatter: (value) => {
        if (!value) return '';
        return `${value}h`;
      }
    },
    {
      field: 'resolutionNotes',
      headerName: '처리 내용',
      flex: 1.5,
      minWidth: 150,
      valueGetter: (value) => value || ''
    },
    {
      field: 'actions',
      headerName: '작업',
      flex: 1.5,
      minWidth: 150,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        if (!params.row) return null;

        return (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '100%' }}>
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
                {/* Show Start button if not yet IN_PROGRESS and (not assigned or assigned to this manager) */}
                {params.row.status !== 'IN_PROGRESS' && (
                  <IconButton
                    size="small"
                    color="success"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(params.row.id, 'IN_PROGRESS');
                    }}
                    title="시작"
                  >
                    <StartIcon fontSize="small" />
                  </IconButton>
                )}
                {/* Only show Complete/Close/Unassign buttons if request is assigned to this manager */}
                {params.row.managerId === user?.id && (
                  <>
                    {params.row.status !== 'RESOLVED' && (
                      <IconButton
                        size="small"
                        color="info"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(params.row.id, 'RESOLVED');
                        }}
                        title="완료"
                      >
                        <CompleteIcon fontSize="small" />
                      </IconButton>
                    )}
                    {params.row.status !== 'HOLD' && (
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(params.row.id, 'HOLD');
                        }}
                        title="보류"
                      >
                        <HoldIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnassign(params.row.id);
                      }}
                      title="할당 취소"
                    >
                      <UnassignIcon fontSize="small" />
                    </IconButton>
                  </>
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
                    <InputLabel>요청자</InputLabel>
                    <Select
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleInputChange}
                      label="요청자"
                    >
                      <MenuItem value="">요청자 선택</MenuItem>
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
                      <MenuItem value="HOLD">보류</MenuItem>
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
                      {formatDateTime(selectedRequest.createdAt)}
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
                    <Typography variant="subtitle2" color="text.secondary">요청자</Typography>
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
                  {selectedRequest.hoursSpent && (
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">소요시간</Typography>
                      <Typography variant="body1">
                        {selectedRequest.hoursSpent}시간
                      </Typography>
                    </Grid>
                  )}
                  {selectedRequest.resolutionNotes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">처리 내용</Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedRequest.resolutionNotes}
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

        {/* Resolution Dialog */}
        <Dialog open={showResolutionDialog} onClose={handleCancelResolve} maxWidth="sm" fullWidth>
          <DialogTitle>서비스 요청 완료</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Alert severity="info">
                서비스 요청을 완료하려면 소요시간과 처리 내용을 입력해주세요.
              </Alert>
              <TextField
                fullWidth
                required
                type="number"
                label="소요시간 (시간)"
                value={resolutionData.hoursSpent}
                onChange={(e) => setResolutionData({ ...resolutionData, hoursSpent: e.target.value })}
                inputProps={{ step: "0.5", min: "0" }}
                helperText="예: 2.5시간"
              />
              <TextField
                fullWidth
                required
                multiline
                rows={4}
                label="처리 내용"
                value={resolutionData.resolutionNotes}
                onChange={(e) => setResolutionData({ ...resolutionData, resolutionNotes: e.target.value })}
                placeholder="수행한 작업 내용을 상세히 입력해주세요."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelResolve}>취소</Button>
            <Button
              onClick={handleResolve}
              variant="contained"
              color="success"
              disabled={!resolutionData.hoursSpent || !resolutionData.resolutionNotes}
            >
              완료 처리
            </Button>
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
            getRowId={(row) => row.id}
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
