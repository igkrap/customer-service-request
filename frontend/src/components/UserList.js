import React, { useState, useEffect } from 'react';
import { Box, Paper, CircularProgress, Typography, Alert, IconButton, Button, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { userAPI, companyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/dateFormatter';

function UserList() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState({});
  const [selectedRoles, setSelectedRoles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '',
    companyId: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [usersResponse, companiesResponse] = await Promise.all([
        userAPI.getAll(),
        companyAPI.getAll()
      ]);

      setUsers(usersResponse.data);
      setCompanies(companiesResponse.data);

      // Fetch customers for assignment dropdown
      const allCustomers = usersResponse.data.filter(u => u.role === 'ROLE_CUSTOMER');
      setCustomers(allCustomers);

      setError(null);
    } catch (err) {
      setError('사용자 목록 불러오기 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (userToEdit) => {
    setEditingUser(userToEdit);
    setFormData({
      email: userToEdit.email,
      password: '',
      role: userToEdit.role,
      companyId: userToEdit.companyId || ''
    });
    setShowEditForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Update email if changed
      if (formData.email !== editingUser.email) {
        await userAPI.updateEmail(editingUser.id, { email: formData.email });
      }

      // Update password if provided
      if (formData.password && formData.password.trim() !== '') {
        await userAPI.updatePassword(editingUser.id, { password: formData.password });
      }

      // Update role (and company if applicable) if changed
      if (formData.role !== editingUser.role || formData.companyId !== editingUser.companyId) {
        await userAPI.updateRole(editingUser.id, {
          role: formData.role,
          companyId: formData.companyId ? parseInt(formData.companyId) : null
        });
      }

      setShowEditForm(false);
      setEditingUser(null);
      setFormData({ email: '', password: '', role: '', companyId: '' });
      fetchUsers();
      setError(null);
    } catch (err) {
      setError('사용자 수정 실패: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (id === user?.id) {
      setError('자신의 계정은 삭제할 수 없습니다');
      return;
    }

    if (window.confirm('이 사용자를 삭제하시겠습니까?')) {
      try {
        await userAPI.delete(id);
        fetchUsers();
        setError(null);
      } catch (err) {
        setError('사용자 삭제 실패: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setShowEditForm(false);
    setEditingUser(null);
    setFormData({ email: '', password: '', role: '', companyId: '' });
  };

  const handleRoleChange = (userId, role) => {
    setSelectedRoles({
      ...selectedRoles,
      [userId]: role
    });

    // Clear company selection if role is not CUSTOMER
    if (role !== 'ROLE_CUSTOMER') {
      const newSelectedCompanies = { ...selectedCompanies };
      delete newSelectedCompanies[userId];
      setSelectedCompanies(newSelectedCompanies);
    }
  };

  const handleCompanyChange = (userId, companyId) => {
    setSelectedCompanies({
      ...selectedCompanies,
      [userId]: companyId
    });
  };

  const handleApprove = async (userId) => {
    const role = selectedRoles[userId];
    const companyId = selectedCompanies[userId];

    if (!role) {
      setError('사용자의 역할을 선택하세요');
      return;
    }

    // Company is required only for CUSTOMER role
    if (role === 'ROLE_CUSTOMER' && !companyId) {
      setError('유저 역할에는 회사를 선택해야 합니다');
      return;
    }

    try {
      await userAPI.approve(userId, role, companyId ? parseInt(companyId) : null, 'APPROVED');
      fetchUsers();
      setError(null);

      // Remove the selections from state
      const newSelectedRoles = { ...selectedRoles };
      const newSelectedCompanies = { ...selectedCompanies };
      delete newSelectedRoles[userId];
      delete newSelectedCompanies[userId];
      setSelectedRoles(newSelectedRoles);
      setSelectedCompanies(newSelectedCompanies);
    } catch (err) {
      setError('사용자 승인 실패: ' + (err.response?.data || err.message));
    }
  };

  const handleReject = async (userId) => {
    if (window.confirm('이 사용자를 거부하시겠습니까?')) {
      try {
        await userAPI.reject(userId);
        fetchUsers();
        setError(null);
      } catch (err) {
        setError('사용자 거부 실패: ' + (err.response?.data || err.message));
      }
    }
  };

  const getApprovalBadge = (status) => {
    let color, displayStatus;
    switch (status) {
      case 'APPROVED':
        color = 'success';
        displayStatus = '승인됨';
        break;
      case 'PENDING':
        color = 'warning';
        displayStatus = '대기 중';
        break;
      case 'REJECTED':
        color = 'error';
        displayStatus = '거부됨';
        break;
      default:
        color = 'default';
        displayStatus = status;
    }
    return <Chip label={displayStatus} color={color} size="small" />;
  };

  const getRoleBadge = (role) => {
    let color, displayRole;
    switch (role) {
      case 'ROLE_ADMIN':
        color = 'error';
        displayRole = '관리자';
        break;
      case 'ROLE_MANAGER':
        color = 'primary';
        displayRole = '매니저';
        break;
      case 'ROLE_CUSTOMER':
        color = 'secondary';
        displayRole = '유저';
        break;
      default:
        color = 'default';
        displayRole = '사용자';
    }
    return <Chip label={displayRole} color={color} size="small" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  const columns = [
    { field: 'userId', headerName: '사용자 ID', width: 120 },
    { field: 'username', headerName: '사용자명', width: 180 },
    { field: 'email', headerName: '이메일', width: 200 },
    {
      field: 'role',
      headerName: '역할',
      width: 150,
      renderCell: (params) => {
        const u = params.row;
        if (u.approvalStatus === 'PENDING') {
          return (
            <select
              value={selectedRoles[u.id] || ''}
              onChange={(e) => handleRoleChange(u.id, e.target.value)}
              style={{ fontSize: '12px', padding: '2px 5px', width: '100%' }}
            >
              <option value="">역할 선택</option>
              <option value="ROLE_CUSTOMER">유저</option>
              <option value="ROLE_MANAGER">매니저</option>
              <option value="ROLE_ADMIN">관리자</option>
            </select>
          );
        }
        return getRoleBadge(u.role);
      }
    },
    {
      field: 'companyName',
      headerName: '회사',
      width: 150,
      renderCell: (params) => {
        const u = params.row;
        if (u.approvalStatus === 'PENDING') {
          return (
            <select
              value={selectedCompanies[u.id] || ''}
              onChange={(e) => handleCompanyChange(u.id, e.target.value)}
              disabled={!selectedRoles[u.id] || selectedRoles[u.id] !== 'ROLE_CUSTOMER'}
              style={{ fontSize: '12px', padding: '2px 5px', width: '100%' }}
            >
              <option value="">회사 선택</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.companyName}
                </option>
              ))}
            </select>
          );
        }
        return u.companyName || '없음';
      }
    },
    {
      field: 'approvalStatus',
      headerName: '상태',
      width: 120,
      renderCell: (params) => getApprovalBadge(params.value)
    },
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
      width: 150,
      sortable: false,
      renderCell: (params) => {
        const u = params.row;
        if (u.approvalStatus === 'PENDING') {
          return (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
              <IconButton
                color="success"
                size="small"
                onClick={() => handleApprove(u.id)}
                disabled={!selectedRoles[u.id] || (selectedRoles[u.id] === 'ROLE_CUSTOMER' && !selectedCompanies[u.id])}
                title="승인"
              >
                <CheckIcon fontSize="small" />
              </IconButton>
              <IconButton
                color="error"
                size="small"
                onClick={() => handleReject(u.id)}
                title="거부"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        }
        return (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
            <IconButton
              color="primary"
              size="small"
              onClick={() => handleEdit(u)}
              title="수정"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            {u.id !== user?.id && (
              <IconButton
                color="error"
                size="small"
                onClick={() => handleDelete(u.id)}
                title="삭제"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        );
      }
    }
  ];

  return (
    <Box sx={{ p: 1, height: '100%' }}>
      <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" component="h2" sx={{ mb: 3 }}>
          사용자 관리
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {showEditForm && editingUser && (
          <div className="modal-overlay" onClick={handleCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>사용자 수정: {editingUser.username}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>이메일 *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>새 비밀번호 (현재 비밀번호를 유지하려면 비워두세요)</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="새 비밀번호를 입력하거나 비워두세요"
                  />
                </div>
                <div className="form-group">
                  <label>역할 *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="ROLE_CUSTOMER">유저</option>
                    <option value="ROLE_MANAGER">매니저</option>
                    <option value="ROLE_ADMIN">관리자</option>
                  </select>
                </div>
                {formData.role === 'ROLE_CUSTOMER' && (
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
                          {company.companyName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="btn-group">
                  <button type="submit" className="btn btn-success">
                    변경사항 저장
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                    취소
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Box sx={{ flex: 1 }}>
          <DataGrid
            rows={users}
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

export default UserList;
