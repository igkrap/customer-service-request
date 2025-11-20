import React, { useState, useEffect } from 'react';
import { Box, Paper, CircularProgress, Typography, Alert, IconButton, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { companyAPI } from '../services/api';

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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'companyName', headerName: '회사명', width: 200 },
    { field: 'companyCode', headerName: '회사 코드', width: 150 },
    { field: 'businessNumber', headerName: '사업자 번호', width: 200 },
    {
      field: 'createdAt',
      headerName: '생성일',
      width: 150,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'actions',
      headerName: '작업',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
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

  return (
    <Box sx={{ p: 3, height: '100%' }}>
      <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
          회사 관리
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {!showForm && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => setShowForm(true)}
            sx={{ mb: 3, alignSelf: 'flex-start' }}
          >
            새 회사 등록
          </Button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
            <div className="form-group">
              <label>회사명 *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>회사 코드 *</label>
              <input
                type="text"
                name="companyCode"
                value={formData.companyCode}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>사업자 번호 *</label>
              <input
                type="text"
                name="businessNumber"
                value={formData.businessNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="btn-group">
              <button type="submit" className="btn btn-success">
                {editingCompany ? '수정' : '등록'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                취소
              </button>
            </div>
          </form>
        )}

        <Box sx={{ flex: 1 }}>
          <DataGrid
            rows={companies}
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

export default CompanyList;
