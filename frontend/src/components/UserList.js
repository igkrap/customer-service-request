import React, { useState, useEffect } from 'react';
import { Box, Paper, CircularProgress } from '@mui/material';
import { userAPI, companyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

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
    customerIds: []
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
      companyId: userToEdit.companyId || '',
      customerIds: userToEdit.customerIds || []
    });
    setShowEditForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value, options } = e.target;

    // Handle multiple select for customerIds
    if (name === 'customerIds') {
      const selectedValues = Array.from(options)
        .filter(option => option.selected)
        .map(option => parseInt(option.value));
      setFormData({
        ...formData,
        [name]: selectedValues
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

      // Update customer assignments if role is manager
      if (formData.role === 'ROLE_MANAGER') {
        const newCustomerIds = formData.customerIds || [];
        const oldCustomerIds = editingUser.customerIds || [];

        // Check if customer assignments changed
        const changed = newCustomerIds.length !== oldCustomerIds.length ||
                        !newCustomerIds.every(id => oldCustomerIds.includes(id));

        if (changed) {
          await userAPI.assignCustomersToManager(editingUser.id, newCustomerIds);
        }
      }

      setShowEditForm(false);
      setEditingUser(null);
      setFormData({ email: '', password: '', role: '', companyId: '', customerIds: [] });
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
    setFormData({ email: '', password: '', role: '', companyId: '', customerIds: [] });
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
      setError('고객 역할에는 회사를 선택해야 합니다');
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
    let statusClass, displayStatus;
    switch (status) {
      case 'APPROVED':
        statusClass = 'badge-success';
        displayStatus = '승인됨';
        break;
      case 'PENDING':
        statusClass = 'badge-warning';
        displayStatus = '대기 중';
        break;
      case 'REJECTED':
        statusClass = 'badge-danger';
        displayStatus = '거부됨';
        break;
      default:
        statusClass = 'badge-user';
        displayStatus = status;
    }
    return <span className={`badge ${statusClass}`}>{displayStatus}</span>;
  };

  const getRoleBadge = (role) => {
    let roleClass, displayRole;
    switch (role) {
      case 'ROLE_ADMIN':
        roleClass = 'badge-admin';
        displayRole = '관리자';
        break;
      case 'ROLE_MANAGER':
        roleClass = 'badge-manager';
        displayRole = '매니저';
        break;
      case 'ROLE_CUSTOMER':
        roleClass = 'badge-customer';
        displayRole = '고객';
        break;
      default:
        roleClass = 'badge-user';
        displayRole = '사용자';
    }
    return <span className={`badge ${roleClass}`}>{displayRole}</span>;
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
        <h2>사용자 관리</h2>
        {error && <div className="error">{error}</div>}

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
                    <option value="ROLE_CUSTOMER">고객</option>
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
                {formData.role === 'ROLE_MANAGER' && (
                  <div className="form-group">
                    <label>담당 고객 (Ctrl/Cmd를 눌러 여러 개 선택)</label>
                    <select
                      name="customerIds"
                      value={formData.customerIds.map(String)}
                      onChange={handleInputChange}
                      multiple
                      size="5"
                      style={{ height: 'auto' }}
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.username} - {c.email}
                        </option>
                      ))}
                    </select>
                    <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                      {formData.customerIds.length > 0
                        ? `${formData.customerIds.length}명의 고객 선택됨`
                        : '선택된 고객 없음'}
                    </small>
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

        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>사용자명</th>
              <th>이메일</th>
              <th>역할</th>
              <th>회사</th>
              <th>상태</th>
              <th>관계</th>
              <th>생성일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>
                  {u.approvalStatus === 'PENDING' ? (
                    <select
                      value={selectedRoles[u.id] || ''}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{ fontSize: '12px', padding: '2px 5px' }}
                    >
                      <option value="">역할 선택</option>
                      <option value="ROLE_CUSTOMER">고객</option>
                      <option value="ROLE_MANAGER">매니저</option>
                      <option value="ROLE_ADMIN">관리자</option>
                    </select>
                  ) : (
                    getRoleBadge(u.role)
                  )}
                </td>
                <td>
                  {u.approvalStatus === 'PENDING' ? (
                    <select
                      value={selectedCompanies[u.id] || ''}
                      onChange={(e) => handleCompanyChange(u.id, e.target.value)}
                      disabled={!selectedRoles[u.id] || selectedRoles[u.id] !== 'ROLE_CUSTOMER'}
                      style={{ fontSize: '12px', padding: '2px 5px' }}
                    >
                      <option value="">회사 선택</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.companyName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    u.companyName || '없음'
                  )}
                </td>
                <td>{getApprovalBadge(u.approvalStatus)}</td>
                <td>
                  {u.role === 'ROLE_CUSTOMER' && (
                    <span>
                      매니저: {u.managerNames && u.managerNames.length > 0
                        ? u.managerNames.join(', ')
                        : '없음'}
                    </span>
                  )}
                  {u.role === 'ROLE_MANAGER' && (
                    <span>
                      고객: {u.customerNames && u.customerNames.length > 0
                        ? u.customerNames.join(', ')
                        : '없음'}
                    </span>
                  )}
                  {u.role === 'ROLE_ADMIN' && '-'}
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  {u.approvalStatus === 'PENDING' ? (
                    <>
                      <button
                        className="btn btn-success"
                        onClick={() => handleApprove(u.id)}
                        disabled={!selectedRoles[u.id] || (selectedRoles[u.id] === 'ROLE_CUSTOMER' && !selectedCompanies[u.id])}
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        승인
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleReject(u.id)}
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        거부
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleEdit(u)}
                      >
                        수정
                      </button>
                      {u.id !== user?.id && (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(u.id)}
                        >
                          삭제
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Paper>
    </Box>
  );
}

export default UserList;
