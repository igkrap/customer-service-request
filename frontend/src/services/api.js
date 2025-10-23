import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (userData) => api.post('/auth/signup', userData),
};

// User API
export const userAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  getAllManagers: () => api.get('/users/managers'),
  getCustomersByManagerId: (managerId) => api.get(`/users/managers/${managerId}/customers`),
  assignManagers: (customerId, managerIds) => api.put(`/users/${customerId}/assign-managers`, { managerIds }),
  assignCustomersToManager: (managerId, customerIds) => api.put(`/users/managers/${managerId}/assign-customers`, { customerIds }),
  addManager: (customerId, managerId) => api.post(`/users/${customerId}/managers/${managerId}`),
  removeManager: (customerId, managerId) => api.delete(`/users/${customerId}/managers/${managerId}`),
  updateRole: (id, role) => api.put(`/users/${id}/role`, role),
  updateEmail: (id, email) => api.put(`/users/${id}/email`, email),
  updatePassword: (id, password) => api.put(`/users/${id}/password`, password),
  delete: (id) => api.delete(`/users/${id}`),
};

// Service Request API
export const serviceRequestAPI = {
  getAll: () => api.get('/service-requests'),
  getById: (id) => api.get(`/service-requests/${id}`),
  getByCustomerId: (customerId) => api.get(`/service-requests/customer/${customerId}`),
  getByManagerId: (managerId) => api.get(`/service-requests/manager/${managerId}`),
  getByStatus: (status) => api.get(`/service-requests/status/${status}`),
  getByPriority: (priority) => api.get(`/service-requests/priority/${priority}`),
  create: (request) => api.post('/service-requests', request),
  update: (id, request) => api.put(`/service-requests/${id}`, request),
  delete: (id) => api.delete(`/service-requests/${id}`),
};

export default api;
