import React, { useState, useEffect } from 'react';
import { Box, Paper, CircularProgress } from '@mui/material';
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

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <h2>회사 관리</h2>
        {error && <div className="error">{error}</div>}

        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            새 회사 등록
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit}>
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

        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>회사명</th>
              <th>회사 코드</th>
              <th>사업자 번호</th>
              <th>생성일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(company => (
              <tr key={company.id}>
                <td>{company.id}</td>
                <td>{company.companyName}</td>
                <td>{company.companyCode}</td>
                <td>{company.businessNumber}</td>
                <td>{new Date(company.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleEdit(company)}
                  >
                    수정
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDelete(company.id)}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Paper>
    </Box>
  );
}

export default CompanyList;
