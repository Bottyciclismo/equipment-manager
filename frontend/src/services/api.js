import axios from 'axios';

const API_URL = 'https://equipment-manager-botty.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  verify: () => api.get('/auth/verify')
};

export const modelsAPI = {
  getAll: () => api.get('/models'),
  update: (id, data) => api.put(`/models/${id}`, data),
  delete: (id) => api.delete(`/models/${id}`)
};

// ⚠️ IMPORTANTE: Esto arregla el SyntaxError de AdminPanel.jsx
export const brandsAPI = {
  getAll: () => api.get('/brands'),
  create: (data) => api.post('/brands', data),
  delete: (id) => api.delete(`/brands/${id}`)
};

export default api;