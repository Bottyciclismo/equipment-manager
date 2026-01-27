import axios from 'axios';

// La dirección de tu servidor en Render
const API_URL = 'https://equipment-manager-cci3.onrender.com/api';

// Creamos la configuración base de Axios
const api = axios.create({
  baseURL: API_URL,
  headers: { 
    'Content-Type': 'application/json' 
  }
});

// --- SERVICIOS DE MARCAS ---
export const brandsAPI = {
  getAll: () => api.get('/brands'),
  create: (data) => api.post('/brands', data),
  delete: (id) => api.delete(`/brands/${id}`),
  getModels: (id) => api.get(`/brands/${id}/models`)
};

// --- SERVICIOS DE MODELOS ---
export const modelsAPI = {
  getAll: () => api.get('/models'),
  create: (data) => api.post('/models', data),
  delete: (id) => api.delete(`/models/${id}`),
  // Esta es la ruta para la lupa del buscador principal
  search: (query) => api.get('/models/search', { params: { q: query } })
};

// Exportamos la instancia por defecto para otros usos
export default api;
