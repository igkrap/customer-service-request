import React, { useState } from 'react';
import { projectRequestAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getServiceTypeLabel } from '../utils/serviceTypeLabel';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Typography,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { formatDateTime } from '../utils/dateFormatter';
import * as XLSX from 'xlsx';
import PageHeader, { PageActionButton, PageActions } from './common/PageHeader';
import InlineEditorPanel from './common/InlineEditorPanel';
import { confirmAction } from '../utils/alerts';

function ProjectRequestList() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [formData, setFormData] = useState({
    projectName: '',
    serviceType: 'MAINTENANCE',
    contractStartDate: '',
    contractEndDate: '',
    contractManDays: ''
  });

  const fetchData = async () => {
    try {
      setSearched(true);
      setLoading(true);
      const response = await projectRequestAPI.getAll();
      setRequests(response.data);
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
        contractManDays: parseFloat(formData.contractManDays)
      };

      if (editingRequest) {
        await projectRequestAPI.update(editingRequest.id, submitData);
      } else {
        await projectRequestAPI.create(submitData);
      }

      setFormData({
        projectName: '',
        serviceType: 'MAINTENANCE',
        contractStartDate: '',
        contractEndDate: '',
        contractManDays: ''
      });
      setShowForm(false);
      setEditingRequest(null);
      fetchData();
    } catch (err) {
      setError('Failed to save project request: ' + (err.response?.data || err.message));
    }
  };

  const handleEdit = (request) => {
    setEditingRequest(request);
    setFormData({
      projectName: request.projectName,
      serviceType: request.serviceType,
      contractStartDate: request.contractStartDate,
      contractEndDate: request.contractEndDate,
      contractManDays: request.contractManDays.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmAction({
      title: '프로젝트 등록 요청 삭제',
      text: '이 프로젝트 등록 요청을 삭제하시겠습니까?',
      confirmButtonText: '삭제',
    });

    if (!confirmed) {
      return;
    }

    try {
      await projectRequestAPI.delete(id);
      fetchData();
    } catch (err) {
      setError('Failed to delete project request: ' + (err.response?.data || err.message));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRequest(null);
    setFormData({
      projectName: '',
      serviceType: 'MAINTENANCE',
      contractStartDate: '',
      contractEndDate: '',
      contractManDays: ''
    });
  };

  const getStatusChip = (status) => {
    const colorMap = {
      'PENDING': 'warning',
      'APPROVED': 'success',
      'REJECTED': 'error'
    };
    return <Chip label={status} color={colorMap[status] || 'default'} size="small" />;
  };

  const columns = [
    { field: 'id', headerName: '프로젝트 요청 ID', flex: 0.8, minWidth: 100 },
    { field: 'projectName', headerName: '프로젝트명', flex: 2, minWidth: 150 },
    { field: 'companyName', headerName: '회사', flex: 1.5, minWidth: 120 },
    {
      field: 'serviceType',
      headerName: '서비스 유형',
      flex: 1,
      minWidth: 120,
      valueFormatter: (params) => {
        const value = params?.value !== undefined ? params.value : params;
        if (!value) return '';
        return getServiceTypeLabel(value);
      }
    },
    {
      field: 'contractStartDate',
      headerName: '시작일',
      flex: 1,
      minWidth: 100,
      valueFormatter: (params) => {
        const value = params?.value !== undefined ? params.value : params;
        if (!value) return '';
        return new Date(value).toLocaleDateString();
      }
    },
    {
      field: 'contractEndDate',
      headerName: '종료일',
      flex: 1,
      minWidth: 100,
      valueFormatter: (params) => {
        const value = params?.value !== undefined ? params.value : params;
        if (!value) return '';
        return new Date(value).toLocaleDateString();
      }
    },
    {
      field: 'contractManDays',
      headerName: 'm/d',
      flex: 0.8,
      minWidth: 80
    },
    {
      field: 'requestStatus',
      headerName: '상태',
      flex: 1,
      minWidth: 100,
      renderCell: (params) => params.value ? getStatusChip(params.value) : null
    },
    {
      field: 'createdAt',
      headerName: '생성일',
      flex: 1.5,
      minWidth: 180,
      valueFormatter: (params) => {
        const value = params?.value !== undefined ? params.value : params;
        if (!value) return '';
        return formatDateTime(value) || '';
      }
    },
    {
      field: 'actions',
      headerName: '작업',
      flex: 1,
      minWidth: 100,
      sortable: false,
      renderCell: (params) => {
        if (!params.row || params.row.requestStatus !== 'PENDING') return null;

        return (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', height: '100%' }}>
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
          </Box>
        );
      }
    }
  ];

  const handleExportToExcel = () => {
    const headers = ['프로젝트 요청 ID', '프로젝트명', '회사', '서비스 유형', '시작일', '종료일', 'm/d', '상태', '생성일'];

    const statusMap = {
      'PENDING': '대기',
      'APPROVED': '승인',
      'REJECTED': '거부'
    };

    const excelData = requests.map(req => [
      req.id,
      req.projectName,
      req.companyName,
      getServiceTypeLabel(req.serviceType),
      req.contractStartDate ? new Date(req.contractStartDate).toLocaleDateString() : '',
      req.contractEndDate ? new Date(req.contractEndDate).toLocaleDateString() : '',
      req.contractManDays || '',
      statusMap[req.requestStatus] || req.requestStatus,
      req.createdAt ? formatDateTime(req.createdAt) : ''
    ]);

    const worksheetData = [headers, ...excelData];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    const columnWidths = [
      { wch: 15 }, // 프로젝트 요청 ID
      { wch: 25 }, // 프로젝트명
      { wch: 20 }, // 회사
      { wch: 15 }, // 서비스 유형
      { wch: 12 }, // 시작일
      { wch: 12 }, // 종료일
      { wch: 10 }, // m/d
      { wch: 10 }, // 상태
      { wch: 20 }  // 생성일
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '프로젝트 요청');

    const fileName = `내프로젝트요청목록_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="내 프로젝트 등록 요청"
        subtitle="신규 프로젝트 등록 요청과 처리 상태를 확인합니다."
        actions={
          <PageActions>
            <PageActionButton action="search" onClick={fetchData} />
            <PageActionButton action="export" onClick={handleExportToExcel} disabled={requests.length === 0} />
            {!showForm && (
              <PageActionButton action="create" onClick={() => setShowForm(true)} />
            )}
          </PageActions>
        }
      />
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Alert severity="info" sx={{ mb: 0, borderRadius: 0 }}>
          회사의 새 프로젝트 등록을 요청하세요. 관리자가 검토 후 승인합니다.
        </Alert>

        {showForm && (
          <InlineEditorPanel
            title={editingRequest ? '프로젝트 등록 요청 수정' : '새 프로젝트 등록 요청'}
            subtitle="관리자가 검토할 프로젝트 계약 정보를 입력합니다."
            onClose={handleCancel}
          >
            <Box component="form" onSubmit={handleSubmit}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  gap: 2,
                }}
              >
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
                    <MenuItem value="NEW">신규</MenuItem>
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
                  inputProps={{ step: "0.01", min: "0" }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2.5 }}>
              <Button type="button" onClick={handleCancel}>취소</Button>
              <Button type="submit" variant="contained">
                {editingRequest ? '수정' : '요청 제출'}
              </Button>
              </Box>
            </Box>
          </InlineEditorPanel>
        )}

        <Box sx={{ flex: 1, minHeight: 0, width: '100%' }}>
          <DataGrid
            sx={{ scrollbarGutter: 'stable' }}
            localeText={{ noRowsLabel: searched ? '조회 결과가 없습니다.' : '조회 버튼을 눌러 데이터를 조회하세요.' }}
            rows={requests}
            columns={columns}
            pagination={false}
            hideFooterPagination
            hideFooter
            disableSelectionOnClick
            autoHeight={false}
            slots={{
              toolbar: CustomToolbar,
            }}
            showToolbar
          />
        </Box>
      </Box>
    </Box>
  );
}

export default ProjectRequestList;
