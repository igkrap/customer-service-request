import React, { useState, useEffect } from 'react';
import { customerAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

function CustomerList() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    company: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerAPI.getAll();
      setCustomers(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch customers: ' + err.message);
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
      if (editingCustomer) {
        await customerAPI.update(editingCustomer.id, formData);
      } else {
        await customerAPI.create(formData);
      }
      setFormData({ name: '', email: '', phoneNumber: '', company: '' });
      setShowForm(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) {
      setError('Failed to save customer: ' + err.message);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phoneNumber: customer.phoneNumber || '',
      company: customer.company
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerAPI.delete(id);
        fetchCustomers();
      } catch (err) {
        setError('Failed to delete customer: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phoneNumber: '', company: '' });
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container">
      <div className="card">
        <h2>Customer Management</h2>
        {error && <div className="error">{error}</div>}

        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            Add New Customer
          </button>
        )}

        {showForm && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
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
              <label>Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Company *</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="btn-group">
              <button type="submit" className="btn btn-success">
                {editingCustomer ? 'Update' : 'Create'} Customer
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
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Company</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id}>
                <td>{customer.id}</td>
                <td>{customer.name}</td>
                <td>{customer.email}</td>
                <td>{customer.phoneNumber || 'N/A'}</td>
                <td>{customer.company}</td>
                <td>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleEdit(customer)}
                  >
                    Edit
                  </button>
                  {user?.role === 'ROLE_ADMIN' && (
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(customer.id)}
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

export default CustomerList;
