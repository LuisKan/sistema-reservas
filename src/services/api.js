import axios from 'axios';

// Usar ruta directa al backend hasta resolver el proxy
const API_BASE_URL = 'https://localhost:44319/api';

// Configuración de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para peticiones
api.interceptors.request.use(
  (config) => {
    console.log(`[API] Making request:`, {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL || ''}${config.url || ''}`
    });
    return config;
  },
  (error) => {
    console.error('[API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para respuestas
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response received:`, {
      status: response.status,
      url: response.config.url,
      fullURL: `${response.config.baseURL || ''}${response.config.url || ''}`
    });
    return response;
  },
  (error) => {
    console.error('[API] Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config ? `${error.config.baseURL || ''}${error.config.url || ''}` : 'unknown',
      data: error.response?.data
    });
    if (error.response?.status === 404) {
      console.warn('[API] Endpoint not found - Check if your Visual Studio API is running');
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('[API] Connection refused - Make sure your Visual Studio backend is running on https://localhost:44319');
    }
    return Promise.reject(error);
  }
);

// Servicios para Roles
export const rolService = {
  getAll: () => api.get('/Rols'),
  getById: (id) => api.get(`/Rols/${id}`),
  create: (rol) => api.post('/Rols', rol),
  update: (id, rol) => api.put(`/Rols/${id}`, rol),
  delete: (id) => api.delete(`/Rols/${id}`),
};

// Servicios para Usuarios
export const usuarioService = {
  getAll: () => api.get('/Usuarios'),
  getById: (id) => api.get(`/Usuarios/${id}`),
  create: (usuario) => api.post('/Usuarios', usuario),
  update: (id, usuario) => {
    // Asegurarnos de que el ID_Usuario se incluye en la URL y NO en el cuerpo
    const userDataToSend = { ...usuario };
    delete userDataToSend.ID_Usuario; // Eliminamos el ID del cuerpo ya que va en la URL
    
    console.log(`Actualizando usuario ${id} con datos:`, JSON.stringify(userDataToSend, null, 2));
    return api.put(`/Usuarios/${id}`, userDataToSend);
  },
  delete: (id) => api.delete(`/Usuarios/${id}`),
};

// Servicios para Espacios
export const espacioService = {
  getAll: () => api.get('/Espacios'),
  getById: (id) => api.get(`/Espacios/${id}`),
  create: (espacio) => api.post('/Espacios', espacio),
  update: (id, espacio) => api.put(`/Espacios/${id}`, espacio),
  delete: (id) => api.delete(`/Espacios/${id}`),
};

// Servicios para Reservas
export const reservaService = {
  getAll: () => api.get('/Reservas'),
  getById: (id) => api.get(`/Reservas/${id}`),
  create: (reserva) => api.post('/Reservas', reserva),
  update: (id, reserva) => api.put(`/Reservas/${id}`, reserva),
  delete: (id) => api.delete(`/Reservas/${id}`),
};

export default api;
