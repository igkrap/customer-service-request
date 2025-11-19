import React, { useState, useEffect } from 'react';
import { projectAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Paper,
  Typography,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Button,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

function MyProjectList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get user's assigned projects
      const userProjectsResponse = await userAPI.getProjects(user.id);
      setSelectedProjects(userProjectsResponse.data);

      // Get available projects based on role
      if (user.role === 'ROLE_CUSTOMER') {
        // Customer: Only show projects from their company
        const userResponse = await userAPI.getById(user.id);
        const userData = userResponse.data;

        if (userData.companyId) {
          const projectsResponse = await projectAPI.getByCompanyId(userData.companyId);
          setProjects(projectsResponse.data);
        } else {
          setProjects([]);
          setError('You are not assigned to any company. Please contact the administrator.');
        }
      } else if (user.role === 'ROLE_MANAGER') {
        // Manager: Show all projects
        const projectsResponse = await projectAPI.getAll();
        setProjects(projectsResponse.data);
      }

      setError(null);
    } catch (err) {
      setError('Failed to fetch data: ' + (err.response?.data || err.message));
    } finally {
      setLoading(false);
    }
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
    try {
      setLoading(true);
      await userAPI.assignProjects(user.id, selectedProjects);
      setSuccess('Projects saved successfully!');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save projects: ' + (err.response?.data || err.message));
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading && projects.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
          My Projects
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {user.role === 'ROLE_CUSTOMER' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Select the projects from your company that you want to be associated with.
          </Alert>
        )}

        {user.role === 'ROLE_MANAGER' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Select the projects you want to manage.
          </Alert>
        )}

        {projects.length === 0 ? (
          <Typography color="text.secondary">
            No projects available.
          </Typography>
        ) : (
          <>
            <FormGroup>
              {projects.map(project => (
                <FormControlLabel
                  key={project.id}
                  control={
                    <Checkbox
                      checked={selectedProjects.includes(project.id)}
                      onChange={() => handleToggle(project.id)}
                      disabled={loading}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        {project.projectName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Company: {project.companyName} | Type: {project.serviceType} |
                        Contract: {new Date(project.contractStartDate).toLocaleDateString()} - {new Date(project.contractEndDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={loading}
              >
                Save Selected Projects
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default MyProjectList;
