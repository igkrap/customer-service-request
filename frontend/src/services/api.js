import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Customer API
export const customerAPI = {
  getAll: () => api.get('/customers'),
  getById: (id) => api.get(`/customers/${id}`),
  getByEmail: (email) => api.get(`/customers/email/${email}`),
  create: (customer) => api.post('/customers', customer),
  update: (id, customer) => api.put(`/customers/${id}`, customer),
  delete: (id) => api.delete(`/customers/${id}`),
};

// Service Request API
export const serviceRequestAPI = {
  getAll: () => api.get('/service-requests'),
  getById: (id) => api.get(`/service-requests/${id}`),
  getByCustomerId: (customerId) => api.get(`/service-requests/customer/${customerId}`),
  getByStatus: (status) => api.get(`/service-requests/status/${status}`),
  getByPriority: (priority) => api.get(`/service-requests/priority/${priority}`),
  create: (request) => api.post('/service-requests', request),
  update: (id, request) => api.put(`/service-requests/${id}`, request),
  delete: (id) => api.delete(`/service-requests/${id}`),
};

export default api;
