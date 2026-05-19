import React, { useState, useEffect, useMemo } from 'react';
import { serviceRequestAPI, userAPI, projectAPI, attachmentAPI, getProfilePictureUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getServiceTypeLabel } from '../utils/serviceTypeLabel';
import {
  Box,
  Button,
  Stack,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Typography,
  Avatar,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CompleteIcon,
  PersonRemove as UnassignIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { formatDateTime } from '../utils/dateFormatter';
import * as XLSX from 'xlsx';
import FileUpload from './FileUpload';
import RichTextEditor from './RichTextEditor';
import PageHeader, { PageActionButton, PageActions } from './common/PageHeader';
import InlineEditorPanel from './common/InlineEditorPanel';
import { confirmAction, showError } from '../utils/alerts';

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
  const [allRequests, setAllRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [selectedFollowUps, setSelectedFollowUps] = useState([]);
  const [selectedHistories, setSelectedHistories] = useState([]);
  const [showResolutionDialog, setShowResolutionDialog] = useState(false);
  const [resolvingRequest, setResolvingRequest] = useState(null);
  const [isEditingResolution, setIsEditingResolution] = useState(false);
  const [workflowAction, setWorkflowAction] = useState(null);
  const [workflowRequest, setWorkflowRequest] = useState(null);
  const [workflowData, setWorkflowData] = useState({
    managerId: '',
    note: '',
    reason: ''
  });
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
    receivedAt: '',
    resolvedAt: '',
    parentId: ''
  });

  const resetFormState = () => {
    setFormData(getInitialFormData());
    setAttachments([]);
    setEditingRequest(null);
  };

  const [formData, setFormData] = useState(getInitialFormData());
  const [attachments, setAttachments] = useState([]);
  const [filters, setFilters] = useState({
    title: '',
    status: '',
    priority: '',
    customerId: '',
    managerId: '',
    receivedFrom: '',
    receivedTo: ''
  });

  const managerOptions = useMemo(() => {
    const managerMap = new Map();
    allRequests.forEach((request) => {
      if (request.managerId && request.managerName) {
        managerMap.set(request.managerId, request.managerName);
      }
    });
    return Array.from(managerMap.entries()).map(([id, name]) => ({
      id,
      name
    }));
  }, [allRequests]);

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

  const enrichRequestsWithProjectNames = (items, availableProjects) => {
    if (!Array.isArray(items) || !Array.isArray(availableProjects)) return items;
    const projectMap = new Map(
      availableProjects.map((project) => [project.id, project])
    );

    return items.map((request) => {
      if (!request.projectId) {
        return request;
      }

      const project = projectMap.get(request.projectId);
      if (!project) {
        return request;
      }

      return {
        ...request,
        projectName: request.projectName || project.projectName,
        projectServiceType: project.serviceType,
        projectContractStartDate: project.contractStartDate,
        projectContractEndDate: project.contractEndDate
      };
    });
  };

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

  const applyFilters = (items, nextFilters = filters) => {
    const normalizedTitle = nextFilters.title.trim().toLowerCase();
    const fromDate = nextFilters.receivedFrom
      ? formatDateToYYYYMMDD(nextFilters.receivedFrom)
      : '';
    const toDate = nextFilters.receivedTo
      ? formatDateToYYYYMMDD(nextFilters.receivedTo)
      : '';

    const filtered = items.filter((request) => {
      if (normalizedTitle && !request.title?.toLowerCase().includes(normalizedTitle)) {
        return false;
      }
      if (nextFilters.status && request.status !== nextFilters.status) {
        return false;
      }
      if (nextFilters.priority && request.priority !== nextFilters.priority) {
        return false;
      }
      if (nextFilters.customerId && String(request.customerId) !== nextFilters.customerId) {
        return false;
      }
      if (nextFilters.managerId && String(request.managerId || '') !== nextFilters.managerId) {
        return false;
      }
      if (fromDate && (!request.receivedAt || request.receivedAt < fromDate)) {
        return false;
      }
      if (toDate && (!request.receivedAt || request.receivedAt > toDate)) {
        return false;
      }
      return true;
    });

    const sorted = filtered.sort((a, b) => {
      const aDate = a.receivedAt || '';
      const bDate = b.receivedAt || '';
      if (aDate === bDate) {
        return (b.id || 0) - (a.id || 0);
      }
      return aDate < bDate ? 1 : -1;
    });

    setFilteredRequests(sorted);
  };

  const fetchData = async () => {
    try {
      setSearched(true);
      setLoading(true);
      const requestsResponse = await serviceRequestAPI.getAll();
      let requestData = requestsResponse.data || [];
      let projectsForSelection = [];
      let projectsForLookup = [];

      // Fetch all users (customers) if admin
      if (user?.role === 'ROLE_ADMIN') {
        try {
          const [usersResponse, managersResponse] = await Promise.all([
            userAPI.getAll(),
            userAPI.getAllManagers()
          ]);
          setCustomers(usersResponse.data.filter(u => u.role === 'ROLE_CUSTOMER'));
          setManagers(managersResponse.data || []);
        } catch (err) {
          // Error handling without console
        }
      } else if (user?.role === 'ROLE_MANAGER') {
        setManagers([user]);
      }

      // Fetch projects based on user's role
      if (user?.id) {
        try {
          if (user.role === 'ROLE_CUSTOMER') {
            // Customer: Only show assigned (mapped) projects that are within active date range
            const userProjectsResponse = await userAPI.getProjects(user.id);
            const assignedProjectIds = userProjectsResponse.data || [];

            const userResponse = await userAPI.getById(user.id);
            const userData = userResponse.data;

            if (userData.companyId) {
              const projectsResponse = await projectAPI.getByCompanyId(userData.companyId);
              const companyProjects = projectsResponse.data || [];
              projectsForLookup = companyProjects;

              if (assignedProjectIds.length > 0) {
                // Filter to only show assigned projects that are active (within date range)
                projectsForSelection = companyProjects.filter(p =>
                  assignedProjectIds.includes(p.id) && isProjectActive(p)
                );
              }
            }
          } else if (user.role === 'ROLE_MANAGER') {
            const userProjectsResponse = await userAPI.getProjects(user.id);
            const assignedProjectIds = userProjectsResponse.data || [];
            const projectsResponse = await projectAPI.getAll();
            const allProjects = projectsResponse.data || [];
            projectsForLookup = allProjects;
            projectsForSelection = assignedProjectIds.length > 0
              ? allProjects.filter((project) => assignedProjectIds.includes(project.id))
              : [];
          } else {
            // Admin: Show all projects
            const projectsResponse = await projectAPI.getAll();
            projectsForSelection = projectsResponse.data || [];
            projectsForLookup = projectsForSelection;
          }
        } catch (err) {
          // Error handling without console
        }
      }

      setProjects(projectsForSelection);
      requestData = enrichRequestsWithProjectNames(requestData, projectsForLookup);
      setAllRequests(requestData);
      applyFilters(requestData);
      setError(null);
    } catch (err) {
      if (err.response?.status !== 403) {
        setError('Failed to fetch data: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFilterSearch = async () => {
    await fetchData();
  };

  const handleFilterReset = () => {
    const resetFilters = {
      title: '',
      status: '',
      priority: '',
      customerId: '',
      managerId: '',
      receivedFrom: '',
      receivedTo: ''
    };
    setFilters(resetFilters);
    applyFilters([...allRequests], resetFilters);
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
        receivedAt: formData.receivedAt ? formatDateToYYYYMMDD(formData.receivedAt) : null,
        resolvedAt: formData.resolvedAt ? formatDateToYYYYMMDD(formData.resolvedAt) : null,
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
      receivedAt: formatDateFromYYYYMMDD(request.receivedAt),
      resolvedAt: formatDateFromYYYYMMDD(request.resolvedAt),
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
    const confirmed = await confirmAction({
      title: '서비스 요청 삭제',
      text: '이 서비스 요청을 삭제하시겠습니까?',
      confirmButtonText: '삭제',
    });

    if (!confirmed) {
      return;
    }

    try {
      await serviceRequestAPI.delete(id);
      fetchData();
    } catch (err) {
      setError('Failed to delete service request: ' + err.message);
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
      : allRequests.find((req) => req.id === requestId);

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

  const handleResolve = async () => {
    if (!resolutionData.hoursSpent || !resolutionData.resolutionNotes) {
      setError('소요시간과 처리 내용을 모두 입력해주세요.');
      return;
    }

    try {
      await serviceRequestAPI.resolve(resolvingRequest, {
        hoursSpent: parseFloat(resolutionData.hoursSpent),
        resolutionNotes: resolutionData.resolutionNotes,
        attachments: resolutionAttachments,
        note: isEditingResolution ? '완료보고 수정' : '완료보고'
      });
      setShowResolutionDialog(false);
      setResolvingRequest(null);
      setResolutionData({ hoursSpent: '', resolutionNotes: '' });
      setIsEditingResolution(false);
      setResolutionAttachments([]);
      fetchData();
      setError(null);
    } catch (err) {
      setError('완료보고 실패: ' + (err.response?.data || err.message));
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
    const confirmed = await confirmAction({
      title: '할당 취소',
      text: '이 요청의 할당을 취소하시겠습니까? 상태가 OPEN으로 변경됩니다.',
      confirmButtonText: '할당 취소',
    });

    if (!confirmed) {
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

  const handleDetailOpen = async (request) => {
    setSelectedRequest(request);
    setShowDetailDialog(true);

    // Load attachments
    try {
      const attachmentsResponse = await attachmentAPI.getByServiceRequestId(request.id);
      setSelectedAttachments(attachmentsResponse.data || []);
    } catch (err) {
      console.error('Failed to load attachments:', err);
      setSelectedAttachments([]);
    }

    // Load follow-up requests
    try {
      const followUpsResponse = await serviceRequestAPI.getFollowUps(request.id);
      setSelectedFollowUps(followUpsResponse.data || []);
    } catch (err) {
      console.error('Failed to load follow-ups:', err);
      setSelectedFollowUps([]);
    }

    if (user?.role === 'ROLE_ADMIN') {
      try {
        const historiesResponse = await serviceRequestAPI.getHistories(request.id);
        setSelectedHistories(historiesResponse.data || []);
      } catch (err) {
        console.error('Failed to load histories:', err);
        setSelectedHistories([]);
      }
    } else {
      setSelectedHistories([]);
    }
  };

  const handleCloseDetail = () => {
    setShowDetailDialog(false);
    setSelectedRequest(null);
    setSelectedAttachments([]);
    setSelectedFollowUps([]);
    setSelectedHistories([]);
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
      showError('파일 다운로드 실패', '첨부파일을 다운로드하지 못했습니다.');
    }
  };

  const canEditRequest = (request) => {
    if (user?.role === 'ROLE_ADMIN') return true;
    if (
      user?.role === 'ROLE_CUSTOMER' &&
      request.customerId === user?.id &&
      ['OPEN', 'TRIAGE', 'WAITING_CUSTOMER', 'REOPENED'].includes(request.status)
    ) return true;
    return false;
  };

  const canDeleteRequest = (request) => user?.role === 'ROLE_ADMIN' && request.status !== 'CLOSED';

  const isAssignedToMe = (request) => request.managerId === user?.id;
  const canManagerTake = (request) => user?.role === 'ROLE_MANAGER' && (!request.managerId || request.managerId === user?.id);
  const isActiveWorkflow = (request) => !['CLOSED', 'CANCELLED'].includes(request.status);

  const openWorkflowPanel = (request, action) => {
    setWorkflowRequest(request);
    setWorkflowAction(action);
    setWorkflowData({
      managerId: request.managerId ? String(request.managerId) : (user?.role === 'ROLE_MANAGER' ? String(user.id) : ''),
      note: '',
      reason: ''
    });
  };

  const closeWorkflowPanel = () => {
    setWorkflowAction(null);
    setWorkflowRequest(null);
    setWorkflowData({ managerId: '', note: '', reason: '' });
  };

  const workflowActionMeta = {
    triage: {
      title: '접수 처리',
      submitLabel: '접수',
      noteLabel: '접수 메모',
      notePlaceholder: '접수 검토 내용을 입력하세요.'
    },
    assign: {
      title: '담당자 배정',
      submitLabel: '배정',
      noteLabel: '배정 메모',
      notePlaceholder: '배정 사유나 참고사항을 입력하세요.'
    },
    start: {
      title: '처리 시작',
      submitLabel: '시작',
      noteLabel: '처리 메모',
      notePlaceholder: '처리 시작 내용을 입력하세요.'
    },
    hold: {
      title: '내부 보류',
      submitLabel: '보류',
      noteLabel: '보류 사유',
      notePlaceholder: '보류 사유를 입력하세요.'
    },
    waitCustomer: {
      title: '고객 응답 대기',
      submitLabel: '고객대기',
      noteLabel: '요청 내용',
      notePlaceholder: '고객에게 확인이 필요한 내용을 입력하세요.'
    },
    close: {
      title: '완료 확인',
      submitLabel: '종료',
      noteLabel: '확인 메모',
      notePlaceholder: '완료 확인 메모를 입력하세요.'
    },
    rejectResolution: {
      title: '완료보고 반려',
      submitLabel: '반려',
      reasonLabel: '반려 사유',
      reasonPlaceholder: '반려 사유를 입력하세요.'
    },
    cancel: {
      title: '요청 취소',
      submitLabel: '취소',
      reasonLabel: '취소 사유',
      reasonPlaceholder: '취소 사유를 입력하세요.'
    }
  };

  const getWorkflowActionMeta = () => workflowActionMeta[workflowAction] || {
    title: '업무 처리',
    submitLabel: '처리',
    noteLabel: '처리 메모',
    notePlaceholder: '처리 내용을 입력하세요.'
  };

  const submitWorkflowAction = async (event) => {
    event.preventDefault();
    if (!workflowRequest || !workflowAction) return;
    if (['assign', 'start'].includes(workflowAction) && user?.role === 'ROLE_ADMIN' && !workflowData.managerId) {
      setError('담당자를 선택해주세요.');
      return;
    }

    const id = workflowRequest.id;
    const payload = {
      note: workflowData.note || undefined,
      reason: workflowData.reason || undefined,
      managerId: workflowData.managerId ? parseInt(workflowData.managerId, 10) : undefined,
    };

    try {
      if (workflowAction === 'triage') await serviceRequestAPI.triage(id, payload);
      if (workflowAction === 'assign') await serviceRequestAPI.assign(id, payload);
      if (workflowAction === 'start') await serviceRequestAPI.start(id, payload);
      if (workflowAction === 'hold') await serviceRequestAPI.hold(id, payload);
      if (workflowAction === 'waitCustomer') await serviceRequestAPI.waitCustomer(id, payload);
      if (workflowAction === 'close') await serviceRequestAPI.close(id, payload);
      if (workflowAction === 'rejectResolution') await serviceRequestAPI.rejectResolution(id, payload);
      if (workflowAction === 'cancel') await serviceRequestAPI.cancel(id, payload);
      closeWorkflowPanel();
      await fetchData();
      setError(null);
    } catch (err) {
      setError('워크플로우 처리 실패: ' + (err.response?.data || err.message));
    }
  };

  const statusLabelMap = {
    'OPEN': '신규',
    'TRIAGE': '접수검토',
    'ASSIGNED': '배정완료',
    'IN_PROGRESS': '진행중',
    'WAITING_CUSTOMER': '고객응답대기',
    'HOLD': '보류',
    'RESOLVED': '완료보고',
    'REOPENED': '재처리',
    'CLOSED': '종료',
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
      'TRIAGE': 'secondary',
      'ASSIGNED': 'info',
      'IN_PROGRESS': 'info',
      'WAITING_CUSTOMER': 'warning',
      'HOLD': 'warning',
      'RESOLVED': 'success',
      'REOPENED': 'error',
      'CLOSED': 'default',
      'CANCELLED': 'error'
    };
    return <Chip label={getStatusLabel(status)} color={colorMap[status] || 'default'} size="small" />;
  };

  const workflowBuckets = [
    { key: '', label: '전체' },
    { key: 'OPEN', label: '신규' },
    { key: 'TRIAGE', label: '접수검토' },
    { key: 'ASSIGNED', label: '배정' },
    { key: 'IN_PROGRESS', label: '처리중' },
    { key: 'WAITING_CUSTOMER', label: '고객대기' },
    { key: 'RESOLVED', label: '완료확인' },
    { key: 'CLOSED', label: '종료' }
  ];

  const getWorkflowBucketCount = (status) => {
    if (!status) return allRequests.length;
    return allRequests.filter((request) => request.status === status).length;
  };

  const handleWorkflowBucketClick = (status) => {
    const nextFilters = { ...filters, status };
    setFilters(nextFilters);
    applyFilters([...allRequests], nextFilters);
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

  const renderWorkflowButton = (label, action, request, color = 'inherit') => (
    <Button
      size="small"
      color={color}
      variant="outlined"
      onClick={(e) => {
        e.stopPropagation();
        openWorkflowPanel(request, action);
      }}
      sx={{ minWidth: 'auto', px: 0.75, height: 28, fontSize: 12, fontWeight: 700 }}
    >
      {label}
    </Button>
  );

  const renderActionButtons = (request) => (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'center', height: '100%', flexWrap: 'wrap' }}>
      {canDeleteRequest(request) && (
        <IconButton
          size="small"
          color="primary"
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(request);
          }}
          title="수정"
        >
          <EditIcon fontSize="small" />
        </IconButton>
      )}
      {user?.role === 'ROLE_ADMIN' && isActiveWorkflow(request) && (
        <>
          {['OPEN', 'REOPENED'].includes(request.status) && renderWorkflowButton('접수', 'triage', request)}
          {['OPEN', 'TRIAGE', 'REOPENED', 'HOLD', 'WAITING_CUSTOMER'].includes(request.status) && renderWorkflowButton('배정', 'assign', request)}
          {['ASSIGNED', 'REOPENED', 'HOLD', 'WAITING_CUSTOMER', 'TRIAGE'].includes(request.status) && renderWorkflowButton('시작', 'start', request)}
          {renderWorkflowButton('취소', 'cancel', request, 'error')}
        </>
      )}
      {user?.role === 'ROLE_MANAGER' && isActiveWorkflow(request) && (
        <>
          {['OPEN', 'REOPENED'].includes(request.status) && canManagerTake(request) && renderWorkflowButton('접수', 'triage', request)}
          {['OPEN', 'TRIAGE', 'ASSIGNED', 'REOPENED', 'HOLD', 'WAITING_CUSTOMER'].includes(request.status) && canManagerTake(request) && renderWorkflowButton(request.managerId ? '시작' : '가져오기', 'start', request, 'success')}
          {isAssignedToMe(request) && ['IN_PROGRESS', 'REOPENED'].includes(request.status) && renderWorkflowButton('고객응답', 'waitCustomer', request, 'warning')}
          {isAssignedToMe(request) && ['IN_PROGRESS', 'REOPENED', 'WAITING_CUSTOMER'].includes(request.status) && renderWorkflowButton('보류', 'hold', request, 'warning')}
          {isAssignedToMe(request) && ['IN_PROGRESS', 'REOPENED', 'HOLD', 'WAITING_CUSTOMER'].includes(request.status) && (
            <IconButton
              size="small"
              color="success"
              onClick={(e) => {
                e.stopPropagation();
                openResolutionDialog(request);
              }}
              title="완료보고"
            >
              <CompleteIcon fontSize="small" />
            </IconButton>
          )}
          {isAssignedToMe(request) && request.status === 'RESOLVED' && (
            <Button
              size="small"
              variant="outlined"
              color="success"
              onClick={(e) => {
                e.stopPropagation();
                openResolutionDialog(request);
              }}
              sx={{ minWidth: 'auto', px: 0.75, height: 28, fontSize: 12, fontWeight: 700 }}
            >
              완료수정
            </Button>
          )}
          {isAssignedToMe(request) && (
            <IconButton
              size="small"
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                handleUnassign(request.id);
              }}
              title="할당 취소"
            >
              <UnassignIcon fontSize="small" />
            </IconButton>
          )}
        </>
      )}
      {user?.role === 'ROLE_CUSTOMER' && request.customerId === user?.id && request.status === 'RESOLVED' && (
        <>
          {renderWorkflowButton('확인', 'close', request, 'success')}
          {renderWorkflowButton('반려', 'rejectResolution', request, 'error')}
        </>
      )}
      {canEditRequest(request) && (
        <IconButton
          size="small"
          color="error"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(request.id);
          }}
          title="삭제"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );

  const renderProfileCell = (name, profilePictureId) => {
    if (name === '-') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Typography variant="body2">-</Typography>
        </Box>
      );
    }

    return (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ height: '100%' }}>
        <Avatar
          src={getProfilePictureUrl(profilePictureId)}
          sx={{ width: 36, height: 36, bgcolor: 'grey.200', color: 'text.secondary' }}
        >
          {name?.charAt(0)?.toUpperCase()}
        </Avatar>
        <Typography variant="body2">{name}</Typography>
      </Stack>
    );
  };

  const formatProjectDate = (dateValue) => {
    if (!dateValue) return '-';
    const parsedDate = new Date(dateValue);
    if (Number.isNaN(parsedDate.getTime())) return '-';
    return parsedDate.toLocaleDateString();
  };

  const renderHeaderTooltip = (label, description) => (
    <Tooltip
      arrow
      placement="top"
      title={(
        <Paper sx={{ p: 1.5, bgcolor: 'background.paper', boxShadow: 3 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {description || label}
          </Typography>
        </Paper>
      )}
    >
      <Typography variant="body2" fontWeight={600}>
        {label}
      </Typography>
    </Tooltip>
  );

  const renderProjectTooltipContent = (row) => (
    <Paper sx={{ p: 1.5, bgcolor: 'background.paper', boxShadow: 3 }}>
      <Typography variant="subtitle2" fontWeight={600}>
        {row?.projectName || '프로젝트 정보 없음'}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        유형: {getServiceTypeLabel(row?.projectServiceType)}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        기간: {formatProjectDate(row?.projectContractStartDate)} ~ {formatProjectDate(row?.projectContractEndDate)}
      </Typography>
    </Paper>
  );

  const renderPersonTooltipContent = (row, name, profilePictureId, email, companyName) => (
    <Paper sx={{ p: 1.5, bgcolor: 'background.paper', boxShadow: 3, minWidth: 220 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar
          src={getProfilePictureUrl(profilePictureId)}
          sx={{ width: 48, height: 48, bgcolor: 'grey.200', color: 'text.secondary' }}
        >
          {name?.charAt(0)?.toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="subtitle2" fontWeight={600}>
            {name}
          </Typography>
          {companyName && (
            <Typography variant="caption" color="text.secondary" display="block">
              {companyName}
            </Typography>
          )}
          {email && (
            <Typography variant="caption" color="text.secondary" display="block">
              {email}
            </Typography>
          )}
        </Box>
      </Stack>
    </Paper>
  );

  const columns = [
    {
      field: 'id',
      headerName: '요청 ID',
      flex: 0.6,
      minWidth: 80,
      renderHeader: () => renderHeaderTooltip('요청 ID', '요청 식별 번호')
    },
    {
      field: 'companyName',
      headerName: '회사 명',
      flex: 1.2,
      minWidth: 140,
      valueGetter: (value) => value || '-',
      renderHeader: () => renderHeaderTooltip('회사 명', '요청자 소속 회사')
    },
    {
      field: 'projectName',
      headerName: '프로젝트 명',
      flex: 1.3,
      minWidth: 150,
      valueGetter: (value) => value || '없음',
      renderHeader: () => renderHeaderTooltip('프로젝트 명', '프로젝트 정보'),
      renderCell: (params) => (
        <Tooltip arrow placement="right" title={renderProjectTooltipContent(params.row)}>
          <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            <Typography variant="body2">{params.value || '없음'}</Typography>
          </Box>
        </Tooltip>
      )
    },
    {
      field: 'customerName',
      headerName: '요청자',
      flex: 1.4,
      minWidth: 160,
      renderHeader: () => renderHeaderTooltip('요청자', '요청자 정보'),
      renderCell: (params) => {
        const name = params.value || '-';
        if (name === '-') {
          return renderProfileCell(name);
        }
        return (
          <Tooltip
            arrow
            placement="right"
            title={renderPersonTooltipContent(
              params.row,
              name,
              params.row?.customerProfilePictureId,
              params.row?.customerEmail,
              params.row?.companyName
            )}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              {renderProfileCell(name, params.row?.customerProfilePictureId)}
            </Box>
          </Tooltip>
        );
      }
    },
    {
      field: 'title',
      headerName: '제목',
      flex: 2,
      minWidth: 180,
      renderHeader: () => renderHeaderTooltip('제목', '요청 제목')
    },
    {
      field: 'status',
      headerName: '상태',
      flex: 1,
      minWidth: 120,
      valueGetter: (value) => getStatusLabel(value),
      renderCell: (params) => params.row?.status ? getStatusChip(params.row.status) : null,
      renderHeader: () => renderHeaderTooltip('상태', '진행 상태')
    },
    {
      field: 'priority',
      headerName: '우선순위',
      flex: 0.8,
      minWidth: 110,
      valueGetter: (value) => getPriorityLabel(value),
      renderCell: (params) => params.row?.priority ? getPriorityChip(params.row.priority) : null,
      renderHeader: () => renderHeaderTooltip('우선순위', '요청 우선순위')
    },
    {
      field: 'managerName',
      headerName: '담당자',
      flex: 1.3,
      minWidth: 160,
      renderHeader: () => renderHeaderTooltip('담당자', '담당자 정보'),
      renderCell: (params) => {
        const name = params.value?.trim() ? params.value : '-';
        if (name === '-') {
          return renderProfileCell(name);
        }
        return (
          <Tooltip
            arrow
            placement="right"
            title={renderPersonTooltipContent(
              params.row,
              name,
              params.row?.managerProfilePictureId,
              params.row?.managerEmail
            )}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              {renderProfileCell(name, params.row?.managerProfilePictureId)}
            </Box>
          </Tooltip>
        );
      }
    },
    {
      field: 'receivedAt',
      headerName: '접수일자',
      flex: 1.2,
      minWidth: 130,
      valueFormatter: (value) => {
        if (!value) return '';
        return formatDateForDisplay(value) || '';
      },
      renderHeader: () => renderHeaderTooltip('접수일자', '요청 접수일')
    },
    {
      field: 'dueDate',
      headerName: '마감일자',
      flex: 1,
      minWidth: 110,
      valueFormatter: (value) => {
        if (!value) return '';
        return formatDateForDisplay(value);
      },
      renderHeader: () => renderHeaderTooltip('마감일자', '요청 마감일')
    },
    {
      field: 'resolvedAt',
      headerName: '완료보고일',
      flex: 1,
      minWidth: 110,
      valueFormatter: (value) => {
        if (!value) return '';
        return formatDateForDisplay(value);
      },
      renderHeader: () => renderHeaderTooltip('완료보고일', '매니저 완료보고일')
    },
    {
      field: 'closedAt',
      headerName: '종료일',
      flex: 1,
      minWidth: 110,
      valueFormatter: (value) => {
        if (!value) return '';
        return formatDateForDisplay(value);
      },
      renderHeader: () => renderHeaderTooltip('종료일', '고객 확인 종료일')
    },
    {
      field: 'actions',
      headerName: '작업버튼',
      flex: 1.4,
      minWidth: 220,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => params.row ? renderActionButtons(params.row) : null,
      renderHeader: () => renderHeaderTooltip('작업버튼', '요청 처리 작업')
    }
  ];

  const buildTimelineEntries = (request) => {
    if (!request) return [];
    const receivedDate = request.receivedAt
      ? new Date(formatDateFromYYYYMMDD(request.receivedAt))
      : request.createdAt
        ? new Date(request.createdAt)
        : null;
    const entries = [
      {
        key: 'created',
        label: '요청 생성',
        detail: request.customerName ? `${request.customerName} 요청` : null,
        date: receivedDate,
        dateLabel: request.receivedAt
          ? formatDateForDisplay(request.receivedAt)
          : request.createdAt
            ? formatDateTime(request.createdAt)
            : '',
      },
    ];

    const pushDateEntry = (key, label, value, detail = null) => {
      if (!value) return;
      entries.push({
        key,
        label,
        detail,
        date: new Date(formatDateFromYYYYMMDD(value)),
        dateLabel: formatDateForDisplay(value),
      });
    };

    if (request.managerName && request.managerName !== '미할당' && request.assignedAt) {
      entries.push({
        key: 'manager',
        label: '담당자 배정 완료',
        detail: request.managerName,
        date: new Date(formatDateFromYYYYMMDD(request.assignedAt)),
        dateLabel: formatDateForDisplay(request.assignedAt),
      });
    }

    pushDateEntry('started', '처리 시작', request.startedAt, request.managerName || null);
    pushDateEntry('resolved', '완료보고', request.resolvedAt);
    pushDateEntry('reopened', '반려 후 재처리', request.reopenedAt);
    pushDateEntry('closed', '고객 확인 종료', request.closedAt);
    pushDateEntry('cancelled', '요청 취소', request.cancelledAt);

    if (request.status && request.status !== 'OPEN' && request.updatedAt) {
      entries.push({
        key: 'status',
        label: '현재 상태',
        detail: getStatusLabel(request.status),
        date: new Date(request.updatedAt),
        dateLabel: formatDateTime(request.updatedAt),
      });
    }

    return entries
      .filter((entry) => entry.date)
      .sort((a, b) => a.date - b.date);
  };

  const handleExportToExcel = () => {
    const headers = ['요청 ID', '회사 명', '프로젝트 명', '요청자', '제목', '상태', '우선순위', '담당자', '접수일자', '마감일자', '완료보고일', '종료일'];

    const excelData = filteredRequests.map(req => [
      req.id,
      req.companyName || '-',
      req.projectName || '없음',
      req.customerName,
      req.title,
      getStatusLabel(req.status) || req.status,
      getPriorityLabel(req.priority) || req.priority,
      (req.managerName && req.managerName.trim() !== '') ? req.managerName : '-',
      req.receivedAt ? formatDateForDisplay(req.receivedAt) : '',
      req.dueDate ? formatDateForDisplay(req.dueDate) : '',
      req.resolvedAt ? formatDateForDisplay(req.resolvedAt) : '',
      req.closedAt ? formatDateForDisplay(req.closedAt) : ''
    ]);

    const worksheetData = [headers, ...excelData];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    const columnWidths = [
      { wch: 10 }, // 요청 ID
      { wch: 20 }, // 회사 명
      { wch: 20 }, // 프로젝트 명
      { wch: 15 }, // 요청자
      { wch: 30 }, // 제목
      { wch: 10 }, // 상태
      { wch: 10 }, // 우선순위
      { wch: 15 }, // 담당자
      { wch: 14 }, // 접수일자
      { wch: 12 }, // 마감일자
      { wch: 12 }, // 완료보고일
      { wch: 12 }  // 종료일
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '서비스 요청');

    const fileName = `서비스요청목록_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  function CustomToolbar() {
    return null;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  const timelineEntries = buildTimelineEntries(selectedRequest);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title={
          user?.role === 'ROLE_CUSTOMER' ? '서비스 요청 등록' :
          user?.role === 'ROLE_MANAGER' ? '서비스 요청 처리' :
          '서비스 요청 관리'
        }
        subtitle="요청 현황을 필터링하고 처리 이력을 확인합니다."
        actions={
          <PageActions>
            <PageActionButton action="reset" onClick={handleFilterReset} />
            <PageActionButton action="search" onClick={handleFilterSearch} />
            {!showForm && (user?.role === 'ROLE_CUSTOMER' || user?.role === 'ROLE_ADMIN') && (
              <PageActionButton
                action="create"
                onClick={() => {
                  resetFormState();
                  setShowForm(true);
                }}
              />
            )}
            <PageActionButton action="export" onClick={handleExportToExcel} disabled={filteredRequests.length === 0} />
          </PageActions>
        }
      />
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'hidden',
          p: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          minHeight: 0
        }}
      >

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Paper
          variant="outlined"
          sx={{
            p: 1.5,
            borderRadius: 0,
            bgcolor: 'background.paper',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            alignItems={{ xs: 'stretch', md: 'center' }}
            flexWrap="wrap"
            sx={{ rowGap: 1.5, columnGap: 1.5 }}
          >
            <TextField
              label="제목"
              name="title"
              value={filters.title}
              onChange={handleFilterChange}
              size="small"
              sx={{ minWidth: 200 }}
            />
            <FormControl sx={{ minWidth: 160 }}>
              <Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                size="small"
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return <Typography color="text.secondary">상태</Typography>;
                  }
                  return getStatusLabel(selected);
                }}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <MenuItem value="">전체</MenuItem>
                {Object.keys(statusLabelMap).map((key) => (
                  <MenuItem key={key} value={key}>
                    {statusLabelMap[key]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 160 }}>
              <Select
                name="priority"
                value={filters.priority}
                onChange={handleFilterChange}
                size="small"
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return <Typography color="text.secondary">우선순위</Typography>;
                  }
                  return getPriorityLabel(selected);
                }}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <MenuItem value="">전체</MenuItem>
                {Object.keys(priorityLabelMap).map((key) => (
                  <MenuItem key={key} value={key}>
                    {priorityLabelMap[key]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {user?.role === 'ROLE_ADMIN' && (
              <FormControl sx={{ minWidth: 180 }}>
                <Select
                  name="customerId"
                  value={filters.customerId}
                  onChange={handleFilterChange}
                  size="small"
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <Typography color="text.secondary">요청자</Typography>;
                    }
                    const customer = customers.find((item) => String(item.id) === String(selected));
                    return customer?.username || '전체';
                  }}
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <MenuItem value="">전체</MenuItem>
                  {customers.map((customer) => (
                    <MenuItem key={customer.id} value={String(customer.id)}>
                      {customer.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            {(user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_MANAGER') && (
              <FormControl sx={{ minWidth: 180 }}>
                <Select
                  name="managerId"
                  value={filters.managerId}
                  onChange={handleFilterChange}
                  size="small"
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) {
                      return <Typography color="text.secondary">담당자</Typography>;
                    }
                    const manager = managerOptions.find((item) => String(item.id) === String(selected));
                    return manager?.name || '전체';
                  }}
                  sx={{ display: 'flex', alignItems: 'center' }}
                >
                  <MenuItem value="">전체</MenuItem>
                  {managerOptions.map((manager) => (
                    <MenuItem key={manager.id} value={String(manager.id)}>
                      {manager.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <TextField
              label="접수일자(시작)"
              type="date"
              name="receivedFrom"
              value={filters.receivedFrom}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 170 }}
            />
            <TextField
              label="접수일자(종료)"
              type="date"
              name="receivedTo"
              value={filters.receivedTo}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 170 }}
            />
          </Stack>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            borderRadius: 0,
            borderTop: 0,
            bgcolor: 'background.paper',
            px: 1.5,
            py: 1
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ overflowX: 'auto', pb: 0.25 }}>
            {workflowBuckets.map((bucket) => {
              const selected = filters.status === bucket.key;
              return (
                <Button
                  key={bucket.key || 'all'}
                  size="small"
                  variant={selected ? 'contained' : 'outlined'}
                  color={selected ? 'primary' : 'inherit'}
                  onClick={() => handleWorkflowBucketClick(bucket.key)}
                  sx={{
                    flexShrink: 0,
                    minWidth: 'auto',
                    height: 32,
                    px: 1.25,
                    borderRadius: 1,
                    fontWeight: 700
                  }}
                >
                  {bucket.label}
                  <Typography component="span" variant="caption" sx={{ ml: 0.75, opacity: 0.75, fontWeight: 700 }}>
                    {getWorkflowBucketCount(bucket.key)}
                  </Typography>
                </Button>
              );
            })}
          </Stack>
        </Paper>

        {showForm && (
          <InlineEditorPanel
            title={editingRequest ? '서비스 요청 수정' : '새 서비스 요청 생성'}
            subtitle="요청 기본 정보, 일정, 첨부파일을 한 번에 관리합니다."
            onClose={handleCancel}
            width={720}
          >
            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                      {Object.entries(statusLabelMap).map(([key, label]) => (
                        <MenuItem key={key} value={key}>
                          {label}
                        </MenuItem>
                      ))}
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
                    {allRequests
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
                  inputProps={
                    user?.role === 'ROLE_ADMIN'
                      ? {}
                      : { min: new Date().toISOString().split('T')[0] }
                  }
                  helperText={
                    user?.role === 'ROLE_ADMIN'
                      ? '마감일을 선택하세요'
                      : '마감일을 선택하세요 (오늘 이후만 가능)'
                  }
                />

                {user?.role === 'ROLE_ADMIN' && (
                  <>
                    <TextField
                      fullWidth
                      type="date"
                      label="접수일자"
                      name="receivedAt"
                      value={formData.receivedAt}
                      onChange={handleInputChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                    <TextField
                      fullWidth
                      type="date"
                      label="완료보고일"
                      name="resolvedAt"
                      value={formData.resolvedAt}
                      onChange={handleInputChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </>
                )}

                <Divider sx={{ my: 1 }} />

                <FileUpload
                  attachments={attachments}
                  onAttachmentsChange={setAttachments}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2.5 }}>
                <Button onClick={handleCancel}>취소</Button>
                <Button type="submit" variant="contained">
                  {editingRequest ? '수정' : '생성'}
                </Button>
              </Box>
            </Box>
          </InlineEditorPanel>
        )}

        {workflowAction && workflowRequest && (
          <InlineEditorPanel
            title={getWorkflowActionMeta().title}
            subtitle={`#${workflowRequest.id} ${workflowRequest.title}`}
            onClose={closeWorkflowPanel}
            width={520}
          >
            <Box component="form" onSubmit={submitWorkflowAction} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {['assign', 'start'].includes(workflowAction) && user?.role === 'ROLE_ADMIN' && (
                <FormControl fullWidth required>
                  <InputLabel>담당자</InputLabel>
                  <Select
                    value={workflowData.managerId}
                    label="담당자"
                    onChange={(event) => setWorkflowData((prev) => ({ ...prev, managerId: event.target.value }))}
                  >
                    <MenuItem value="">담당자 선택</MenuItem>
                    {managers.map((manager) => (
                      <MenuItem key={manager.id} value={String(manager.id)}>
                        {manager.username || manager.name || manager.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              {['cancel', 'rejectResolution'].includes(workflowAction) ? (
                <TextField
                  label={getWorkflowActionMeta().reasonLabel}
                  value={workflowData.reason}
                  onChange={(event) => setWorkflowData((prev) => ({ ...prev, reason: event.target.value }))}
                  placeholder={getWorkflowActionMeta().reasonPlaceholder}
                  multiline
                  minRows={5}
                  fullWidth
                />
              ) : (
                <TextField
                  label={getWorkflowActionMeta().noteLabel}
                  value={workflowData.note}
                  onChange={(event) => setWorkflowData((prev) => ({ ...prev, note: event.target.value }))}
                  placeholder={getWorkflowActionMeta().notePlaceholder}
                  multiline
                  minRows={5}
                  fullWidth
                />
              )}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={closeWorkflowPanel}>취소</Button>
                <Button type="submit" variant="contained">
                  {getWorkflowActionMeta().submitLabel}
                </Button>
              </Box>
            </Box>
          </InlineEditorPanel>
        )}

        {showDetailDialog && selectedRequest && (
          <InlineEditorPanel
            title="서비스 요청 상세정보"
            subtitle={`#${selectedRequest.id} ${selectedRequest.title}`}
            onClose={handleCloseDetail}
            width={860}
          >
              <Stack spacing={2}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 0 }}>
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
                        {getStatusChip(selectedRequest.status)}
                      </Box>
                    </Box>
                    <Box sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="text.secondary">우선순위</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        {getPriorityChip(selectedRequest.priority)}
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
                      <Typography variant="caption" color="text.secondary">접수일자</Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {selectedRequest.receivedAt
                          ? formatDateForDisplay(selectedRequest.receivedAt)
                          : formatDateTime(selectedRequest.createdAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="text.secondary">완료보고일</Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {selectedRequest.resolvedAt
                          ? formatDateForDisplay(selectedRequest.resolvedAt)
                          : '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 1.25, borderRadius: 1, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="text.secondary">종료일</Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {selectedRequest.closedAt
                          ? formatDateForDisplay(selectedRequest.closedAt)
                          : '-'}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                {user?.role === 'ROLE_ADMIN' && timelineEntries.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 0 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      요청 이력
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={2} sx={{ pl: 1 }}>
                      {timelineEntries.map((entry, index) => (
                        <Box key={`${entry.key}-${index}`} sx={{ display: 'flex', gap: 2, position: 'relative' }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              bgcolor: 'primary.main',
                              borderRadius: '50%',
                              mt: 0.75,
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {entry.label}
                            </Typography>
                            {entry.detail && (
                              <Typography variant="body2" color="text.secondary">
                                {entry.detail}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {entry.dateLabel}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </Paper>
                )}

                {user?.role === 'ROLE_ADMIN' && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 0 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      변경 기록
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {selectedHistories.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        등록된 변경 기록이 없습니다.
                      </Typography>
                    ) : (
                      <Stack spacing={1}>
                        {selectedHistories.map((history) => (
                          <Box
                            key={history.id}
                            sx={{
                              p: 1.5,
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              bgcolor: 'grey.50'
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" fontWeight={600}>
                                {history.eventType || '기록'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {history.createdAt ? formatDateTime(history.createdAt) : ''}
                              </Typography>
                            </Stack>
                            {(history.fromStatus || history.toStatus) && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                상태: {history.fromStatus || '-'} → {history.toStatus || '-'}
                              </Typography>
                            )}
                            {(history.fromManagerId || history.toManagerId) && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                담당자 ID: {history.fromManagerId || '-'} → {history.toManagerId || '-'}
                              </Typography>
                            )}
                            {history.note && (
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {history.note}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Paper>
                )}

                {selectedRequest.description && (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 0 }}>
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
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 0 }}>
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
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 0 }}>
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
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: 0 }}>
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
                            {getStatusChip(followUp.status)}
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
          </InlineEditorPanel>
        )}

        {showResolutionDialog && (
          <InlineEditorPanel
            title={isEditingResolution ? '완료 내용 수정' : '완료보고'}
            subtitle="처리 시간, 완료 내용, 산출물을 등록합니다."
            onClose={handleCancelResolve}
            width={760}
          >
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2.5 }}>
            <Button onClick={handleCancelResolve}>취소</Button>
            <Button
              onClick={handleResolve}
              variant="contained"
              color="success"
              disabled={!resolutionData.hoursSpent || !resolutionData.resolutionNotes}
            >
              완료보고
            </Button>
            </Box>
          </InlineEditorPanel>
        )}

        <Box sx={{ flex: 1, width: '100%', minHeight: 0, display: 'flex' }}>
          <DataGrid
            rows={filteredRequests}
            columns={columns}
            pagination={false}
            hideFooterPagination
            hideFooter
            disableRowSelectionOnClick
            onRowClick={(params) => handleDetailOpen(params.row)}
            getRowId={(row) => row.id}
            localeText={{ noRowsLabel: searched ? '조회 결과가 없습니다.' : '조회 버튼을 눌러 데이터를 조회하세요.' }}
            initialState={{
              sorting: {
                sortModel: [{ field: 'receivedAt', sort: 'desc' }],
              },
            }}
            slots={{
              toolbar: CustomToolbar,
            }}
            showToolbar
            sx={{
              height: '100%',
              minHeight: 500,
              flex: 1,
              scrollbarGutter: 'stable',
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
