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
          setError('회사에 할당되지 않았습니다. 관리자에게 문의하세요.');
        }
      } else if (user.role === 'ROLE_MANAGER') {
        // Manager: Show all projects
        const projectsResponse = await projectAPI.getAll();
        setProjects(projectsResponse.data);
      }

      setError(null);
    } catch (err) {
      setError('데이터 가져오기 실패: ' + (err.response?.data || err.message));
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
      setSuccess('프로젝트가 성공적으로 저장되었습니다!');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('프로젝트 저장 실패: ' + (err.response?.data || err.message));
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading && projects.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1, height: '100%' }}>
      <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
          내 프로젝트
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {user.role === 'ROLE_CUSTOMER' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            관리자가 할당한 프로젝트 목록입니다. (조회 전용)
          </Alert>
        )}

        {user.role === 'ROLE_MANAGER' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            관리하고 싶은 프로젝트를 선택하세요.
          </Alert>
        )}

        {projects.length === 0 ? (
          <Typography color="text.secondary">
            사용 가능한 프로젝트가 없습니다.
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
                      disabled={loading || user.role === 'ROLE_CUSTOMER'}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        {project.projectName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        회사: {project.companyName} | 유형: {project.serviceType} |
                        계약기간: {new Date(project.contractStartDate).toLocaleDateString()} - {new Date(project.contractEndDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>

            {user.role === 'ROLE_MANAGER' && (
              <>
                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={loading}
                  >
                    선택한 프로젝트 저장
                  </Button>
                </Box>
              </>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}

export default MyProjectList;
