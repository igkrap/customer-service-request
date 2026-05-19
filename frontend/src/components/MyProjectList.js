import React, { useCallback, useState } from 'react';
import {
  Alert,
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { projectAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getServiceTypeLabel } from '../utils/serviceTypeLabel';
import PageHeader, { PageActionButton } from './common/PageHeader';
import { EmptyState, PageBody, RecordListItem, SectionPanel } from './common/WorkspaceLayout';

function MyProjectList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('ko-KR');
  };

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setSearched(true);
      setLoading(true);
      setError(null);

      const userProjectsResponse = await userAPI.getProjects(user.id);
      const assignedProjectIds = userProjectsResponse.data || [];
      setSelectedProjects(assignedProjectIds);

      if (user.role === 'ROLE_CUSTOMER') {
        const userResponse = await userAPI.getById(user.id);
        const userData = userResponse.data;

        if (userData.companyId) {
          const projectsResponse = await projectAPI.getByCompanyId(userData.companyId);
          setProjects(projectsResponse.data || []);
        } else {
          setProjects([]);
          setError('회사 정보가 할당되지 않았습니다. 관리자에게 문의하세요.');
        }
      } else if (user.role === 'ROLE_MANAGER') {
        if (assignedProjectIds.length > 0) {
          const allProjectsResponse = await projectAPI.getAll();
          const assignedProjects = (allProjectsResponse.data || []).filter((project) => (
            assignedProjectIds.includes(project.id)
          ));
          setProjects(assignedProjects);
        } else {
          setProjects([]);
        }
      } else {
        setProjects([]);
      }
    } catch (err) {
      setError(`프로젝트 목록을 불러오지 못했습니다: ${err.response?.data || err.message}`);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role]);

  if (loading && projects.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  const roleDescription = user?.role === 'ROLE_MANAGER'
    ? '현재 매니저에게 배정된 프로젝트만 표시됩니다.'
    : '소속 회사에서 사용할 수 있는 프로젝트를 표시합니다.';

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="프로젝트 조회"
        subtitle="배정된 프로젝트와 계약 정보를 확인합니다."
        actions={<PageActionButton action="search" onClick={fetchData} />}
      />
      <PageBody>
        {error && <Alert severity="error">{error}</Alert>}

        <SectionPanel
          title="사용 가능한 프로젝트"
          subtitle={roleDescription}
          actions={<Chip label={`${projects.length}건`} size="small" color="primary" variant="outlined" />}
        >
          {projects.length === 0 ? (
            <EmptyState
              title={searched ? '조회 가능한 프로젝트가 없습니다' : '조회 버튼을 눌러 데이터를 조회하세요'}
              description={searched ? '프로젝트 배정 또는 회사 연결 상태를 확인하세요.' : '배정된 프로젝트와 계약 정보는 조회 후 표시됩니다.'}
            />
          ) : (
            <Stack spacing={1.25}>
              {projects.map((project) => {
                const isSelected = selectedProjects.includes(project.id);
                return (
                  <RecordListItem
                    key={project.id}
                    selected={isSelected}
                    leading={<Checkbox checked={isSelected} disabled />}
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

        <Typography variant="caption" color="text.secondary">
          이 화면은 조회 전용입니다. 프로젝트 배정 변경은 관리자에게 요청하세요.
        </Typography>
      </PageBody>
    </Box>
  );
}

export default MyProjectList;
