// =====================================================
// API SERVICE - Centralized HTTP requests
// =====================================================

import axios from 'axios';

// FORZAMOS LA DIRECCIÓN CORRECTA (CON LA 'i' Y EL /api)
const API_URL = 'https://equipment-manager-cci3.onrender.com/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para añadir token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// =====================================================
// AUTH
// =====================================================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  verify: () => api.get('/auth/verify'),
  logout: () => api.post('/auth/logout')
};

// =====================================================
// USERS
// =====================================================
export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`)
};

// =====================================================
// BRANDS
// =====================================================
export const brandsAPI = {
  getAll: () => api.get('/brands'),
  getById: (id) => api.get(`/brands/${id}`),
  getModels: (id) => api.get(`/brands/${id}/models`),
  create: (data) => api.post('/brands', data),
  update: (id, data) => api.put(`/brands/${id}`, data),
  delete: (id) => api.delete(`/brands/${id}`)
};

// =====================================================
// MODELS
// =====================================================
export const modelsAPI = {
  getAll: () => api.get('/models'),
  search: (query) => api.get('/models/search', { params: { q: query } }),
  getById: (id) => api.get(`/models/${id}`),
  create: (data) => api.post('/models', data),
  update: (id, data) => api.put(`/models/${id}`, data),
  delete: (id) => api.delete(`/models/${id}`)
};

// =====================================================
// UPLOAD
// =====================================================
export const uploadAPI = {
  uploadImage: (formData) => api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  listImages: () => api.get('/upload'),
  deleteImage: (filename) => api.delete(`/upload/${filename}`)
};

export default api;
