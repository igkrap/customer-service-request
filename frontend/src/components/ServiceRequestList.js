import React, { useState, useEffect } from 'react';
import { serviceRequestAPI, userAPI, projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Typography,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as StartIcon,
  Check as CompleteIcon,
  Pause as HoldIcon,
  PersonRemove as UnassignIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { formatDateTime } from '../utils/dateFormatter';
import * as XLSX from 'xlsx';
import FileUpload from './FileUpload';

// 날짜 형식 변환 함수
const formatDateToYYYYMMDD = (dateString) => {
  if (!dateString) return '';
  // yyyy-MM-dd → yyyyMMdd
  return dateString.replace(/-/g, '');
};

const formatDateFromYYYYMMDD = (yyyymmdd) => {
  if (!yyyymmdd || yyyymmdd.length !== 8) return '';
  // yyyyMMdd → yyyy-MM-dd
  return `${yyyymmdd.substring(0, 4)}-${yyyymmdd.substring(4, 6)}-${yyyymmdd.substring(6, 8)}`;
};

const formatDateForDisplay = (yyyymmdd) => {
  if (!yyyymmdd || yyyymmdd.length !== 8) return '';
  // yyyyMMdd → yyyy/MM/dd
  const year = yyyymmdd.substring(0, 4);
  const month = yyyymmdd.substring(4, 6);
  const day = yyyymmdd.substring(6, 8);
  return `${year}/${month}/${day}`;
};

// 현재 날짜를 yyyyMMdd 형식으로 반환
const getTodayYYYYMMDD = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// 프로젝트가 현재 기간 내에 있는지 확인
const isProjectActive = (project) => {
  // contractStartDate와 contractEndDate는 백엔드에서 "YYYY-MM-DD" 형식으로 옴
  if (!project.contractStartDate || !project.contractEndDate) return true; // 날짜가 없으면 선택 가능

  // "YYYY-MM-DD" 형식을 "YYYYMMDD" 형식으로 변환
  const startDate = formatDateToYYYYMMDD(project.contractStartDate);
  const endDate = formatDateToYYYYMMDD(project.contractEndDate);
  const today = getTodayYYYYMMDD();

  return startDate <= today && today <= endDate;
};

function ServiceRequestList() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  const [resolvingRequest, setResolvingRequest] = useState(null);
  const [resolutionData, setResolutionData] = useState({
    hoursSpent: '',
    resolutionNotes: ''
  });
  const [editingRequest, setEditingRequest] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    customerId: '',
    projectId: '',
    dueDate: '',
    parentId: ''
  });
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  // Dynamically fetch projects when customer is selected (for ADMIN creating requests for customers)
  useEffect(() => {
    const fetchProjectsForCustomer = async () => {
      // Only for Admin when creating request for a customer
      if (user?.role !== 'ROLE_ADMIN') {
        return;
      }

      if (!formData.customerId) {
        // No customer selected, load projects based on logged-in user
        if (user?.id) {
          try {
            const userResponse = await userAPI.getById(user.id);
            const userData = userResponse.data;

            if (userData.companyId) {
              const projectsResponse = await projectAPI.getByCompanyId(userData.companyId);
              setProjects(projectsResponse.data);
            } else {
              setProjects([]);
            }
          } catch (err) {
            // Error handling without console
          }
        }
      } else {
        // Customer selected, load projects for that customer (mapped projects only)
        try {
          const customerResponse = await userAPI.getById(parseInt(formData.customerId));
          const customerData = customerResponse.data;

          // Get customer's assigned projects
          const userProjectsResponse = await userAPI.getProjects(parseInt(formData.customerId));
          const assignedProjectIds = userProjectsResponse.data;

          if (customerData.companyId && assignedProjectIds.length > 0) {
            const projectsResponse = await projectAPI.getByCompanyId(customerData.companyId);
            // Filter to only show assigned projects that are active (within date range)
            const assignedProjects = projectsResponse.data.filter(p =>
              assignedProjectIds.includes(p.id) && isProjectActive(p)
            );
            setProjects(assignedProjects);
          } else {
            setProjects([]);
          }
        } catch (err) {
          setProjects([]);
        }
      }
    };

    if (showForm && user?.role === 'ROLE_ADMIN') {
      fetchProjectsForCustomer();
    }
  }, [formData.customerId, showForm, user?.id, user?.role]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const requestsResponse = await serviceRequestAPI.getAll();
      setRequests(requestsResponse.data);

      // Fetch all users (customers) if admin
      if (user?.role === 'ROLE_ADMIN') {
        try {
          const usersResponse = await userAPI.getAll();
          setCustomers(usersResponse.data.filter(u => u.role === 'ROLE_CUSTOMER'));
        } catch (err) {
          // Error handling without console
        }
      }

      // Fetch projects based on user's role
      if (user?.id) {
        try {
          if (user.role === 'ROLE_CUSTOMER') {
            // Customer: Only show assigned (mapped) projects that are within active date range
            const userProjectsResponse = await userAPI.getProjects(user.id);
            const assignedProjectIds = userProjectsResponse.data;

            const userResponse = await userAPI.getById(user.id);
            const userData = userResponse.data;

            if (userData.companyId && assignedProjectIds.length > 0) {
              const projectsResponse = await projectAPI.getByCompanyId(userData.companyId);
              // Filter to only show assigned projects that are active (within date range)
              const assignedProjects = projectsResponse.data.filter(p =>
                assignedProjectIds.includes(p.id) && isProjectActive(p)
              );
              setProjects(assignedProjects);
            } else {
              setProjects([]);
            }
          } else {
            // Admin/Manager: Show all projects from company
            const userResponse = await userAPI.getById(user.id);
            const userData = userResponse.data;

            if (userData.companyId) {
              const projectsResponse = await projectAPI.getByCompanyId(userData.companyId);
              setProjects(projectsResponse.data);
            } else {
              setProjects([]);
            }
          }
        } catch (err) {
          // Error handling without console
        }
      }

      setError(null);
    } catch (err) {
      if (err.response?.status !== 403) {
        setError('Failed to fetch data: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // If customer changes, clear the selected project (since projects are company-specific)
    if (name === 'customerId') {
      setFormData({
        ...formData,
        [name]: value,
        projectId: ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        customerId: parseInt(formData.customerId || user?.id),
        projectId: formData.projectId ? parseInt(formData.projectId) : null,
        parentId: formData.parentId ? parseInt(formData.parentId) : null,
        dueDate: formatDateToYYYYMMDD(formData.dueDate),
        attachments: attachments
      };

      if (editingRequest) {
        await serviceRequestAPI.update(editingRequest.id, submitData);
      } else {
        await serviceRequestAPI.create(submitData);
      }

      setFormData({
        title: '',
        description: '',
        status: 'OPEN',
        priority: 'MEDIUM',
        customerId: '',
        projectId: '',
        dueDate: '',
        parentId: ''
      });
      setAttachments([]);
      setShowForm(false);
      setEditingRequest(null);
      await fetchData(); // Wait for data to load before closing
    } catch (err) {
      setError('Failed to save service request: ' + err.message);
    }
  };

  const handleEdit = (request) => {
    setEditingRequest(request);
    setFormData({
      title: request.title,
      description: request.description || '',
      status: request.status,
      priority: request.priority,
      customerId: request.customerId.toString(),
      projectId: request.projectId ? request.projectId.toString() : '',
      dueDate: formatDateFromYYYYMMDD(request.dueDate),
      parentId: request.parentId ? request.parentId.toString() : ''
    });
    setAttachments(request.attachments || []);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('이 서비스 요청을 삭제하시겠습니까?')) {
      try {
        await serviceRequestAPI.delete(id);
        fetchData();
      } catch (err) {
        setError('Failed to delete service request: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRequest(null);
    setAttachments([]);
    setFormData({
      title: '',
      description: '',
      status: 'OPEN',
      priority: 'MEDIUM',
      customerId: '',
      projectId: '',
      dueDate: '',
      parentId: ''
    });
  };

  const handleStatusChange = async (requestId, newStatus) => {
    // If changing to RESOLVED, show dialog to collect hours and notes
    if (newStatus === 'RESOLVED') {
      setResolvingRequest(requestId);
      setShowResolutionDialog(true);
      return;
    }

    try {
      await serviceRequestAPI.updateStatus(requestId, newStatus);
      fetchData();
      setError(null);
    } catch (err) {
      setError('Failed to update status: ' + (err.response?.data || err.message));
    }
  };

  const handleResolve = async () => {
    if (!resolutionData.hoursSpent || !resolutionData.resolutionNotes) {
      setError('소요시간과 처리 내용을 모두 입력해주세요.');
      return;
    }

    try {
      await serviceRequestAPI.updateStatus(
        resolvingRequest,
        'RESOLVED',
        parseFloat(resolutionData.hoursSpent),
        resolutionData.resolutionNotes
      );
      setShowResolutionDialog(false);
      setResolvingRequest(null);
      setResolutionData({ hoursSpent: '', resolutionNotes: '' });
      fetchData();
      setError(null);
    } catch (err) {
      setError('완료 처리 실패: ' + (err.response?.data || err.message));
    }
  };

  const handleCancelResolve = () => {
    setShowResolutionDialog(false);
    setResolvingRequest(null);
    setResolutionData({ hoursSpent: '', resolutionNotes: '' });
  };

  const handleUnassign = async (requestId) => {
    if (!window.confirm('이 요청의 할당을 취소하시겠습니까? 상태가 OPEN으로 변경됩니다.')) {
      return;
    }

    try {
      await serviceRequestAPI.unassign(requestId);
      fetchData();
      setError(null);
    } catch (err) {
      setError('할당 취소 실패: ' + (err.response?.data || err.message));
    }
  };

  const canEditRequest = (request) => {
    if (user?.role === 'ROLE_ADMIN') return true;
    if (user?.role === 'ROLE_CUSTOMER' && request.customerId === user?.id) return true;
    return false;
  };

  const canChangeStatus = (request) => {
    if (user?.role === 'ROLE_ADMIN') return true;
    if (user?.role === 'ROLE_MANAGER') {
      // Manager can change status if:
      // 1. Request is assigned to them (managerId equals their ID)
      // 2. Request is not assigned to anyone yet (managerId is null) - they can take it
      // 3. Request is NOT assigned to another manager
      return request.managerId === user?.id || request.managerId === null;
    }
    return false;
  };

  const getStatusChip = (status) => {
    const colorMap = {
      'OPEN': 'primary',
      'IN_PROGRESS': 'info',
      'RESOLVED': 'success',
      'HOLD': 'warning',
      'CANCELLED': 'error'
    };
    const labelMap = {
      'OPEN': '대기',
      'IN_PROGRESS': '진행중',
      'RESOLVED': '완료',
      'HOLD': '보류',
      'CANCELLED': '취소'
    };
    return <Chip label={labelMap[status] || status} color={colorMap[status] || 'default'} size="small" />;
  };

  const getPriorityChip = (priority) => {
    const colorMap = {
      'LOW': 'default',
      'MEDIUM': 'info',
      'HIGH': 'warning',
      'URGENT': 'error'
    };
    const labelMap = {
      'LOW': '낮음',
      'MEDIUM': '보통',
      'HIGH': '높음',
      'URGENT': '긴급'
    };
    return <Chip label={labelMap[priority] || priority} color={colorMap[priority] || 'default'} size="small" />;
  };

  const columns = [
    { field: 'id', headerName: '요청 ID', flex: 0.6, minWidth: 70 },
    { field: 'title', headerName: '제목', flex: 2, minWidth: 150 },
    { field: 'customerName', headerName: '요청자', flex: 1.3, minWidth: 130 },
    {
      field: 'projectName',
      headerName: '프로젝트',
      flex: 1.2,
      minWidth: 120,
      valueGetter: (value) => value || '없음'
    },
    {
      field: 'status',
      headerName: '상태',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => params.value ? getStatusChip(params.value) : null
    },
    {
      field: 'priority',
      headerName: '우선순위',
      flex: 0.8,
      minWidth: 100,
      renderCell: (params) => params.value ? getPriorityChip(params.value) : null
    },
    {
      field: 'dueDate',
      headerName: '마감일',
      flex: 1,
      minWidth: 110,
      valueFormatter: (value) => {
        if (!value) return '';
        return formatDateForDisplay(value);
      }
    },
    {
      field: 'managerName',
      headerName: '담당자',
      flex: 1.3,
      minWidth: 130,
      valueGetter: (value) => (value && value.trim() !== '') ? value : '미배정'
    },
    {
      field: 'createdAt',
      headerName: '생성일',
      flex: 1.5,
      minWidth: 180,
      valueFormatter: (value) => {
        if (!value) return '';
        return formatDateTime(value) || '';
      }
    },
    {
      field: 'hoursSpent',
      headerName: '소요시간(h)',
      flex: 0.8,
      minWidth: 100,
      valueFormatter: (value) => {
        if (!value) return '';
        return `${value}h`;
      }
    },
    {
      field: 'actions',
      headerName: '작업',
      flex: 1.5,
      minWidth: 150,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        if (!params.row) return null;

        return (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '100%' }}>
            {canEditRequest(params.row) && (
              <>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(params.row);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(params.row.id);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </>
            )}
            {canChangeStatus(params.row) && user?.role === 'ROLE_MANAGER' && (
              <>
                {/* Show Start button if not yet IN_PROGRESS and (not assigned or assigned to this manager) */}
                {params.row.status !== 'IN_PROGRESS' && (
                  <IconButton
                    size="small"
                    color="success"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(params.row.id, 'IN_PROGRESS');
                    }}
                    title="시작"
                  >
                    <StartIcon fontSize="small" />
                  </IconButton>
                )}
                {/* Only show Complete/Close/Unassign buttons if request is assigned to this manager */}
                {params.row.managerId === user?.id && (
                  <>
                    {params.row.status !== 'RESOLVED' && (
                      <IconButton
                        size="small"
                        color="info"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(params.row.id, 'RESOLVED');
                        }}
                        title="완료"
                      >
                        <CompleteIcon fontSize="small" />
                      </IconButton>
                    )}
                    {params.row.status !== 'HOLD' && (
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(params.row.id, 'HOLD');
                        }}
                        title="보류"
                      >
                        <HoldIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnassign(params.row.id);
                      }}
                      title="할당 취소"
                    >
                      <UnassignIcon fontSize="small" />
                    </IconButton>
                  </>
                )}
              </>
            )}
          </Box>
        );
      }
    }
  ];

  const handleExportToExcel = () => {
    const headers = ['요청 ID', '제목', '요청자', '프로젝트', '상태', '우선순위', '마감일', '담당자', '생성일', '소요시간(h)'];

    const statusMap = {
      'PENDING': '대기',
      'IN_PROGRESS': '진행중',
      'ON_HOLD': '보류',
      'RESOLVED': '완료',
      'CANCELLED': '취소'
    };

    const priorityMap = {
      'LOW': '낮음',
      'NORMAL': '보통',
      'HIGH': '높음',
      'URGENT': '긴급'
    };

    const excelData = requests.map(req => [
      req.id,
      req.title,
      req.customerName,
      req.projectName || '없음',
      statusMap[req.status] || req.status,
      priorityMap[req.priority] || req.priority,
      req.dueDate ? formatDateForDisplay(req.dueDate) : '',
      (req.managerName && req.managerName.trim() !== '') ? req.managerName : '미배정',
      req.createdAt ? formatDateTime(req.createdAt) : '',
      req.hoursSpent || ''
    ]);

    const worksheetData = [headers, ...excelData];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    const columnWidths = [
      { wch: 10 }, // 요청 ID
      { wch: 30 }, // 제목
      { wch: 15 }, // 요청자
      { wch: 20 }, // 프로젝트
      { wch: 10 }, // 상태
      { wch: 10 }, // 우선순위
      { wch: 12 }, // 마감일
      { wch: 15 }, // 담당자
      { wch: 20 }, // 생성일
      { wch: 12 }  // 소요시간
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '서비스 요청');

    const fileName = `서비스요청목록_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 1, height: '100%' }}>
      <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 600,
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {user?.role === 'ROLE_CUSTOMER' ? '서비스 요청 등록' :
             user?.role === 'ROLE_MANAGER' ? '서비스 요청 처리' :
             '서비스 요청 관리'}
          </Typography>
          {!showForm && (user?.role === 'ROLE_CUSTOMER' || user?.role === 'ROLE_ADMIN') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowForm(true)}
            >
              새 요청 생성
            </Button>
          )}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Create/Edit Form Dialog */}
        <Dialog open={showForm} onClose={handleCancel} maxWidth="md" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              {editingRequest ? '서비스 요청 수정' : '새 서비스 요청 생성'}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                {user?.role === 'ROLE_ADMIN' && customers.length > 0 && (
                  <FormControl fullWidth required>
                    <InputLabel>요청자</InputLabel>
                    <Select
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleInputChange}
                      label="요청자"
                    >
                      <MenuItem value="">요청자 선택</MenuItem>
                      {customers.map(c => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.username} - {c.email}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                <TextField
                  fullWidth
                  required
                  label="제목"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                />

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="설명"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />

                <FormControl fullWidth required>
                  <InputLabel>우선순위</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    label="우선순위"
                  >
                    <MenuItem value="LOW">낮음</MenuItem>
                    <MenuItem value="MEDIUM">보통</MenuItem>
                    <MenuItem value="HIGH">높음</MenuItem>
                    <MenuItem value="URGENT">긴급</MenuItem>
                  </Select>
                </FormControl>

                {user?.role === 'ROLE_ADMIN' && (
                  <FormControl fullWidth required>
                    <InputLabel>상태</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      label="상태"
                    >
                      <MenuItem value="OPEN">열림</MenuItem>
                      <MenuItem value="IN_PROGRESS">진행중</MenuItem>
                      <MenuItem value="RESOLVED">해결됨</MenuItem>
                      <MenuItem value="HOLD">보류</MenuItem>
                      <MenuItem value="CANCELLED">취소됨</MenuItem>
                    </Select>
                  </FormControl>
                )}

                <FormControl fullWidth>
                  <InputLabel>프로젝트</InputLabel>
                  <Select
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleInputChange}
                    label="프로젝트"
                  >
                    <MenuItem value="">프로젝트 선택 (선택사항)</MenuItem>
                    {projects.map(project => {
                      const isActive = isProjectActive(project);
                      return (
                        <MenuItem
                          key={project.id}
                          value={project.id}
                          disabled={!isActive}
                        >
                          {project.projectName}
                          {!isActive && ' (기간 만료)'}
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>관련 서비스 요청 (후속 요청인 경우)</InputLabel>
                  <Select
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleInputChange}
                    label="관련 서비스 요청 (후속 요청인 경우)"
                  >
                    <MenuItem value="">없음 (새로운 요청)</MenuItem>
                    {requests
                      .filter(req => !editingRequest || req.id !== editingRequest.id)
                      .map(request => (
                        <MenuItem key={request.id} value={request.id}>
                          #{request.id} - {request.title}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  type="date"
                  label="마감일"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    min: new Date().toISOString().split('T')[0]
                  }}
                  helperText="마감일을 선택하세요 (오늘 이후만 가능)"
                />

                <Divider sx={{ my: 1 }} />

                <FileUpload
                  attachments={attachments}
                  onAttachmentsChange={setAttachments}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancel}>취소</Button>
              <Button type="submit" variant="contained">
                {editingRequest ? '수정' : '생성'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Resolution Dialog */}
        <Dialog open={showResolutionDialog} onClose={handleCancelResolve} maxWidth="sm" fullWidth>
          <DialogTitle>서비스 요청 완료</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Alert severity="info">
                서비스 요청을 완료하려면 소요시간과 처리 내용을 입력해주세요.
              </Alert>
              <TextField
                fullWidth
                required
                type="number"
                label="소요시간 (시간)"
                value={resolutionData.hoursSpent}
                onChange={(e) => setResolutionData({ ...resolutionData, hoursSpent: e.target.value })}
                inputProps={{ step: "0.5", min: "0" }}
                helperText="예: 2.5시간"
              />
              <TextField
                fullWidth
                required
                multiline
                rows={4}
                label="처리 내용"
                value={resolutionData.resolutionNotes}
                onChange={(e) => setResolutionData({ ...resolutionData, resolutionNotes: e.target.value })}
                placeholder="수행한 작업 내용을 상세히 입력해주세요."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelResolve}>취소</Button>
            <Button
              onClick={handleResolve}
              variant="contained"
              color="success"
              disabled={!resolutionData.hoursSpent || !resolutionData.resolutionNotes}
            >
              완료 처리
            </Button>
          </DialogActions>
        </Dialog>

        {/* DataGrid */}
        <Box sx={{ flex: 1, width: '100%' }}>
          <DataGrid
            rows={requests}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
            autoHeight={false}
            getRowId={(row) => row.id}
            slots={{
              toolbar: CustomToolbar,
            }}
            sx={{
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}

export default ServiceRequestList;
