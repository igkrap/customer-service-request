import React, { useState, useEffect } from 'react';
import { serviceRequestAPI, customerAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function ServiceRequestList() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [customers, setCustomers] = useState([]);
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
    assignedTo: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const requestsResponse = await serviceRequestAPI.getAll();
      setRequests(requestsResponse.data);

      // Try to fetch customers, but silently fail if forbidden (user doesn't have permission)
      try {
        const customersResponse = await customerAPI.getAll();
        setCustomers(customersResponse.data);
      } catch (err) {
        if (err.response?.status === 403) {
          // User doesn't have permission to view customers, that's okay
          setCustomers([]);
        } else {
          throw err;
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
        customerId: parseInt(formData.customerId)
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
        assignedTo: ''
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
      assignedTo: request.assignedTo || ''
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
      assignedTo: ''
    });
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

        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            Create New Service Request
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Customer *</label>
              <select
                name="customerId"
                value={formData.customerId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.email}
                  </option>
                ))}
              </select>
            </div>
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
            <div className="form-group">
              <label>Assigned To</label>
              <input
                type="text"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleInputChange}
              />
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
              <th>Assigned To</th>
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
                <td>{request.assignedTo || 'Unassigned'}</td>
                <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                <td>
                  {(user?.role === 'ROLE_ADMIN' || request.createdByUserId === user?.id) && (
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
                  {user?.role !== 'ROLE_ADMIN' && request.createdByUserId !== user?.id && (
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
