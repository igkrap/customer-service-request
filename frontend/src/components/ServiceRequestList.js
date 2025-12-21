import React, { useState, useEffect } from 'react';
import { serviceRequestAPI, userAPI, projectAPI, attachmentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
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
  Download as DownloadIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { formatDateTime } from '../utils/dateFormatter';
import * as XLSX from 'xlsx';
import FileUpload from './FileUpload';
import RichTextEditor from './RichTextEditor';

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
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [selectedFollowUps, setSelectedFollowUps] = useState([]);
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  const [resolvingRequest, setResolvingRequest] = useState(null);
  const [isEditingResolution, setIsEditingResolution] = useState(false);
  const [resolutionData, setResolutionData] = useState({
    hoursSpent: '',
    resolutionNotes: ''
  });
  const [resolutionAttachments, setResolutionAttachments] = useState([]);
  const [editingRequest, setEditingRequest] = useState(null);
  const getInitialFormData = () => ({
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    customerId: '',
    projectId: '',
    dueDate: '',
    parentId: ''
  });

  const resetFormState = () => {
    setFormData(getInitialFormData());
    setAttachments([]);
    setEditingRequest(null);
  };

  const [formData, setFormData] = useState(getInitialFormData());
  const [attachments, setAttachments] = useState([]);

  const filterAttachmentsByType = (items, type) => {
    if (!Array.isArray(items)) return [];
    if (!type) return items;

    const normalized = items.map((item) => ({
      ...item,
      attachmentType: item.attachmentType || 'REQUEST'
    }));

    const filtered = normalized.filter((item) => item.attachmentType === type);
    if (type === 'REQUEST' && filtered.length === 0) {
      return normalized.filter((item) => !item.attachmentType || item.attachmentType === 'REQUEST');
    }
    return filtered;
  };

  const selectedRequestAttachments = filterAttachmentsByType(selectedAttachments, 'REQUEST');
  const selectedResolutionAttachments = filterAttachmentsByType(selectedAttachments, 'RESOLUTION');

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

      resetFormState();
      setShowForm(false);
      await fetchData(); // Wait for data to load before closing
    } catch (err) {
      setError('Failed to save service request: ' + err.message);
    }
  };

  const handleEdit = async (request) => {
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

    // Load existing attachments
    try {
      const attachmentsResponse = await attachmentAPI.getByServiceRequestId(request.id);
      setAttachments(filterAttachmentsByType(attachmentsResponse.data, 'REQUEST'));
    } catch (err) {
      console.error('Failed to load attachments:', err);
      setAttachments([]);
    }

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
    resetFormState();
    setShowForm(false);
  };

  const openResolutionDialog = async (request) => {
    const requestId = typeof request === 'object' ? request?.id : request;
    const targetRequest = typeof request === 'object'
      ? request
      : requests.find((req) => req.id === requestId);

    setResolvingRequest(requestId);
    const editingCompleted = (targetRequest?.status || '') === 'RESOLVED';
    setIsEditingResolution(editingCompleted);
    setResolutionData({
      hoursSpent: targetRequest?.hoursSpent ? String(targetRequest.hoursSpent) : '',
      resolutionNotes: targetRequest?.resolutionNotes || ''
    });
    try {
      const attachmentsResponse = await attachmentAPI.getByServiceRequestId(requestId);
      const resolutionOnly = filterAttachmentsByType(attachmentsResponse.data, 'RESOLUTION');
      setResolutionAttachments(editingCompleted ? resolutionOnly : []);
    } catch (err) {
      setResolutionAttachments([]);
    }
    setShowResolutionDialog(true);
  };

  const handleStatusChange = async (request, newStatus) => {
    const requestId = typeof request === 'object' ? request.id : request;

    // If changing to RESOLVED, show dialog to collect hours and notes
    if (newStatus === 'RESOLVED') {
      await openResolutionDialog(request);
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
        resolutionData.resolutionNotes,
        resolutionAttachments
      );
      setShowResolutionDialog(false);
      setResolvingRequest(null);
      setResolutionData({ hoursSpent: '', resolutionNotes: '' });
      setIsEditingResolution(false);
      setResolutionAttachments([]);
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
    setIsEditingResolution(false);
    setResolutionAttachments([]);
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

  const handleRowClick = async (params) => {
    setSelectedRequest(params.row);
    setShowDetailDialog(true);

    // Load attachments
    try {
      const attachmentsResponse = await attachmentAPI.getByServiceRequestId(params.row.id);
      setSelectedAttachments(attachmentsResponse.data || []);
    } catch (err) {
      console.error('Failed to load attachments:', err);
      setSelectedAttachments([]);
    }

    // Load follow-up requests
    try {
      const followUpsResponse = await serviceRequestAPI.getFollowUps(params.row.id);
      setSelectedFollowUps(followUpsResponse.data || []);
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
      setSelectedFollowUps([]);
    }
  };

  const handleCloseDetail = () => {
    setShowDetailDialog(false);
    setSelectedRequest(null);
    setSelectedAttachments([]);
    setSelectedFollowUps([]);
  };

  const handleDownloadAttachment = async (attachment) => {
    try {
      const response = await attachmentAPI.download(attachment.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.originalFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('File download failed:', error);
      alert('파일 다운로드 실패');
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

  const statusLabelMap = {
    'OPEN': '대기',
    'IN_PROGRESS': '진행중',
    'RESOLVED': '완료',
    'HOLD': '보류',
    'CANCELLED': '취소'
  };

  const priorityLabelMap = {
    'LOW': '낮음',
    'MEDIUM': '보통',
    'HIGH': '높음',
    'URGENT': '긴급'
  };

  const getStatusLabel = (status) => status ? (statusLabelMap[status] || status) : '';
  const getPriorityLabel = (priority) => priority ? (priorityLabelMap[priority] || priority) : '';

  const getStatusChip = (status) => {
    const colorMap = {
      'OPEN': 'primary',
      'IN_PROGRESS': 'info',
      'RESOLVED': 'success',
      'HOLD': 'warning',
      'CANCELLED': 'error'
    };
    return <Chip label={getStatusLabel(status)} color={colorMap[status] || 'default'} size="small" />;
  };

  const getPriorityChip = (priority) => {
    const colorMap = {
      'LOW': 'default',
      'MEDIUM': 'info',
      'HIGH': 'warning',
      'URGENT': 'error'
    };
    return <Chip label={getPriorityLabel(priority)} color={colorMap[priority] || 'default'} size="small" />;
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
      valueGetter: (params) => params.value || '없음'
    },
    {
      field: 'status',
      headerName: '상태',
      flex: 1,
      minWidth: 120,
      valueGetter: (params) => getStatusLabel(params.value),
      renderCell: (params) => params.row?.status ? getStatusChip(params.row.status) : null
    },
    {
      field: 'priority',
      headerName: '우선순위',
      flex: 0.8,
      minWidth: 100,
      valueGetter: (params) => getPriorityLabel(params.value),
      renderCell: (params) => params.row?.priority ? getPriorityChip(params.row.priority) : null
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
      headerName: '소요시간(m/d)',
      flex: 0.8,
      minWidth: 100,
      valueFormatter: (value) => {
        if (!value) return '';
        return `${value}`;
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
                {params.row.status !== 'IN_PROGRESS' && params.row.status !== 'RESOLVED' && (
                  <IconButton
                    size="small"
                    color="success"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(params.row, 'IN_PROGRESS');
                    }}
                    title="시작"
                  >
                    <StartIcon fontSize="small" />
                  </IconButton>
                )}
                {params.row.status === 'RESOLVED' && (
                  <IconButton
                    size="small"
                    color="info"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(params.row, 'RESOLVED');
                    }}
                    title="완료 내용 수정"
                  >
                    <EditIcon fontSize="small" />
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
                          handleStatusChange(params.row, 'RESOLVED');
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
                          handleStatusChange(params.row, 'HOLD');
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
    const headers = ['요청 ID', '제목', '요청자', '프로젝트', '상태', '우선순위', '마감일', '담당자', '생성일', '소요시간(m/d)'];

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
            {user?.role === 'ROLE_CUSTOMER' ? '서비스 요청 등록' :
             user?.role === 'ROLE_MANAGER' ? '서비스 요청 처리' :
             '서비스 요청 관리'}
          </Typography>
          {!showForm && (user?.role === 'ROLE_CUSTOMER' || user?.role === 'ROLE_ADMIN') && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                resetFormState();
                setShowForm(true);
              }}
            >
              새 요청 생성
            </Button>
          )}
        </Box>
      </Box>
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'hidden',
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minHeight: 0
        }}
      >

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Create/Edit Form Dialog */}
        <Dialog open={showForm} onClose={handleCancel} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
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

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    설명
                  </Typography>
                  <RichTextEditor
                    value={formData.description}
                    onChange={(value) => setFormData({ ...formData, description: value })}
                    placeholder="서비스 요청 내용을 상세히 입력하세요..."
                    minHeight={200}
                  />
                </Box>

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

        {/* Detail View Dialog */}
        <Dialog
          open={showDetailDialog}
          onClose={handleCloseDetail}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ pr: 6 }}>
            서비스 요청 상세정보
            <IconButton
              onClick={handleCloseDetail}
              sx={{ position: 'absolute', right: 12, top: 12 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {selectedRequest && (
              <Stack spacing={2}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    기본 정보
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
                    <Box sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="text.secondary">제목</Typography>
                      <Typography variant="body1" fontWeight="medium" sx={{ mt: 0.5 }}>{selectedRequest.title}</Typography>
                    </Box>
                    <Box sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="text.secondary">상태</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={selectedRequest.status === 'OPEN' ? '열림' :
                                 selectedRequest.status === 'IN_PROGRESS' ? '진행중' :
                                 selectedRequest.status === 'RESOLVED' ? '해결됨' :
                                 selectedRequest.status === 'HOLD' ? '보류' : '취소됨'}
                          color={selectedRequest.status === 'OPEN' ? 'primary' :
                                 selectedRequest.status === 'IN_PROGRESS' ? 'info' :
                                 selectedRequest.status === 'RESOLVED' ? 'success' :
                                 selectedRequest.status === 'HOLD' ? 'warning' : 'default'}
                          size="small"
                        />
                      </Box>
                    </Box>
                    <Box sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="text.secondary">우선순위</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={selectedRequest.priority === 'LOW' ? '낮음' :
                                 selectedRequest.priority === 'MEDIUM' ? '보통' :
                                 selectedRequest.priority === 'HIGH' ? '높음' : '긴급'}
                          color={selectedRequest.priority === 'URGENT' ? 'error' :
                                 selectedRequest.priority === 'HIGH' ? 'warning' : 'default'}
                          size="small"
                        />
                      </Box>
                    </Box>
                    <Box sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="text.secondary">고객</Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>{selectedRequest.customerName || '-'}</Typography>
                    </Box>
                    <Box sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="text.secondary">담당자</Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>{selectedRequest.managerName || '미할당'}</Typography>
                    </Box>
                    <Box sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="text.secondary">프로젝트</Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>{selectedRequest.projectName || '-'}</Typography>
                    </Box>
                    <Box sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="text.secondary">마감일</Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {selectedRequest.dueDate ? formatDateForDisplay(selectedRequest.dueDate) : '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="text.secondary">생성일</Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>{formatDateTime(selectedRequest.createdAt)}</Typography>
                    </Box>
                  </Box>
                </Paper>

                {selectedRequest.description && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      설명
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box
                      sx={{
                        '& .ql-editor': { padding: 0 },
                        '& p': { margin: '0.5em 0' },
                        '& img': { maxWidth: '100%' }
                      }}
                      dangerouslySetInnerHTML={{ __html: selectedRequest.description }}
                    />
                  </Paper>
                )}

                {selectedRequest.resolutionNotes && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      처리 내용
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Box
                      sx={{
                        '& .ql-editor': { padding: 0 },
                        '& p': { margin: '0.5em 0' },
                        '& img': { maxWidth: '100%' }
                      }}
                      dangerouslySetInnerHTML={{ __html: selectedRequest.resolutionNotes }}
                    />
                    {selectedRequest.hoursSpent && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        소요 시간: {selectedRequest.hoursSpent}m/d
                      </Typography>
                    )}
                  </Paper>
                )}

                {(selectedRequestAttachments.length > 0 || selectedResolutionAttachments.length > 0) && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      첨부파일
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={1.5}>
                      {selectedRequestAttachments.length > 0 && (
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip label="요청 첨부" color="default" size="small" variant="outlined" />
                            <Typography variant="body2" color="text.secondary">
                              요청 단계에 등록된 파일
                            </Typography>
                          </Box>
                          <Stack spacing={0.75}>
                            {selectedRequestAttachments.map((attachment) => (
                              <Box
                                key={`${attachment.id}-request`}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  p: 1,
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  bgcolor: 'grey.50'
                                }}
                              >
                                <Typography variant="body2">{attachment.originalFileName}</Typography>
                                <Button
                                  size="small"
                                  startIcon={<DownloadIcon />}
                                  onClick={() => handleDownloadAttachment(attachment)}
                                >
                                  다운로드
                                </Button>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      {selectedResolutionAttachments.length > 0 && (
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip label="완료 첨부" color="success" size="small" variant="outlined" />
                            <Typography variant="body2" color="text.secondary">
                              완료 단계에 추가된 파일
                            </Typography>
                          </Box>
                          <Stack spacing={0.75}>
                            {selectedResolutionAttachments.map((attachment) => (
                              <Box
                                key={`${attachment.id}-resolution`}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  p: 1,
                                  borderRadius: 1,
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  bgcolor: 'grey.50'
                                }}
                              >
                                <Typography variant="body2">{attachment.originalFileName}</Typography>
                                <Button
                                  size="small"
                                  startIcon={<DownloadIcon />}
                                  onClick={() => handleDownloadAttachment(attachment)}
                                >
                                  다운로드
                                </Button>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </Paper>
                )}

                {selectedFollowUps.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      후속 요청
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={1}>
                      {selectedFollowUps.map((followUp) => (
                        <Box
                          key={followUp.id}
                          sx={{
                            p: 1,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'grey.50'
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" fontWeight="bold">
                              #{followUp.id} - {followUp.title}
                            </Typography>
                            <Chip
                              label={followUp.status === 'OPEN' ? '열림' :
                                     followUp.status === 'IN_PROGRESS' ? '진행중' :
                                     followUp.status === 'RESOLVED' ? '해결됨' : followUp.status}
                              size="small"
                              color={followUp.status === 'RESOLVED' ? 'success' :
                                     followUp.status === 'IN_PROGRESS' ? 'info' : 'default'}
                            />
                          </Box>
                          {followUp.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {followUp.description}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                )}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetail}>닫기</Button>
          </DialogActions>
        </Dialog>

        {/* Resolution Dialog */}
        <Dialog open={showResolutionDialog} onClose={handleCancelResolve} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
          <DialogTitle>{isEditingResolution ? '완료 내용 수정' : '서비스 요청 완료'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Alert severity="info">
                {isEditingResolution
                  ? '등록된 완료 내용을 수정할 수 있습니다. 필요 시 소요시간과 처리 내용을 업데이트하세요.'
                  : '서비스 요청을 완료하려면 소요시간과 처리 내용을 입력해주세요.'}
              </Alert>
              <TextField
                fullWidth
                required
                type="number"
                label="소요시간 (m/d)"
                value={resolutionData.hoursSpent}
                onChange={(e) => setResolutionData({ ...resolutionData, hoursSpent: e.target.value })}
                inputProps={{ step: "0.5", min: "0" }}
                helperText="예: 2.5m/d"
              />

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  처리 내용 *
                </Typography>
                <RichTextEditor
                  value={resolutionData.resolutionNotes}
                  onChange={(value) => setResolutionData({ ...resolutionData, resolutionNotes: value })}
                  placeholder="수행한 작업 내용을 상세히 입력해주세요..."
                  minHeight={150}
                />
              </Box>

              <Divider sx={{ my: 1 }} />

              <FileUpload
                attachments={resolutionAttachments}
                onAttachmentsChange={setResolutionAttachments}
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
        <Box sx={{ flex: 1, width: '100%', minHeight: 0, display: 'flex' }}>
          <DataGrid
            rows={requests}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            onRowClick={handleRowClick}
            getRowId={(row) => row.id}
            slots={{
              toolbar: CustomToolbar,
            }}
            showToolbar
            sx={{
              height: '100%',
              minHeight: 500,
              flex: 1,
              '& .MuiDataGrid-row:hover': {
                cursor: 'pointer',
                backgroundColor: 'action.hover'
              }
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default ServiceRequestList;
