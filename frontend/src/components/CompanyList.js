import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { DataGrid, GridToolbarContainer } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { companyAPI } from '../services/api';
import { formatDateTime } from '../utils/dateFormatter';
import * as XLSX from 'xlsx';

function CompanyList() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    companyName: '',
    companyCode: '',
    businessNumber: ''
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getAll();
      setCompanies(response.data);
      setError(null);
    } catch (err) {
      setError('회사 목록 불러오기 실패: ' + err.message);
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
      if (editingCompany) {
        await companyAPI.update(editingCompany.id, formData);
      } else {
        await companyAPI.create(formData);
      }

      setFormData({
        companyName: '',
        companyCode: '',
        businessNumber: ''
      });
      setShowForm(false);
      setEditingCompany(null);
      fetchCompanies();
    } catch (err) {
      setError('회사 저장 실패: ' + (err.response?.data || err.message));
    }
  };

  const handleEdit = (company) => {
    setEditingCompany(company);
    setFormData({
      companyName: company.companyName,
      companyCode: company.companyCode,
      businessNumber: company.businessNumber
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('이 회사를 삭제하시겠습니까?')) {
      try {
        await companyAPI.delete(id);
        fetchCompanies();
      } catch (err) {
        setError('회사 삭제 실패: ' + (err.response?.data || err.message));
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCompany(null);
    setFormData({
      companyName: '',
      companyCode: '',
      businessNumber: ''
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  const columns = [
    { field: 'id', headerName: '회사 ID', width: 90 },
    { field: 'companyName', headerName: '회사명', width: 220 },
    { field: 'companyCode', headerName: '회사 코드', width: 150 },
    { field: 'businessNumber', headerName: '사업자 번호', width: 200 },
    {
      field: 'createdAt',
      headerName: '생성일',
      width: 180,
      valueFormatter: (params) => {
        // params can be either the value directly or an object with value property
        const value = params?.value !== undefined ? params.value : params;
        if (!value) return '';
        return formatDateTime(value) || '';
      }
    },
    {
      field: 'actions',
      headerName: '작업',
      width: 120,
      sortable: false,
      renderCell: (params) => (
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
      )
    }
  ];

  const handleExportToExcel = () => {
    const headers = ['회사 ID', '회사명', '회사 코드', '사업자 번호', '생성일'];

    const excelData = companies.map(company => [
      company.id,
      company.companyName,
      company.companyCode,
      company.businessNumber,
      company.createdAt ? formatDateTime(company.createdAt) : ''
    ]);

    const worksheetData = [headers, ...excelData];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    const columnWidths = [
      { wch: 10 }, // 회사 ID
      { wch: 25 }, // 회사명
      { wch: 15 }, // 회사 코드
      { wch: 20 }, // 사업자 번호
      { wch: 20 }  // 생성일
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '회사');

    const fileName = `회사목록_${new Date().toISOString().split('T')[0]}.xlsx`;
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
            회사 관리
          </Typography>
          {!showForm && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowForm(true)}
            >
              새 회사 등록
            </Button>
          )}
        </Box>
      </Box>
      <Box sx={{ flexGrow: 1, minHeight: 0, p: 3, display: 'flex', flexDirection: 'column' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Dialog open={showForm} onClose={handleCancel} maxWidth="sm" fullWidth>
          <DialogTitle>{editingCompany ? '회사 정보 수정' : '새 회사 등록'}</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <TextField
                  fullWidth
                  required
                  label="회사명"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                />

                <TextField
                  fullWidth
                  required
                  label="회사 코드"
                  name="companyCode"
                  value={formData.companyCode}
                  onChange={handleInputChange}
                />

                <TextField
                  fullWidth
                  required
                  label="사업자 번호"
                  name="businessNumber"
                  value={formData.businessNumber}
                  onChange={handleInputChange}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancel}>취소</Button>
              <Button type="submit" variant="contained" color="primary">
                {editingCompany ? '수정' : '등록'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <DataGrid
            rows={companies}
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
            sx={{ height: '100%' }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default CompanyList;
