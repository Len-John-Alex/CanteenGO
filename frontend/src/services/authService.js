import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const BASE_URL = API_URL.replace(/\/api$/, '');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  registerStudent: async (studentId, name, email, password) => {
    const response = await api.post('/auth/register/student', {
      studentId,
      name,
      email,
      password,
    });
    return response.data;
  },

  registerStaff: async (staffId, name, email, password) => {
    const response = await api.post('/auth/register/staff', {
      staffId,
      name,
      email,
      password,
    });
    return response.data;
  },

  verifyEmail: async (studentId, code) => {
    const response = await api.post('/auth/verify/student', {
      studentId,
      code
    });
    return response.data;
  },

  verifyStaffEmail: async (staffId, code) => {
    const response = await api.post('/auth/verify/staff', {
      staffId,
      code
    });
    return response.data;
  },

  loginStudent: async (studentId, password) => {
    const response = await api.post('/auth/login/student', {
      studentId,
      password,
    });
    return response.data;
  },

  loginStaff: async (staffId, password) => {
    const response = await api.post('/auth/login/staff', {
      staffId,
      password,
    });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data.user;
  },
};

export default api;
