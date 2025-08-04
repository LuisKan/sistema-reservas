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
  // Desactivamos withCredentials ya que el servidor no está configurado para CORS con credenciales
  withCredentials: false,
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
    
    // Agregar token de autorización si existe
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Token agregado a la petición');
    } else {
      console.log('[API] No se encontró token en localStorage');
    }
    
    // Log de los datos enviados en peticiones POST y PUT
    if (config.method === 'post' || config.method === 'put') {
      console.log('[API] Request data:', JSON.stringify(config.data, null, 2));
    }
    
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
    
    // Manejar errores de autenticación
    if (error.response?.status === 401) {
      console.warn('[API] Error de autenticación (401) - Token inválido o expirado');
      // Limpiar datos de autenticación
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirigir al login si no estamos ya ahí
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    // Manejar diferentes tipos de errores
    else if (error.response?.status === 404) {
      console.warn('[API] Endpoint not found - Check if your Visual Studio API is running');
    } 
    else if (error.response?.status === 500) {
      console.error('[API] Error interno del servidor (500):', error.response?.data);
      console.log('[API] Datos enviados que causaron el error:', error.config?.data);
      
      // Si tenemos un objeto de error JSON, mostrarlo
      try {
        const sentData = JSON.parse(error.config?.data || '{}');
        console.log('[API] Datos enviados (objeto):', sentData);
      } catch (e) {
        // No hacer nada si no es un JSON válido
      }
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
  getAll: () => api.get('/Usuarios').then(response => {
    console.log('[API] Respuesta completa de getAll usuarios:', response);
    return response;
  }),
  
  getById: (id) => api.get(`/Usuarios/${id}`).then(response => {
    console.log(`[API] Datos del usuario ${id}:`, response.data);
    return response;
  }),
  
  create: (usuario) => {
    // Asegurarnos que el objeto de usuario tiene todos los campos necesarios
    const normalizedUser = {
      Nombre: usuario.Nombre || '',
      Apellido: usuario.Apellido || '',
      Correo: usuario.Correo || '',  // Asegurar que siempre usamos la misma propiedad para correo
      Contraseña: usuario.Contraseña || '',
      Rol: usuario.Rol || 'usuario'
    };
    
    console.log('[API] Creando usuario con datos normalizados:', normalizedUser);
    return api.post('/Usuarios', normalizedUser);
  },
  
  update: (id, usuario) => {
    // Asegurarnos de que el ID_Usuario se incluye en la URL y NO en el cuerpo
    const userDataToSend = { 
      ...usuario,
      // Asegurar que el correo siempre esté presente con el nombre correcto de propiedad
      Correo: usuario.Correo || usuario.correo || usuario.Email || usuario.email || ''
    };
    delete userDataToSend.ID_Usuario; // Eliminamos el ID del cuerpo ya que va en la URL
    
    console.log(`[API] Actualizando usuario ${id} con datos:`, JSON.stringify(userDataToSend, null, 2));
    return api.put(`/Usuarios/${id}`, userDataToSend);
  },
  
  delete: (id) => api.delete(`/Usuarios/${id}`),
  
  // Métodos de autenticación
  login: (credentials) => {
    // Asegurar formato correcto para credenciales
    const normalizedCredentials = {
      Correo: credentials.Correo || credentials.correo || credentials.email || '',
      Contraseña: credentials.Contraseña || credentials.contraseña || credentials.password || ''
    };
    
    console.log('[API] Login con credenciales normalizadas:', normalizedCredentials);
    return api.post('/Usuarios/login', normalizedCredentials);
  },
  
  register: (userData) => {
    // Normalizar datos de registro
    const normalizedUser = {
      Nombre: userData.Nombre || '',
      Apellido: userData.Apellido || '',
      Correo: userData.Correo || '',
      Contraseña: userData.Contraseña || '',
      Rol: userData.Rol || 'usuario'
    };
    
    console.log('[API] Registrando usuario con datos normalizados:', normalizedUser);
    return api.post('/Usuarios', normalizedUser);
  },
  
  getCurrentUser: () => api.get('/Usuarios/actual'),
};

// Servicios para Espacios
export const espacioService = {
  getAll: () => api.get('/Espacios'),
  getById: (id) => api.get(`/Espacios/${id}`),
  create: (espacio) => {
    const normalizedEspacio = utils.normalizarEspacio(espacio);
    console.log('[API] Creando espacio con datos normalizados:', JSON.stringify(normalizedEspacio, null, 2));
    return api.post('/Espacios', normalizedEspacio);
  },
  update: (id, espacio) => {
    const normalizedEspacio = utils.normalizarEspacio(espacio);
    console.log(`[API] Actualizando espacio ${id} con datos normalizados:`, JSON.stringify(normalizedEspacio, null, 2));
    return api.put(`/Espacios/${id}`, normalizedEspacio);
  },
  delete: (id) => api.delete(`/Espacios/${id}`),
};

// Funciones de utilidad para normalización de datos
const utils = {
  // Formatear fecha en el formato exacto que espera el backend
  formatearFecha: (fechaStr) => {
    if (!fechaStr) return '';
    try {
      // Para simplificar y evitar problemas con T y Z, 
      // usamos el formato exacto que mostró el backend en los logs: "2025-09-10"
      if (fechaStr.includes('T')) {
        // Extraer solo la parte YYYY-MM-DD
        return fechaStr.split('T')[0];
      } else {
        // Ya está en formato correcto
        return fechaStr;
      }
    } catch (e) {
      console.error('[API] Error al formatear fecha:', e);
      return fechaStr;
    }
  },
  
  // Formatear la hora en formato exacto que necesita el backend: "10:00:00"
  formatearHora: (horaStr) => {
    if (!horaStr) return '';
    
    // Si ya tiene formato HH:MM:SS, dejarlo así
    if (horaStr.split(':').length === 3) return horaStr;
    
    // Si solo tiene horas y minutos, añadir segundos
    return `${horaStr}:00`;
  },
  
  // Normalizar una reserva EXACTAMENTE como la espera el backend según los logs
  normalizarReserva: (reserva, usuario = null) => {
    console.log('[API] normalizarReserva - Datos de entrada:', { reserva, usuario });
    console.log('[API] Usuario completo recibido:', JSON.stringify(usuario, null, 2));
    
    // IMPORTANTE: Mantener el formato exacto de FechaCreacion como lo muestra el backend
    // En los logs se ve que es: "2025-07-29T19:27:31.573"
    const fechaCreacion = reserva.FechaCreacion || new Date().toISOString();
    
    // Intentar recuperar el usuario del localStorage como última opción
    let userFromStorage = null;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        userFromStorage = JSON.parse(userStr);
        console.log('[API] Usuario recuperado de localStorage:', JSON.stringify(userFromStorage, null, 2));
      }
    } catch (e) {
      console.error('[API] Error al recuperar usuario de localStorage:', e);
    }
    
    // Determinar el ID del usuario de manera más inteligente
    let idUsuario;
    let nombreUsuario;
    
    // Priorizar el usuario pasado como parámetro
    if (usuario && (usuario.ID_Usuario || usuario.id || usuario.Id)) {
      idUsuario = usuario.ID_Usuario || usuario.id || usuario.Id;
      nombreUsuario = usuario.Nombre || usuario.NombreUsuario;
      console.log('[API] ===== USANDO USUARIO DEL PARÁMETRO =====');
      console.log('[API] idUsuario:', idUsuario);
      console.log('[API] nombreUsuario:', nombreUsuario);
      console.log('[API] usuario completo:', JSON.stringify(usuario, null, 2));
      console.log('[API] =====================================');
    }
    // Si no hay usuario en parámetro, intentar con el de localStorage
    else if (userFromStorage && (userFromStorage.ID_Usuario || userFromStorage.id || userFromStorage.Id)) {
      idUsuario = userFromStorage.ID_Usuario || userFromStorage.id || userFromStorage.Id;
      nombreUsuario = userFromStorage.Nombre || userFromStorage.NombreUsuario;
      console.log('[API] ===== USANDO USUARIO DE LOCALSTORAGE =====');
      console.log('[API] idUsuario:', idUsuario);
      console.log('[API] nombreUsuario:', nombreUsuario);
      console.log('[API] userFromStorage completo:', JSON.stringify(userFromStorage, null, 2));
      console.log('[API] ========================================');
    }
    // Si la reserva ya tiene información del usuario, usarla
    else if (reserva.ID_Usuario) {
      idUsuario = reserva.ID_Usuario;
      nombreUsuario = reserva.NombreUsuario;
      console.log('[API] ===== USANDO USUARIO DE LA RESERVA =====');
      console.log('[API] idUsuario:', idUsuario);
      console.log('[API] nombreUsuario:', nombreUsuario);
      console.log('[API] ===================================');
    }
    // Como último recurso, usar valores por defecto
    else {
      console.warn('[API] ===== NO SE PUDO DETERMINAR USUARIO - USANDO DEFECTO =====');
      idUsuario = 1; // ID por defecto
      nombreUsuario = "Usuario Desconocido";
      console.log('[API] idUsuario por defecto:', idUsuario);
      console.log('[API] nombreUsuario por defecto:', nombreUsuario);
      console.log('[API] ========================================================');
    }
    
    console.log('[API] Usuario final determinado:', { idUsuario, nombreUsuario });
    
    console.log('[API] normalizarReserva - Datos del usuario extraídos:', { 
      idUsuario, 
      nombreUsuario,
      usuarioOriginal: usuario,
      'usuario?.ID_Usuario': usuario?.ID_Usuario,
      'usuario?.id': usuario?.id,
      'usuario?.Nombre': usuario?.Nombre,
      'reserva?.NombreUsuario': reserva?.NombreUsuario
    });
    
    // Normalizar los datos exactamente como los espera la API
    const normalizedReserva = {
      "ID_Usuario": parseInt(idUsuario) || 1,
      "ID_Espacio": parseInt(reserva.ID_Espacio) || 0,
      "Fecha": utils.formatearFecha(reserva.Fecha),
      "HoraInicio": utils.formatearHora(reserva.HoraInicio),
      "HoraFin": utils.formatearHora(reserva.HoraFin),
      "Estado": reserva.Estado || "Pendiente",
      "NombreUsuario": nombreUsuario || "Usuario Desconocido",
      "NombreEspacio": reserva.NombreEspacio || "",
      "FechaCreacion": fechaCreacion
    };
    
    console.log('[API] normalizarReserva - Estructura normalizada final:', JSON.stringify(normalizedReserva, null, 2));
    
    return normalizedReserva;
  },
  
  // Normalizar un espacio como lo espera el backend
  normalizarEspacio: (espacio) => {
    // Generar fecha de creación actual si no existe
    const fechaCreacion = espacio.FechaCreacion || new Date().toISOString();
    
    // Basado en el log de error, necesitamos asegurar que los campos tienen el formato correcto
    const normalizedEspacio = {
      "Nombre": espacio.Nombre || "",
      "Tipo": espacio.Tipo || "",
      "Ubicacion": espacio.Ubicacion || "",
      "Capacidad": parseInt(espacio.Capacidad) || 0,
      "FechaCreacion": fechaCreacion
    };
    
    console.log('[API] Espacio normalizado:', JSON.stringify(normalizedEspacio));
    
    return normalizedEspacio;
  }
};

