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
import { DataGrid } from '@mui/x-data-grid';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';

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
        setError('Failed to fetch data: ' + err.message);
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
        setSuccess('Project request approved successfully! Project has been created.');
      } else {
        await projectRequestAPI.reject(selectedRequest.id, approvalNotes);
        setSuccess('Project request rejected.');
      }

      setShowApprovalDialog(false);
      setSelectedRequest(null);
      setApprovalNotes('');
      setApprovalAction(null);
      fetchData();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to process approval: ' + (err.response?.data || err.message));
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
    return <Chip label={status} color={colorMap[status] || 'default'} size="small" />;
  };

  const columns = [
    { field: 'id', headerName: 'ID', flex: 0.5, minWidth: 60 },
    { field: 'requestedByUsername', headerName: 'Requested By', flex: 1.2, minWidth: 120 },
    { field: 'companyName', headerName: 'Company', flex: 1.5, minWidth: 120 },
    { field: 'projectName', headerName: 'Project Name', flex: 2, minWidth: 150 },
    {
      field: 'serviceType',
      headerName: 'Service Type',
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => params.value === 'MAINTENANCE' ? '유지보수' : '하자보수'
    },
    {
      field: 'contractStartDate',
      headerName: 'Start Date',
      flex: 1,
      minWidth: 100,
      valueGetter: (params) => params.value ? new Date(params.value).toLocaleDateString() : ''
    },
    {
      field: 'contractManDays',
      headerName: 'Man-Days',
      flex: 0.8,
      minWidth: 80
    },
    {
      field: 'requestStatus',
      headerName: 'Status',
      flex: 1,
      minWidth: 100,
      renderCell: (params) => params.value ? getStatusChip(params.value) : null
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      flex: 1,
      minWidth: 100,
      valueGetter: (params) => params.value ? new Date(params.value).toLocaleDateString() : ''
    },
    {
      field: 'actions',
      headerName: 'Actions',
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
              title="Approve"
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
              title="Reject"
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
              title="View Details"
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      }
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
            Project Request Approval
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Alert severity="info" sx={{ mb: 2 }}>
          Review and approve or reject project requests from customers. Approved requests will create new projects.
        </Alert>

        {/* Approval Dialog */}
        <Dialog open={showApprovalDialog} onClose={() => setShowApprovalDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {approvalAction === 'approve' ? 'Approve Project Request' : 'Reject Project Request'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedRequest?.projectName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Company: {selectedRequest?.companyName}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes (Optional)"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                sx={{ mt: 2 }}
                placeholder={approvalAction === 'approve' ?
                  'Add any notes about the approval...' :
                  'Please provide a reason for rejection...'}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowApprovalDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              color={approvalAction === 'approve' ? 'success' : 'error'}
              onClick={handleSubmitApproval}
            >
              {approvalAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Detail View Dialog */}
        <Dialog open={showDetailDialog} onClose={() => setShowDetailDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Project Request Details</Typography>
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
                    <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                    <Box sx={{ mt: 0.5 }}>
                      {getStatusChip(selectedRequest.requestStatus)}
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Requested By</Typography>
                    <Typography variant="body1">{selectedRequest.requestedByUsername}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Company</Typography>
                    <Typography variant="body1">{selectedRequest.companyName}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Project Name</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedRequest.projectName}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Service Type</Typography>
                    <Typography variant="body1">
                      {selectedRequest.serviceType === 'MAINTENANCE' ? '유지보수 (Maintenance)' : '하자보수 (Defect Repair)'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Contract Man-Days</Typography>
                    <Typography variant="body1">{selectedRequest.contractManDays}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Contract Start Date</Typography>
                    <Typography variant="body1">
                      {new Date(selectedRequest.contractStartDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Contract End Date</Typography>
                    <Typography variant="body1">
                      {new Date(selectedRequest.contractEndDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
                    <Typography variant="body1">
                      {new Date(selectedRequest.createdAt).toLocaleString()}
                    </Typography>
                  </Grid>
                  {selectedRequest.approvedByUsername && (
                    <>
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">
                          {selectedRequest.requestStatus === 'APPROVED' ? 'Approved By' : 'Rejected By'}
                        </Typography>
                        <Typography variant="body1">{selectedRequest.approvedByUsername}</Typography>
                      </Grid>
                      {selectedRequest.approvalNotes && (
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
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
                  Approve
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
                  Reject
                </Button>
              </>
            )}
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

export default ProjectRequestApproval;
