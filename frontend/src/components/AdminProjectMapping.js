import React, { useState, useEffect } from 'react';
import { projectAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
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
  const { user: currentUser } = useAuth();
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
    console.log('=== AdminProjectMapping currentUser changed ===');
    console.log('currentUser:', currentUser);
    console.log('currentUser.id (type):', typeof currentUser?.id, currentUser?.id);
    console.log('currentUser.role:', currentUser?.role);
  }, [currentUser]);

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
    const selectedUser = users.find(u => u.id === parseInt(selectedUserId));

    console.log('=== handleToggle Debug ===');
    console.log('currentUser:', currentUser);
    console.log('selectedUser:', selectedUser);
    console.log('selectedUser.role:', selectedUser?.role);
    console.log('currentUser.role:', currentUser?.role);
    console.log('selectedUser.id (type):', typeof selectedUser?.id, selectedUser?.id);
    console.log('currentUser.id (type):', typeof currentUser?.id, currentUser?.id);
    console.log('ID match:', selectedUser?.id === currentUser?.id);
    console.log('ID match (number):', parseInt(selectedUserId) === Number(currentUser?.id));

    // Check if manager is selecting themselves
    // Use parseInt to ensure proper comparison
    const selectedUserIdNum = parseInt(selectedUserId);
    const currentUserIdNum = Number(currentUser?.id);

    const isManagerSelectingSelf = selectedUser && currentUser &&
        selectedUser.role === 'ROLE_MANAGER' &&
        currentUser.role === 'ROLE_MANAGER' &&
        selectedUserIdNum === currentUserIdNum;

    console.log('isManagerSelectingSelf:', isManagerSelectingSelf);

    if (isManagerSelectingSelf) {
      console.log('❌ Manager selecting self - BLOCKING toggle');
      alert('매니저는 자신의 프로젝트 할당을 수정할 수 없습니다.');
      return;
    }

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

    // Additional check: prevent manager from modifying their own projects
    const selectedUser = users.find(u => u.id === parseInt(selectedUserId));
    const selectedUserIdNum = parseInt(selectedUserId);
    const currentUserIdNum = Number(currentUser?.id);

    if (selectedUser && currentUser &&
        selectedUser.role === 'ROLE_MANAGER' &&
        currentUser.role === 'ROLE_MANAGER' &&
        selectedUserIdNum === currentUserIdNum) {
      setError('매니저는 자신의 프로젝트 할당을 수정할 수 없습니다.');
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  const filteredProjects = getFilteredProjects();
  const selectedUser = users.find(u => u.id === parseInt(selectedUserId));

  return (
    <Box sx={{ p: 1, height: '100%' }}>
      <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
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
          <br />
          <strong>참고:</strong> 매니저는 자신의 프로젝트 할당을 수정할 수 없습니다.
        </Alert>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth sx={{ minWidth: 300, maxWidth: 600 }}>
              <InputLabel>사용자 선택</InputLabel>
              <Select
                value={selectedUserId}
                onChange={handleUserChange}
                label="사용자 선택"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 400,
                      width: 600
                    }
                  }
                }}
              >
                <MenuItem value="">
                  <em>사용자를 선택하세요...</em>
                </MenuItem>
                {users.map(user => (
                  <MenuItem key={user.id} value={user.id} sx={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>
                    {user.username} - {user.email} ({user.role})
                    {user.companyName && ` - ${user.companyName}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />

            {selectedUserId ? (
              <>
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
                      {filteredProjects.map(project => {
                        // Check if manager is selecting themselves
                        const selectedUserIdNum = parseInt(selectedUserId);
                        const currentUserIdNum = Number(currentUser?.id);

                        const isManagerSelectingSelf = selectedUser && currentUser &&
                                                        selectedUser.role === 'ROLE_MANAGER' &&
                                                        currentUser.role === 'ROLE_MANAGER' &&
                                                        selectedUserIdNum === currentUserIdNum;

                        if (isManagerSelectingSelf) {
                          console.log('=== Rendering checkbox for project:', project.projectName);
                          console.log('isManagerSelectingSelf:', isManagerSelectingSelf);
                          console.log('selectedUserIdNum:', selectedUserIdNum);
                          console.log('currentUserIdNum:', currentUserIdNum);
                          console.log('Match:', selectedUserIdNum === currentUserIdNum);
                        }

                        return (
                          <FormControlLabel
                            key={project.id}
                            control={
                              <Checkbox
                                checked={selectedProjects.includes(project.id)}
                                onChange={() => handleToggle(project.id)}
                                disabled={saving || isManagerSelectingSelf}
                              />
                            }
                            label={
                              <Box>
                                <Typography variant="body1">
                                  {project.projectName}
                                  {isManagerSelectingSelf && (
                                    <Typography component="span" variant="caption" color="error" sx={{ ml: 1 }}>
                                      (매니저는 자신의 프로젝트를 수정할 수 없습니다)
                                    </Typography>
                                  )}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  회사: {project.companyName} | 유형: {project.serviceType} |
                                  계약기간: {new Date(project.contractStartDate).toLocaleDateString()} - {new Date(project.contractEndDate).toLocaleDateString()} |
                                  인일: {project.contractManDays}
                                </Typography>
                              </Box>
                            }
                          />
                        );
                      })}
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
                        disabled={
                          saving ||
                          (selectedUser && currentUser &&
                           selectedUser.role === 'ROLE_MANAGER' &&
                           currentUser.role === 'ROLE_MANAGER' &&
                           parseInt(selectedUserId) === Number(currentUser.id))
                        }
                      >
                        {saving ? '저장 중...' : '프로젝트 할당 저장'}
                      </Button>
                    </Box>
                  </>
                )}
              </>
            ) : (
              <Box>
                <Alert severity="info" sx={{ mb: 3 }}>
                  위에서 사용자를 선택하면 해당 사용자에게 프로젝트를 할당할 수 있습니다.
                </Alert>

                {projects.length > 0 && (
                  <>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      전체 프로젝트 목록 ({projects.length})
                    </Typography>
                    <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {projects.map(project => (
                        <Box key={project.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {project.projectName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            회사: {project.companyName} | 유형: {project.serviceType} |
                            계약기간: {new Date(project.contractStartDate).toLocaleDateString()} - {new Date(project.contractEndDate).toLocaleDateString()} |
                            인일: {project.contractManDays}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default AdminProjectMapping;
