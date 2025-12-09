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
  Alert,
  CircularProgress
} from '@mui/material';

function MyProjectList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get user's assigned projects
      const userProjectsResponse = await userAPI.getProjects(user.id);
      const assignedProjectIds = userProjectsResponse.data;
      setSelectedProjects(assignedProjectIds);

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
        // Manager: Only show assigned projects (read-only)
        if (assignedProjectIds.length > 0) {
          const allProjectsResponse = await projectAPI.getAll();
          const assignedProjects = allProjectsResponse.data.filter(p => assignedProjectIds.includes(p.id));
          setProjects(assignedProjects);
        } else {
          setProjects([]);
        }
      }

      setError(null);
    } catch (err) {
      setError('데이터 가져오기 실패: ' + (err.response?.data || err.message));
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
          프로젝트 조회
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3, display: 'flex', flexDirection: 'column' }}>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {(user.role === 'ROLE_CUSTOMER' || user.role === 'ROLE_MANAGER') && (
          <Alert severity="info" sx={{ mb: 2 }}>
            관리자가 할당한 프로젝트 목록입니다. (조회 전용)
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
                      disabled={true}
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
          </>
        )}
      </Box>
    </Box>
  );
}

export default MyProjectList;
