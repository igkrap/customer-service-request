import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { Save as SaveIcon, Search as SearchIcon } from '@mui/icons-material';
import { projectAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getServiceTypeLabel } from '../utils/serviceTypeLabel';
import PageHeader, { PageActionButton } from './common/PageHeader';
import { EmptyState, PageBody, RecordListItem, SectionPanel } from './common/WorkspaceLayout';

function AdminProjectMapping() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [projectQuery, setProjectQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searched, setSearched] = useState(false);

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('ko-KR');
  };

  const fetchData = useCallback(async () => {
    if (!currentUser) return;

    try {
      setSearched(true);
      setLoading(true);
      setError(null);

      const usersResponse = await userAPI.getAll();
      setUsers(usersResponse.data || []);

      if (currentUser.role === 'ROLE_MANAGER') {
        const assignedProjectIdsResponse = await userAPI.getProjects(currentUser.id);
        const assignedProjectIds = assignedProjectIdsResponse.data || [];
        if (assignedProjectIds.length > 0) {
          const allProjectsResponse = await projectAPI.getAll();
          setProjects((allProjectsResponse.data || []).filter((project) => assignedProjectIds.includes(project.id)));
        } else {
          setProjects([]);
        }
      } else {
        const projectsResponse = await projectAPI.getAll();
        setProjects(projectsResponse.data || []);
      }
    } catch (err) {
      setError(`데이터를 불러오지 못했습니다: ${err.response?.data || err.message}`);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchUserProjects = useCallback(async () => {
    if (!selectedUserId) {
      setSelectedProjects([]);
      return;
    }

    try {
      const userProjectsResponse = await userAPI.getProjects(selectedUserId);
      setSelectedProjects(userProjectsResponse.data || []);
    } catch (err) {
      setSelectedProjects([]);
    }
  }, [selectedUserId]);

  useEffect(() => {
    fetchUserProjects();
  }, [fetchUserProjects]);

  const selectedUser = users.find((user) => user.id === Number(selectedUserId));

  const filteredProjects = useMemo(() => {
    if (!selectedUserId || !selectedUser) return [];

    if (selectedUser.role === 'ROLE_CUSTOMER') {
      return projects.filter((project) => project.companyId === selectedUser.companyId);
    }

    return projects;
  }, [projects, selectedUser, selectedUserId]);

  const visibleProjects = useMemo(() => {
    const query = projectQuery.trim().toLowerCase();
    if (!query) return filteredProjects;

    return filteredProjects.filter((project) => (
      [project.projectName, project.companyName, getServiceTypeLabel(project.serviceType)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    ));
  }, [filteredProjects, projectQuery]);

  const handleUserChange = (event) => {
    setSelectedUserId(event.target.value);
    setProjectQuery('');
    setSuccess(null);
    setError(null);
  };

  const handleToggle = (projectId) => {
    setSelectedProjects((prev) => (
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    ));
  };

  const handleSave = async () => {
    if (!selectedUserId) {
      setError('먼저 사용자를 선택하세요.');
      return;
    }

    try {
      setSaving(true);
      await userAPI.assignProjects(selectedUserId, selectedProjects);
      setSuccess('프로젝트 할당이 저장되었습니다.');
      setError(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`프로젝트 할당 저장에 실패했습니다: ${err.response?.data || err.message}`);
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  const canEdit = currentUser?.role === 'ROLE_ADMIN';

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="사용자별 프로젝트 등록"
        subtitle="사용자와 프로젝트의 할당 관계를 관리합니다."
        actions={<PageActionButton action="search" onClick={fetchData} />}
      />
      <PageBody>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        {!canEdit ? (
          <SectionPanel
            title="할당 프로젝트 조회"
            subtitle="프로젝트 할당 변경은 관리자에게 요청하세요."
            actions={<Chip label={`${projects.length}건`} size="small" color="primary" variant="outlined" />}
          >
            {projects.length === 0 ? (
              <EmptyState title={searched ? '할당된 프로젝트가 없습니다' : '조회 버튼을 눌러 데이터를 조회하세요'} />
            ) : (
              <Stack spacing={1.25}>
                {projects.map((project) => (
                  <RecordListItem
                    key={project.id}
                    primary={project.projectName}
                    secondary={project.companyName || '회사 정보 없음'}
                    meta={[
                      <Chip key="type" label={getServiceTypeLabel(project.serviceType)} size="small" />,
                      <Chip
                        key="period"
                        label={`${formatDate(project.contractStartDate)} - ${formatDate(project.contractEndDate)}`}
                        size="small"
                        variant="outlined"
                      />,
                      project.contractManDays !== undefined && (
                        <Chip key="md" label={`${project.contractManDays} M/D`} size="small" variant="outlined" />
                      ),
                    ].filter(Boolean)}
                  />
                ))}
              </Stack>
            )}
          </SectionPanel>
        ) : (
          <>
            <SectionPanel
              title="사용자 선택"
              subtitle="고객은 소속 회사 프로젝트만, 매니저와 관리자는 전체 프로젝트를 할당할 수 있습니다."
            >
              <FormControl fullWidth sx={{ maxWidth: 680 }}>
                <InputLabel>사용자 선택</InputLabel>
                <Select
                  value={selectedUserId}
                  onChange={handleUserChange}
                  label="사용자 선택"
                  MenuProps={{
                    PaperProps: {
                      style: { maxHeight: 420 },
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>사용자를 선택하세요</em>
                  </MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.username} - {user.email} ({user.role})
                      {user.companyName && ` - ${user.companyName}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </SectionPanel>

            <SectionPanel
              title="프로젝트 할당"
              subtitle={selectedUser ? `${selectedUser.username} 사용자에게 연결할 프로젝트를 선택합니다.` : '사용자를 선택하면 할당 가능한 프로젝트가 표시됩니다.'}
              actions={(
                <>
                  <Chip label={`${selectedProjects.length}건 선택`} size="small" color="primary" variant="outlined" />
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving || !selectedUserId}
                  >
                    {saving ? '저장 중...' : '할당 저장'}
                  </Button>
                </>
              )}
              contentSx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
            >
              <TextField
                value={projectQuery}
                onChange={(event) => setProjectQuery(event.target.value)}
                placeholder="프로젝트명, 회사, 유형 검색"
                size="small"
                disabled={!selectedUserId}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              {!selectedUserId ? (
                <EmptyState
                  title={searched ? '사용자를 먼저 선택하세요' : '조회 버튼을 눌러 데이터를 조회하세요'}
                  description={searched ? '선택한 사용자의 역할과 회사에 맞춰 프로젝트 목록이 제한됩니다.' : '사용자와 프로젝트 목록은 조회 후 표시됩니다.'}
                />
              ) : visibleProjects.length === 0 ? (
                <EmptyState title="할당 가능한 프로젝트가 없습니다" description="검색어 또는 사용자 회사 정보를 확인하세요." />
              ) : (
                <Stack spacing={1.25}>
                  {visibleProjects.map((project) => {
                    const isSelected = selectedProjects.includes(project.id);
                    return (
                      <RecordListItem
                        key={project.id}
                        selected={isSelected}
                        leading={<Checkbox checked={isSelected} onChange={() => handleToggle(project.id)} disabled={saving} />}
                        primary={project.projectName}
                        secondary={project.companyName || '회사 정보 없음'}
                        meta={[
                          <Chip key="type" label={getServiceTypeLabel(project.serviceType)} size="small" />,
                          <Chip
                            key="period"
                            label={`${formatDate(project.contractStartDate)} - ${formatDate(project.contractEndDate)}`}
                            size="small"
                            variant="outlined"
                          />,
                          project.contractManDays !== undefined && (
                            <Chip key="md" label={`${project.contractManDays} M/D`} size="small" variant="outlined" />
                          ),
                        ].filter(Boolean)}
                      />
                    );
                  })}
                </Stack>
              )}
            </SectionPanel>
          </>
        )}
      </PageBody>
    </Box>
  );
}

export default AdminProjectMapping;
