import React, { useState, useEffect } from 'react';
import { serviceRequestAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function ServiceRequestList() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    customerId: '',
    managerId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const requestsResponse = await serviceRequestAPI.getAll();
      setRequests(requestsResponse.data);

      // Fetch managers for the dropdown
      try {
        if (user?.role === 'ROLE_CUSTOMER') {
          // For customers, only show their assigned managers
          if (user.id) {
            const userResponse = await userAPI.getById(user.id);
            const userData = userResponse.data;

            if (userData.managerIds && userData.managerIds.length > 0) {
              // Fetch all managers and filter to assigned ones
              const managersResponse = await userAPI.getAllManagers();
              const assignedManagers = managersResponse.data.filter(m =>
                userData.managerIds.includes(m.id)
              );
              setManagers(assignedManagers);
            } else {
              setManagers([]);
            }
          }
        } else {
          // For admin and manager, show all managers
          const managersResponse = await userAPI.getAllManagers();
          setManagers(managersResponse.data);
        }
      } catch (err) {
        if (err.response?.status !== 403) {
          console.error('Failed to fetch managers:', err);
        }
      }

      // Fetch all users (customers) if admin
      if (user?.role === 'ROLE_ADMIN') {
        try {
          const usersResponse = await userAPI.getAll();
          setCustomers(usersResponse.data.filter(u => u.role === 'ROLE_CUSTOMER'));
        } catch (err) {
          if (err.response?.status !== 403) {
            console.error('Failed to fetch customers:', err);
          }
        }
      }

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
        customerId: parseInt(formData.customerId || user?.id),
        managerId: formData.managerId ? parseInt(formData.managerId) : null
      };

      if (editingRequest) {
        await serviceRequestAPI.update(editingRequest.id, submitData);
      } else {
        await serviceRequestAPI.create(submitData);
      }

      setFormData({
        title: '',
        description: '',
        status: 'OPEN',
        priority: 'MEDIUM',
        customerId: '',
        managerId: ''
      });
      setShowForm(false);
      setEditingRequest(null);
      fetchData();
    } catch (err) {
      setError('Failed to save service request: ' + err.message);
    }
  };

  const handleEdit = (request) => {
    setEditingRequest(request);
    setFormData({
      title: request.title,
      description: request.description || '',
      status: request.status,
      priority: request.priority,
      customerId: request.customerId.toString(),
      managerId: request.managerId ? request.managerId.toString() : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this service request?')) {
      try {
        await serviceRequestAPI.delete(id);
        fetchData();
      } catch (err) {
        setError('Failed to delete service request: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRequest(null);
    setFormData({
      title: '',
      description: '',
      status: 'OPEN',
      priority: 'MEDIUM',
      customerId: '',
      managerId: ''
    });
  };

  const handleStatusChange = async (requestId, newStatus) => {
    try {
      await serviceRequestAPI.updateStatus(requestId, newStatus);
      fetchData();
      setError(null);
    } catch (err) {
      setError('Failed to update status: ' + (err.response?.data || err.message));
    }
  };

  const canEditRequest = (request) => {
    // Admin can edit all requests
    if (user?.role === 'ROLE_ADMIN') return true;
    // Customer can edit their own requests
    if (user?.role === 'ROLE_CUSTOMER' && request.customerId === user?.id) return true;
    return false;
  };

  const canChangeStatus = (request) => {
    // Admin can always change status
    if (user?.role === 'ROLE_ADMIN') return true;
    // Manager can change status if assigned to the request
    if (user?.role === 'ROLE_MANAGER' && request.managerId === user?.id) return true;
    return false;
  };

  const getStatusBadge = (status) => {
    const statusClass = status.toLowerCase().replace('_', '-');
    return <span className={`badge badge-${statusClass}`}>{status}</span>;
  };

  const getPriorityBadge = (priority) => {
    return <span className={`badge badge-${priority.toLowerCase()}`}>{priority}</span>;
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <div className="card">
        <h2>Service Request Management</h2>
        {error && <div className="error">{error}</div>}

        {!showForm && (user?.role === 'ROLE_CUSTOMER' || user?.role === 'ROLE_ADMIN') && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            Create New Service Request
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit}>
            {user?.role === 'ROLE_ADMIN' && customers.length > 0 && (
              <div className="form-group">
                <label>Customer *</label>
                <select
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.username} - {c.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Priority *</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            {user?.role === 'ROLE_ADMIN' && (
              <div className="form-group">
                <label>Status *</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            )}
            <div className="form-group">
              <label>Manager</label>
              <select
                name="managerId"
                value={formData.managerId}
                onChange={handleInputChange}
              >
                <option value="">Select a manager (optional)</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.username} - {m.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="btn-group">
              <button type="submit" className="btn btn-success">
                {editingRequest ? 'Update' : 'Create'} Request
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Manager</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(request => (
              <tr key={request.id}>
                <td>{request.id}</td>
                <td>{request.title}</td>
                <td>{request.customerName}</td>
                <td>{getStatusBadge(request.status)}</td>
                <td>{getPriorityBadge(request.priority)}</td>
                <td>{request.managerName || 'Unassigned'}</td>
                <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                <td>
                  {canEditRequest(request) && (
                    <>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleEdit(request)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(request.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {canChangeStatus(request) && user?.role === 'ROLE_MANAGER' && (
                    <>
                      {request.status !== 'IN_PROGRESS' && (
                        <button
                          className="btn btn-success"
                          onClick={() => handleStatusChange(request.id, 'IN_PROGRESS')}
                          style={{marginLeft: '5px'}}
                        >
                          Start
                        </button>
                      )}
                      {request.status !== 'RESOLVED' && (
                        <button
                          className="btn btn-info"
                          onClick={() => handleStatusChange(request.id, 'RESOLVED')}
                          style={{marginLeft: '5px'}}
                        >
                          Complete
                        </button>
                      )}
                      {request.status !== 'CLOSED' && (
                        <button
                          className="btn btn-warning"
                          onClick={() => handleStatusChange(request.id, 'CLOSED')}
                          style={{marginLeft: '5px'}}
                        >
                          Close
                        </button>
                      )}
                    </>
                  )}
                  {!canEditRequest(request) && !canChangeStatus(request) && (
                    <span style={{color: '#999', fontSize: '14px'}}>-</span>
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

export default ServiceRequestList;
