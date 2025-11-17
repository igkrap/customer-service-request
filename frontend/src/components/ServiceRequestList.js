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

  const fetchData = async () => {
    try {
      setLoading(true);
      const requestsResponse = await serviceRequestAPI.getAll();
      setRequests(requestsResponse.data);

      // Fetch managers for the dropdown
      try {
        if (user?.role === 'ROLE_CUSTOMER') {
          if (user.id) {
            const userResponse = await userAPI.getById(user.id);
            const userData = userResponse.data;

            if (userData.managerIds && userData.managerIds.length > 0) {
              const managersResponse = await userAPI.getAllManagers();
              const assignedManagers = managersResponse.data.filter(m =>
                userData.managerIds.includes(m.id)
              );
              setManagers(assignedManagers);
            } else {
              setManagers([]);
            }
          }
        } else {
          const managersResponse = await userAPI.getAllManagers();
          setManagers(managersResponse.data);
        }
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
    if (window.confirm('Are you sure you want to delete this service request?')) {
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
    { field: 'id', headerName: 'ID', flex: 0.5, minWidth: 60 },
    { field: 'title', headerName: 'Title', flex: 2, minWidth: 150 },
    { field: 'customerName', headerName: 'Customer', flex: 1.2, minWidth: 120 },
    {
      field: 'projectName',
      headerName: 'Project',
      flex: 1.2,
      minWidth: 120,
      valueGetter: (params) => params.row.projectName || 'N/A'
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => getStatusChip(params.value)
    },
    {
      field: 'priority',
      headerName: 'Priority',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => getPriorityChip(params.value)
    },
    {
      field: 'managerName',
      headerName: 'Manager',
      flex: 1.2,
      minWidth: 120,
      valueGetter: (params) => params.row.managerName || 'Unassigned'
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      flex: 1,
      minWidth: 100,
      valueGetter: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1.5,
      minWidth: 150,
      sortable: false,
      renderCell: (params) => (
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
      )
    }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            Service Request Management
          </Typography>
          {!showForm && (user?.role === 'ROLE_CUSTOMER' || user?.role === 'ROLE_ADMIN') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowForm(true)}
            >
              Create New Request
            </Button>
          )}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Create/Edit Form Dialog */}
        <Dialog open={showForm} onClose={handleCancel} maxWidth="md" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              {editingRequest ? 'Edit Service Request' : 'Create New Service Request'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                {user?.role === 'ROLE_ADMIN' && customers.length > 0 && (
                  <FormControl fullWidth required>
                    <InputLabel>Customer</InputLabel>
                    <Select
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleInputChange}
                      label="Customer"
                    >
                      <MenuItem value="">Select a customer</MenuItem>
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
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />

                <FormControl fullWidth required>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    label="Priority"
                  >
                    <MenuItem value="LOW">Low</MenuItem>
                    <MenuItem value="MEDIUM">Medium</MenuItem>
                    <MenuItem value="HIGH">High</MenuItem>
                    <MenuItem value="URGENT">Urgent</MenuItem>
                  </Select>
                </FormControl>

                {user?.role === 'ROLE_ADMIN' && (
                  <FormControl fullWidth required>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      label="Status"
                    >
                      <MenuItem value="OPEN">Open</MenuItem>
                      <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                      <MenuItem value="RESOLVED">Resolved</MenuItem>
                      <MenuItem value="CLOSED">Closed</MenuItem>
                      <MenuItem value="CANCELLED">Cancelled</MenuItem>
                    </Select>
                  </FormControl>
                )}

                <FormControl fullWidth>
                  <InputLabel>Project</InputLabel>
                  <Select
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleInputChange}
                    label="Project"
                  >
                    <MenuItem value="">Select a project (optional)</MenuItem>
                    {projects.map(project => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.projectName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Manager</InputLabel>
                  <Select
                    name="managerId"
                    value={formData.managerId}
                    onChange={handleInputChange}
                    label="Manager"
                  >
                    <MenuItem value="">Select a manager (optional)</MenuItem>
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
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="submit" variant="contained">
                {editingRequest ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Detail View Dialog */}
        <Dialog open={showDetailDialog} onClose={() => setShowDetailDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Service Request Details</Typography>
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
                    <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                    <Typography variant="body1">
                      {new Date(selectedRequest.createdAt).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Title</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedRequest.title}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                    <Typography variant="body1">
                      {selectedRequest.description || 'No description provided'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
                    <Typography variant="body1">{selectedRequest.customerName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Manager</Typography>
                    <Typography variant="body1">{selectedRequest.managerName || 'Unassigned'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Project</Typography>
                    <Typography variant="body1">{selectedRequest.projectName || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {getStatusChip(selectedRequest.status)}
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {getPriorityChip(selectedRequest.priority)}
                    </Box>
                  </Grid>
                  {selectedRequest.resolvedAt && (
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">Resolved At</Typography>
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
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={requests}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
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
