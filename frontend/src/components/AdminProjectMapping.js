import React, { useState, useEffect } from 'react';
import { projectAPI, userAPI } from '../services/api';
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Grid
} from '@mui/material';
import { Save as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material';

function AdminProjectMapping() {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserProjects();
    } else {
      setSelectedProjects([]);
    }
  }, [selectedUserId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get all users
      const usersResponse = await userAPI.getAll();
      setUsers(usersResponse.data);

      // Get all projects
      const projectsResponse = await projectAPI.getAll();
      setProjects(projectsResponse.data);

      setError(null);
    } catch (err) {
      setError('Failed to fetch data: ' + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProjects = async () => {
    try {
      const userProjectsResponse = await userAPI.getProjects(selectedUserId);
      setSelectedProjects(userProjectsResponse.data);
    } catch (err) {
      console.error('Failed to fetch user projects:', err);
      setSelectedProjects([]);
    }
  };

  const handleUserChange = (event) => {
    setSelectedUserId(event.target.value);
    setSuccess(null);
  };

  const handleToggle = (projectId) => {
    setSelectedProjects(prev => {
      if (prev.includes(projectId)) {
        return prev.filter(id => id !== projectId);
      } else {
        return [...prev, projectId];
      }
    });
  };

  const handleSave = async () => {
    if (!selectedUserId) {
      setError('Please select a user first');
      return;
    }

    try {
      setSaving(true);
      await userAPI.assignProjects(selectedUserId, selectedProjects);
      setSuccess('Projects assigned successfully!');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to assign projects: ' + (err.response?.data || err.message));
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  };

  const getFilteredProjects = () => {
    if (!selectedUserId) return [];

    const selectedUser = users.find(u => u.id === parseInt(selectedUserId));
    if (!selectedUser) return [];

    // If user is a customer, only show projects from their company
    if (selectedUser.role === 'ROLE_CUSTOMER') {
      return projects.filter(p => p.companyId === selectedUser.companyId);
    }

    // If user is a manager or admin, show all projects
    return projects;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const filteredProjects = getFilteredProjects();
  const selectedUser = users.find(u => u.id === parseInt(selectedUserId));

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            User-Project Mapping Management
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Alert severity="info" sx={{ mb: 3 }}>
          Select a user and assign projects to them. Customers can only be assigned projects from their company, while Managers can be assigned any project.
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Select User</InputLabel>
              <Select
                value={selectedUserId}
                onChange={handleUserChange}
                label="Select User"
              >
                <MenuItem value="">
                  <em>Select a user...</em>
                </MenuItem>
                {users.map(user => (
                  <MenuItem key={user.id} value={user.id}>
                    {user.username} - {user.email} ({user.role})
                    {user.companyName && ` - ${user.companyName}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {selectedUserId && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />

              {selectedUser && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Managing projects for: <strong>{selectedUser.username}</strong> ({selectedUser.role})
                  {selectedUser.companyName && ` from ${selectedUser.companyName}`}
                </Alert>
              )}

              {filteredProjects.length === 0 ? (
                <Typography color="text.secondary">
                  No projects available for this user.
                </Typography>
              ) : (
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Available Projects ({filteredProjects.length})
                  </Typography>

                  <FormGroup>
                    {filteredProjects.map(project => (
                      <FormControlLabel
                        key={project.id}
                        control={
                          <Checkbox
                            checked={selectedProjects.includes(project.id)}
                            onChange={() => handleToggle(project.id)}
                            disabled={saving}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body1">
                              {project.projectName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Company: {project.companyName} | Type: {project.serviceType} |
                              Contract: {new Date(project.contractStartDate).toLocaleDateString()} - {new Date(project.contractEndDate).toLocaleDateString()} |
                              Man-days: {project.contractManDays}
                            </Typography>
                          </Box>
                        }
                      />
                    ))}
                  </FormGroup>

                  <Divider sx={{ my: 3 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {selectedProjects.length} project(s) selected
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Project Assignment'}
                    </Button>
                  </Box>
                </>
              )}
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
}

export default AdminProjectMapping;
