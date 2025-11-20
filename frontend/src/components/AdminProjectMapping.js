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
      setError('데이터 가져오기 실패: ' + (err.response?.data || err.message));
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
      setError('먼저 사용자를 선택하세요');
      return;
    }

    try {
      setSaving(true);
      await userAPI.assignProjects(selectedUserId, selectedProjects);
      setSuccess('프로젝트가 성공적으로 할당되었습니다!');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('프로젝트 할당 실패: ' + (err.response?.data || err.message));
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
    <Box sx={{ p: 3, height: '100%' }}>
      <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">
            사용자-프로젝트 매핑 관리
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            disabled={loading}
          >
            새로고침
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Alert severity="info" sx={{ mb: 3 }}>
          사용자를 선택하고 프로젝트를 할당하세요. 고객은 자신의 회사 프로젝트만 할당할 수 있으며, 매니저는 모든 프로젝트를 할당받을 수 있습니다.
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>사용자 선택</InputLabel>
              <Select
                value={selectedUserId}
                onChange={handleUserChange}
                label="사용자 선택"
              >
                <MenuItem value="">
                  <em>사용자를 선택하세요...</em>
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
                  프로젝트 관리 대상: <strong>{selectedUser.username}</strong> ({selectedUser.role})
                  {selectedUser.companyName && ` - ${selectedUser.companyName}`}
                </Alert>
              )}

              {filteredProjects.length === 0 ? (
                <Typography color="text.secondary">
                  이 사용자에게 사용 가능한 프로젝트가 없습니다.
                </Typography>
              ) : (
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    사용 가능한 프로젝트 ({filteredProjects.length})
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
                              회사: {project.companyName} | 유형: {project.serviceType} |
                              계약기간: {new Date(project.contractStartDate).toLocaleDateString()} - {new Date(project.contractEndDate).toLocaleDateString()} |
                              인일: {project.contractManDays}
                            </Typography>
                          </Box>
                        }
                      />
                    ))}
                  </FormGroup>

                  <Divider sx={{ my: 3 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {selectedProjects.length}개 프로젝트 선택됨
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? '저장 중...' : '프로젝트 할당 저장'}
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
