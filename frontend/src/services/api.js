import axios from 'axios';

const API_URL = 'https://equipment-manager-cci3.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor para el Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- AUTENTICACIÓN (Esta es la parte que fallaba) ---
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  verify: () => api.get('/auth/verify'),
  logout: () => api.post('/auth/logout')
};

// --- USUARIOS ---
export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  delete: (id) => api.delete(`/users/${id}`)
};

// --- MARCAS ---
export const brandsAPI = {
  getAll: () => api.get('/brands'),
  create: (data) => api.post('/brands', data),
  delete: (id) => api.delete(`/brands/${id}`),
  getModels: (id) => api.get(`/brands/${id}/models`)
};

// --- MODELOS ---
export const modelsAPI = {
  getAll: () => api.get('/models'),
  create: (data) => api.post('/models', data),
  delete: (id) => api.delete(`/models/${id}`),
  search: (query) => api.get('/models/search', { params: { q: query } })
};

export default api;