// Servicios para Reservas
export const reservaService = {
  getAll: () => api.get('/Reservas'),
  getById: (id) => api.get(`/Reservas/${id}`),
  getByUsuario: (userId) => {
    console.log(`[API] Obteniendo reservas para usuario ID: ${userId}`);
    return api.get(`/Reservas/usuario/${userId}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
  },
  create: (reserva, usuario = null) => {
    console.log('[API] create - Datos recibidos:', { 
      reserva: JSON.stringify(reserva), 
      usuario: usuario ? JSON.stringify(usuario) : 'null',
      'typeof usuario': typeof usuario,
      'usuario instanceof Object': usuario instanceof Object
    });
    
    // Fix usuario si es un objeto vacío o null
    if (!usuario || typeof usuario !== 'object' || Object.keys(usuario).length === 0) {
      console.log('[API] Usuario inválido, intentando obtenerlo de localStorage');
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          usuario = JSON.parse(userStr);
          console.log('[API] Usuario recuperado de localStorage:', usuario);
        }
      } catch (e) {
        console.error('[API] Error al recuperar usuario de localStorage:', e);
      }
    }
    
    // Si aún así usuario es inválido, usar ID directamente de reserva
    if (!usuario && reserva.ID_Usuario) {
      usuario = { ID_Usuario: parseInt(reserva.ID_Usuario) };
      console.log('[API] Creando objeto usuario básico con ID:', usuario);
    }
    
    console.log('[API] Usuario final que se usará:', JSON.stringify(usuario, null, 2));
    
    const normalizedReserva = utils.normalizarReserva(reserva, usuario);
    console.log('[API] Creando reserva con datos normalizados:', JSON.stringify(normalizedReserva, null, 2));
    
    // Log de verificación final
    console.log('[API] DATOS FINALES ENVIADOS:', JSON.stringify(normalizedReserva, null, 2));
    
    return api.post('/Reservas', normalizedReserva);
  },
  update: (id, reserva, usuario = null) => {
    console.log('[API] update - Datos recibidos:', { 
      reserva: JSON.stringify(reserva), 
      usuario: usuario ? JSON.stringify(usuario) : 'null'
    });
    
    // Fix usuario si es un objeto vacío o null
    if (!usuario || typeof usuario !== 'object' || Object.keys(usuario).length === 0) {
      console.log('[API] Usuario inválido, intentando obtenerlo de localStorage');
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          usuario = JSON.parse(userStr);
          console.log('[API] Usuario recuperado de localStorage:', usuario);
        }
      } catch (e) {
        console.error('[API] Error al recuperar usuario de localStorage:', e);
      }
    }
    
    // Si aún así usuario es inválido, usar ID directamente de reserva
    if (!usuario && reserva.ID_Usuario) {
      usuario = { ID_Usuario: parseInt(reserva.ID_Usuario) };
      console.log('[API] Creando objeto usuario básico con ID:', usuario);
    }
    
    console.log('[API] Usuario final que se usará para update:', JSON.stringify(usuario, null, 2));
    
    const normalizedReserva = utils.normalizarReserva(reserva, usuario);
    console.log(`[API] Actualizando reserva ${id} con datos normalizados:`, JSON.stringify(normalizedReserva, null, 2));
    
    // Log de verificación final
    console.log('[API] DATOS FINALES ENVIADOS PARA UPDATE:', JSON.stringify(normalizedReserva, null, 2));
    
    return api.put(`/Reservas/${id}`, normalizedReserva);
  },
  delete: (id) => api.delete(`/Reservas/${id}`),
  
  // Métodos para consultar historial (solo para admin)
  getHistorialPorUsuario: (idUsuario) => {
    console.log(`[API] Consultando historial de reservas para usuario ${idUsuario}`);
    return api.get(`/reservas/historial/usuario/${idUsuario}`);
  },
  
  getHistorialPorEspacio: (idEspacio) => {
    console.log(`[API] Consultando historial de reservas para espacio ${idEspacio}`);
    return api.get(`/reservas/historial/espacio/${idEspacio}`);
  },

  // Método para verificar disponibilidad de espacio
  verificarDisponibilidad: (espacioId, fecha, horaInicio, horaFin) => {
    console.log(`[API] Verificando disponibilidad del espacio ${espacioId} para ${fecha} de ${horaInicio} a ${horaFin}`);
    
    const params = {
      espacioId,
      fecha,
      horaInicio,
      horaFin
    };
    
    console.log('[API] Parámetros exactos:', params);
    
    // Construir URL manualmente para evitar problemas de encoding
    const queryString = `espacioId=${espacioId}&fecha=${fecha}&horaInicio=${horaInicio}&horaFin=${horaFin}`;
    const fullUrl = `${API_BASE_URL}/reservas/disponibilidad?${queryString}`;
    console.log('[API] URL completa que se va a llamar:', fullUrl);
    
    // Usar axios directamente con la URL completa para evitar encoding automático
    return axios.get(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(localStorage.getItem('token') && {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        })
      },
      timeout: 10000,
      withCredentials: false
    });
  },
};

// Export por defecto con todos los servicios organizados
const apiServices = {
  // API básica
  ...api,
  
  // Servicios organizados
  roles: rolService,
  usuarios: usuarioService,
  espacios: espacioService,
  reservas: reservaService
};

export default apiServices;
