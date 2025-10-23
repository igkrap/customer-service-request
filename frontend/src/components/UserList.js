import React, { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function UserList() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '',
    assignedManagerId: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAll();
      setUsers(response.data);

      // Fetch managers for assignment dropdown
      const managersResponse = await userAPI.getAllManagers();
      setManagers(managersResponse.data);

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
      assignedManagerId: userToEdit.assignedManagerId || ''
    });
    setShowEditForm(true);
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

      // Update manager assignment if role is customer and assignment changed
      if (formData.role === 'ROLE_CUSTOMER') {
        const newManagerId = formData.assignedManagerId ? parseInt(formData.assignedManagerId) : null;
        const oldManagerId = editingUser.assignedManagerId || null;

        if (newManagerId !== oldManagerId) {
          await userAPI.assignManager(editingUser.id, newManagerId);
        }
      }

      setShowEditForm(false);
      setEditingUser(null);
      setFormData({ email: '', password: '', role: '', assignedManagerId: '' });
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
    setFormData({ email: '', password: '', role: '', assignedManagerId: '' });
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
                {formData.role === 'ROLE_CUSTOMER' && (
                  <div className="form-group">
                    <label>Assigned Manager</label>
                    <select
                      name="assignedManagerId"
                      value={formData.assignedManagerId}
                      onChange={handleInputChange}
                    >
                      <option value="">No manager assigned</option>
                      {managers.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.username} - {m.email}
                        </option>
                      ))}
                    </select>
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
              <th>Assigned Manager</th>
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
                  {u.role === 'ROLE_CUSTOMER'
                    ? (u.assignedManagerName || 'None')
                    : '-'}
                </td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
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
