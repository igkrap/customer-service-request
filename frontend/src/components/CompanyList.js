import React, { useState } from 'react';
import {
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Button,
  TextField
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { companyAPI } from '../services/api';
import { formatDateTime } from '../utils/dateFormatter';
import * as XLSX from 'xlsx';
import PageHeader, { PageActionButton, PageActions } from './common/PageHeader';
import InlineEditorPanel from './common/InlineEditorPanel';
import { confirmAction } from '../utils/alerts';

function CompanyList() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    companyName: '',
    companyCode: '',
    businessNumber: ''
  });

  const fetchCompanies = async () => {
    try {
      setSearched(true);
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
    const confirmed = await confirmAction({
      title: '회사 삭제',
      text: '이 회사를 삭제하시겠습니까?',
      confirmButtonText: '삭제',
    });

    if (!confirmed) {
      return;
    }

    try {
      await companyAPI.delete(id);
      fetchCompanies();
    } catch (err) {
      setError('회사 삭제 실패: ' + (err.response?.data || err.message));
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
    return null;
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PageHeader
        title="회사 관리"
        actions={
          <PageActions>
            <PageActionButton action="search" onClick={fetchCompanies} />
            <PageActionButton action="export" onClick={handleExportToExcel} disabled={companies.length === 0} />
            {!showForm && (
              <PageActionButton action="create" onClick={() => setShowForm(true)} />
            )}
          </PageActions>
        }
      />
      <Box sx={{ flexGrow: 1, minHeight: 0, p: 0, display: 'flex', flexDirection: 'column' }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {showForm && (
          <InlineEditorPanel
            title={editingCompany ? '회사 정보 수정' : '새 회사 등록'}
            subtitle="회사명, 회사 코드, 사업자 번호를 입력합니다."
            onClose={handleCancel}
          >
            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2.5 }}>
              <Button type="button" onClick={handleCancel}>취소</Button>
              <Button type="submit" variant="contained" color="primary">
                {editingCompany ? '수정' : '등록'}
              </Button>
              </Box>
            </Box>
          </InlineEditorPanel>
        )}

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
            sx={{ height: '100%', scrollbarGutter: 'stable' }}
            localeText={{ noRowsLabel: searched ? '조회 결과가 없습니다.' : '조회 버튼을 눌러 데이터를 조회하세요.' }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default CompanyList;
