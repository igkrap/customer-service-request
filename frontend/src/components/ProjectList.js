import React, { useState, useEffect } from 'react';
import { Box, Paper, CircularProgress, Typography, Alert, IconButton, Button, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { projectAPI, companyAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function ProjectList() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    companyId: '',
    projectName: '',
    serviceType: 'MAINTENANCE',
    contractStartDate: '',
    contractEndDate: '',
    contractManDays: ''
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      let projectsData = [];

      if (user?.role === 'ROLE_MANAGER') {
        // Manager: only show assigned projects
        const assignedProjectIdsResponse = await userAPI.getProjects(user.id);
        const assignedProjectIds = assignedProjectIdsResponse.data;

        if (assignedProjectIds.length > 0) {
          const allProjectsResponse = await projectAPI.getAll();
          projectsData = allProjectsResponse.data.filter(p => assignedProjectIds.includes(p.id));
        }
      } else {
        // Admin: show all projects
        const projectsResponse = await projectAPI.getAll();
        projectsData = projectsResponse.data;
      }

      const companiesResponse = await companyAPI.getAll();

      setProjects(projectsData);
      setCompanies(companiesResponse.data);
      setError(null);
    } catch (err) {
      setError('데이터 불러오기 실패: ' + err.message);
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
        companyId: parseInt(formData.companyId),
        contractManDays: parseFloat(formData.contractManDays)
      };

      if (editingProject) {
        await projectAPI.update(editingProject.id, submitData);
      } else {
        await projectAPI.create(submitData);
      }

      setFormData({
        companyId: '',
        projectName: '',
        serviceType: 'MAINTENANCE',
        contractStartDate: '',
        contractEndDate: '',
        contractManDays: ''
      });
      setShowForm(false);
      setEditingProject(null);
      fetchData();
    } catch (err) {
      setError('프로젝트 저장 실패: ' + (err.response?.data || err.message));
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      companyId: project.companyId.toString(),
      projectName: project.projectName,
      serviceType: project.serviceType,
      contractStartDate: project.contractStartDate,
      contractEndDate: project.contractEndDate,
      contractManDays: project.contractManDays.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('이 프로젝트를 삭제하시겠습니까?')) {
      try {
        await projectAPI.delete(id);
        fetchData();
      } catch (err) {
        setError('프로젝트 삭제 실패: ' + (err.response?.data || err.message));
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProject(null);
    setFormData({
      companyId: '',
      projectName: '',
      serviceType: 'MAINTENANCE',
      contractStartDate: '',
      contractEndDate: '',
      contractManDays: ''
    });
  };

  const getServiceTypeBadge = (type) => {
    const color = type === 'MAINTENANCE' ? 'info' : 'warning';
    const typeLabel = type === 'MAINTENANCE' ? '유지보수' : '하자보수';
    return <Chip label={typeLabel} color={color} size="small" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  const columns = [
    { field: 'id', headerName: '프로젝트 ID', width: 100 },
    { field: 'projectName', headerName: '프로젝트명', width: 220 },
    { field: 'companyName', headerName: '회사', width: 150 },
    {
      field: 'serviceType',
      headerName: '서비스 유형',
      width: 130,
      renderCell: (params) => getServiceTypeBadge(params.value)
    },
    {
      field: 'contractStartDate',
      headerName: '계약 시작일',
      width: 130,
      valueFormatter: (params) => {
        const value = params?.value !== undefined ? params.value : params;
        if (!value) return '';
        try {
          return new Date(value).toLocaleDateString();
        } catch (error) {
          return '';
        }
      }
    },
    {
      field: 'contractEndDate',
      headerName: '계약 종료일',
      width: 130,
      valueFormatter: (params) => {
        const value = params?.value !== undefined ? params.value : params;
        if (!value) return '';
        try {
          return new Date(value).toLocaleDateString();
        } catch (error) {
          return '';
        }
      }
    },
    {
      field: 'contractManDays',
      headerName: 'm/d',
      width: 100,
      valueFormatter: (params) => {
        const value = params?.value !== undefined ? params.value : params;
        if (!value) return '';
        return `${value} m/d`;
      }
    },
    {
      field: 'actions',
      headerName: '작업',
      width: 120,
      sortable: false,
      renderCell: (params) => {
        // Only ADMIN can edit/delete projects
        if (user?.role !== 'ROLE_ADMIN') {
          return null;
        }

        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
            <IconButton
              color="primary"
              size="small"
              onClick={() => handleEdit(params.row)}
              title="수정"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              color="error"
              size="small"
              onClick={() => handleDelete(params.row.id)}
              title="삭제"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        );
      }
    }
  ];

  return (
    <Box sx={{ p: 1, height: '100%' }}>
      <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
          프로젝트 관리
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {user?.role === 'ROLE_MANAGER' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            이 페이지는 조회 전용입니다. 프로젝트 생성 및 수정은 관리자에게 문의하세요.
          </Alert>
        )}

        {!showForm && user?.role === 'ROLE_ADMIN' && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowForm(true)}
            sx={{ mb: 3, alignSelf: 'flex-start' }}
          >
            새 프로젝트 등록
          </Button>
        )}

        {showForm && user?.role === 'ROLE_ADMIN' && (
          <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
            <div className="form-group">
              <label>회사 *</label>
              <select
                name="companyId"
                value={formData.companyId}
                onChange={handleInputChange}
                required
              >
                <option value="">회사 선택</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.companyName} ({company.companyCode})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>프로젝트명 *</label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>서비스 유형 *</label>
              <select
                name="serviceType"
                value={formData.serviceType}
                onChange={handleInputChange}
                required
              >
                <option value="MAINTENANCE">유지보수</option>
                <option value="DEFECT_REPAIR">하자보수</option>
              </select>
            </div>
            <div className="form-group">
              <label>계약 시작일 *</label>
              <input
                type="date"
                name="contractStartDate"
                value={formData.contractStartDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>계약 종료일 *</label>
              <input
                type="date"
                name="contractEndDate"
                value={formData.contractEndDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>계약 m/d *</label>
              <input
                type="number"
                name="contractManDays"
                value={formData.contractManDays}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                required
              />
            </div>
            <div className="btn-group">
              <button type="submit" className="btn btn-success">
                {editingProject ? '수정' : '등록'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                취소
              </button>
            </div>
          </form>
        )}

        <Box sx={{ flex: 1 }}>
          <DataGrid
            rows={projects}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            autoHeight={false}
            sx={{ height: '100%' }}
          />
        </Box>
      </Paper>
    </Box>
  );
}

export default ProjectList;
