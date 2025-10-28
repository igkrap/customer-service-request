import React, { useState, useEffect } from 'react';
import { userAPI, companyAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function UserList() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState({});
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
      setError('Failed to fetch users: ' + err.message);
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

      // Update role if changed
      if (formData.role !== editingUser.role) {
        await userAPI.updateRole(editingUser.id, { role: formData.role });
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
      setFormData({ email: '', password: '', role: '', customerIds: [] });
      fetchUsers();
      setError(null);
    } catch (err) {
      setError('Failed to update user: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (id === user?.id) {
      setError('You cannot delete your own account');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.delete(id);
        fetchUsers();
        setError(null);
      } catch (err) {
        setError('Failed to delete user: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setShowEditForm(false);
    setEditingUser(null);
    setFormData({ email: '', password: '', role: '', customerIds: [] });
  };

  const handleCompanyChange = (userId, companyId) => {
    setSelectedCompanies({
      ...selectedCompanies,
      [userId]: companyId
    });
  };

  const handleApprove = async (userId) => {
    const companyId = selectedCompanies[userId];

    if (!companyId) {
      setError('Please select a company for this user');
      return;
    }

    try {
      await userAPI.approve(userId, parseInt(companyId), 'APPROVED');
      fetchUsers();
      setError(null);

      // Remove the selected company from state
      const newSelected = { ...selectedCompanies };
      delete newSelected[userId];
      setSelectedCompanies(newSelected);
    } catch (err) {
      setError('Failed to approve user: ' + (err.response?.data || err.message));
    }
  };

  const handleReject = async (userId) => {
    if (window.confirm('Are you sure you want to reject this user?')) {
      try {
        await userAPI.reject(userId);
        fetchUsers();
        setError(null);
      } catch (err) {
        setError('Failed to reject user: ' + (err.response?.data || err.message));
      }
    }
  };

  const getApprovalBadge = (status) => {
    let statusClass, displayStatus;
    switch (status) {
      case 'APPROVED':
        statusClass = 'badge-success';
        displayStatus = 'Approved';
        break;
      case 'PENDING':
        statusClass = 'badge-warning';
        displayStatus = 'Pending';
        break;
      case 'REJECTED':
        statusClass = 'badge-danger';
        displayStatus = 'Rejected';
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
        displayRole = 'Admin';
        break;
      case 'ROLE_MANAGER':
        roleClass = 'badge-manager';
        displayRole = 'Manager';
        break;
      case 'ROLE_CUSTOMER':
        roleClass = 'badge-customer';
        displayRole = 'Customer';
        break;
      default:
        roleClass = 'badge-user';
        displayRole = 'User';
    }
    return <span className={`badge ${roleClass}`}>{displayRole}</span>;
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <div className="card">
        <h2>User Management</h2>
        {error && <div className="error">{error}</div>}

        {showEditForm && editingUser && (
          <div className="modal-overlay" onClick={handleCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Edit User: {editingUser.username}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter new password or leave blank"
                  />
                </div>
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="ROLE_CUSTOMER">Customer</option>
                    <option value="ROLE_MANAGER">Manager</option>
                    <option value="ROLE_ADMIN">Admin</option>
                  </select>
                </div>
                {formData.role === 'ROLE_MANAGER' && (
                  <div className="form-group">
                    <label>Assigned Customers (hold Ctrl/Cmd to select multiple)</label>
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
                        ? `${formData.customerIds.length} customer(s) selected`
                        : 'No customers selected'}
                    </small>
                  </div>
                )}
                <div className="btn-group">
                  <button type="submit" className="btn btn-success">
                    Save Changes
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                    Cancel
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
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Company</th>
              <th>Status</th>
              <th>Relationships</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{getRoleBadge(u.role)}</td>
                <td>
                  {u.approvalStatus === 'PENDING' ? (
                    <select
                      value={selectedCompanies[u.id] || ''}
                      onChange={(e) => handleCompanyChange(u.id, e.target.value)}
                      style={{ fontSize: '12px', padding: '2px 5px' }}
                    >
                      <option value="">Select company</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.companyName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    u.companyName || 'N/A'
                  )}
                </td>
                <td>{getApprovalBadge(u.approvalStatus)}</td>
                <td>
                  {u.role === 'ROLE_CUSTOMER' && (
                    <span>
                      Managers: {u.managerNames && u.managerNames.length > 0
                        ? u.managerNames.join(', ')
                        : 'None'}
                    </span>
                  )}
                  {u.role === 'ROLE_MANAGER' && (
                    <span>
                      Customers: {u.customerNames && u.customerNames.length > 0
                        ? u.customerNames.join(', ')
                        : 'None'}
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
                        disabled={!selectedCompanies[u.id]}
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleReject(u.id)}
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleEdit(u)}
                      >
                        Edit
                      </button>
                      {u.id !== user?.id && (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDelete(u.id)}
                        >
                          Delete
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserList;
