import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { projectAPI, companyAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

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
      } else if (user?.role === 'ROLE_ADMIN') {
        // Admin: show all projects
        const projectsResponse = await projectAPI.getAll();
        projectsData = projectsResponse.data;
      } else {
        setProjects([]);
        setError('프로젝트를 조회할 수 있는 권한이 없습니다. 관리자에게 문의하세요.');
        return;
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
    const color = type === 'MAINTENANCE' ? 'info' : type === 'DEFECT_REPAIR' ? 'warning' : 'default';
    const typeLabel = type === 'MAINTENANCE' ? '유지보수' : type === 'DEFECT_REPAIR' ? '하자보수' : '기타';
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

  const handleExportToExcel = () => {
    const headers = ['프로젝트 ID', '프로젝트명', '회사', '서비스 유형', '계약 시작일', '계약 종료일', 'm/d'];

    const serviceTypeMap = {
      'DEVELOPMENT': '개발',
      'MAINTENANCE': '유지보수',
      'CONSULTING': '컨설팅'
    };

    const excelData = projects.map(proj => [
      proj.id,
      proj.projectName,
      proj.companyName,
      serviceTypeMap[proj.serviceType] || proj.serviceType,
      proj.contractStartDate ? new Date(proj.contractStartDate).toLocaleDateString() : '',
      proj.contractEndDate ? new Date(proj.contractEndDate).toLocaleDateString() : '',
      proj.contractManDays || ''
    ]);

    const worksheetData = [headers, ...excelData];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    const columnWidths = [
      { wch: 12 }, // 프로젝트 ID
      { wch: 25 }, // 프로젝트명
      { wch: 20 }, // 회사
      { wch: 15 }, // 서비스 유형
      { wch: 15 }, // 계약 시작일
      { wch: 15 }, // 계약 종료일
      { wch: 10 }  // m/d
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '프로젝트');

    const fileName = `프로젝트목록_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  function CustomToolbar() {
    return (
      <GridToolbarContainer
        sx={{
          p: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'rgba(25, 118, 210, 0.04)',
        }}
      >
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          onClick={handleExportToExcel}
          sx={{
            color: 'success.main',
            fontWeight: 600,
            '&:hover': {
              bgcolor: 'success.light',
              color: 'white',
            },
          }}
        >
          Excel 내보내기
        </Button>
      </GridToolbarContainer>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            프로젝트 관리
          </Typography>
          {!showForm && user?.role === 'ROLE_ADMIN' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowForm(true)}
            >
              새 프로젝트 등록
            </Button>
          )}
        </Box>
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3, display: 'flex', flexDirection: 'column' }}>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {user?.role === 'ROLE_MANAGER' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            이 페이지는 조회 전용입니다. 프로젝트 생성 및 수정은 관리자에게 문의하세요.
          </Alert>
        )}

        <Dialog open={showForm && user?.role === 'ROLE_ADMIN'} onClose={handleCancel} maxWidth="sm" fullWidth>
          <DialogTitle>{editingProject ? '프로젝트 수정' : '새 프로젝트 등록'}</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <FormControl fullWidth required>
                  <InputLabel>회사</InputLabel>
                  <Select
                    name="companyId"
                    value={formData.companyId}
                    onChange={handleInputChange}
                    label="회사"
                  >
                    <MenuItem value="">회사 선택</MenuItem>
                    {companies.map(company => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.companyName} ({company.companyCode})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  required
                  label="프로젝트명"
                  name="projectName"
                  value={formData.projectName}
                  onChange={handleInputChange}
                />

                <FormControl fullWidth required>
                  <InputLabel>서비스 유형</InputLabel>
                  <Select
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    label="서비스 유형"
                  >
                    <MenuItem value="MAINTENANCE">유지보수</MenuItem>
                    <MenuItem value="DEFECT_REPAIR">하자보수</MenuItem>
                    <MenuItem value="ETC">기타</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  required
                  type="date"
                  label="계약 시작일"
                  name="contractStartDate"
                  value={formData.contractStartDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  required
                  type="date"
                  label="계약 종료일"
                  name="contractEndDate"
                  value={formData.contractEndDate}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  fullWidth
                  required
                  type="number"
                  label="계약 m/d"
                  name="contractManDays"
                  value={formData.contractManDays}
                  onChange={handleInputChange}
                  inputProps={{ step: 0.1, min: 0 }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancel}>취소</Button>
              <Button type="submit" variant="contained" color="primary">
                {editingProject ? '수정' : '등록'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        <Box sx={{ flex: 1 }}>
          <DataGrid
            rows={projects}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            autoHeight={false}
            slots={{
              toolbar: CustomToolbar,
            }}
            showToolbar
            sx={{ height: '100%' }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default ProjectList;
