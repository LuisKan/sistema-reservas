import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usuarioService } from '../services/api';

// Crear el contexto
const AuthContext = createContext();

// Crear el provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Función para iniciar sesión
  const login = async (email, password) => {
    try {
      const response = await usuarioService.login({
        Correo: email,
        Contraseña: password
      });

      console.log('[Auth] Respuesta de login completa:', response);

      if (response.data && response.data.Usuario) {
        // Normalizar los datos del usuario para garantizar consistencia
        const userData = {
          ...response.data.Usuario,
          // Asegurar que los campos importantes están siempre presentes
          // Incluir todas las variaciones posibles del ID
          ID_Usuario: response.data.Usuario.ID_Usuario || response.data.Usuario.id || response.data.Usuario.Id || 0,
          id: response.data.Usuario.id || response.data.Usuario.ID_Usuario || response.data.Usuario.Id || 0,
          Id: response.data.Usuario.Id || response.data.Usuario.ID_Usuario || response.data.Usuario.id || 0,
          Nombre: response.data.Usuario.Nombre || '',
          Apellido: response.data.Usuario.Apellido || '',
          // Asegurar que el correo siempre está presente con el nombre correcto
          Correo: response.data.Usuario.Correo || response.data.Usuario.correo || 
                 response.data.Usuario.Email || response.data.Usuario.email || email,
          Rol: response.data.Usuario.Rol || ''
        };
        
        console.log('[Auth] Datos de usuario normalizados para localStorage:', userData);
        
        // Guardar datos del usuario en localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true, message: response.data.Mensaje };
      } else {
        return { success: false, message: 'Respuesta inválida del servidor' };
      }
    } catch (error) {
      console.error('Error de inicio de sesión:', error);
      return { 
        success: false, 
        message: error.response?.data?.Mensaje || 'Error en el inicio de sesión' 
      };
    }
  };
  
  // Función para registrar usuario
  const register = async (userData) => {
    try {
      // Enviamos los datos de registro con el formato exacto de Postman
      const response = await usuarioService.register(userData);
      
      console.log('Respuesta del registro:', response);
      
      // Verificamos si la respuesta indica éxito
      if (response.status === 201 || response.status === 200) {
        return { 
          success: true, 
          message: 'Usuario registrado con éxito, ahora puede iniciar sesión',
          data: response.data
        };
      } else {
        return { 
          success: false, 
          message: 'Respuesta inesperada del servidor'
        };
      }
    } catch (error) {
      console.error('Error de registro:', error);
      let errorMessage = 'Error en el registro del usuario';
      
      if (error.response) {
        console.log('Detalles del error:', error.response);
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data && error.response.data.title) {
          errorMessage = error.response.data.title;
        }
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  // Comprobar si hay un usuario guardado en localStorage al cargar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        
        if (savedUser) {
          console.log('[Auth] Usuario encontrado en localStorage', savedUser);
          const parsedUser = JSON.parse(savedUser);
          
          // Normalizar el usuario del localStorage para asegurar consistencia
          const normalizedUser = {
            ...parsedUser,
            // Asegurar que los campos importantes están siempre presentes
            // Incluir todas las variaciones posibles del ID
            ID_Usuario: parsedUser.ID_Usuario || parsedUser.id || parsedUser.Id || 0,
            id: parsedUser.id || parsedUser.ID_Usuario || parsedUser.Id || 0,
            Id: parsedUser.Id || parsedUser.ID_Usuario || parsedUser.id || 0,
            Nombre: parsedUser.Nombre || '',
            Apellido: parsedUser.Apellido || '',
            // Asegurar que el correo siempre está presente con el nombre correcto
            Correo: parsedUser.Correo || parsedUser.correo || parsedUser.Email || parsedUser.email || '',
            Rol: parsedUser.Rol || ''
          };
          
          console.log('[Auth] Usuario normalizado del localStorage:', normalizedUser);
          
          // Intentamos verificar si el usuario guardado es válido
          try {
            console.log('[Auth] Verificando usuario actual en el servidor...');
            const currentUser = await usuarioService.getCurrentUser();
            console.log('[Auth] Respuesta del servidor:', currentUser);
            
            if (currentUser.data) {
              console.log('[Auth] Datos de usuario obtenidos del servidor:', currentUser.data);
              
              // Normalizar también los datos que vienen del servidor
              const serverUser = {
                ...currentUser.data,
                ID_Usuario: currentUser.data.ID_Usuario || currentUser.data.id || normalizedUser.ID_Usuario,
                id: currentUser.data.id || currentUser.data.ID_Usuario || normalizedUser.id,
                Correo: currentUser.data.Correo || currentUser.data.correo || 
                        currentUser.data.Email || currentUser.data.email || normalizedUser.Correo
              };
              
              console.log('[Auth] Usuario normalizado del servidor:', serverUser);
              
              // Actualizar también el localStorage con los datos más recientes
              localStorage.setItem('user', JSON.stringify(serverUser));
              
              setUser(serverUser);
              setIsAuthenticated(true);
            } else {
              // Si no hay datos de servidor, usamos los datos normalizados de localStorage
              console.log('[Auth] Sin datos del servidor, usando datos normalizados del localStorage');
              setUser(normalizedUser);
              setIsAuthenticated(true);
            }
          } catch (error) {
            console.error('[Auth] Error al verificar usuario actual:', error);
            // En caso de error, usamos los datos normalizados de localStorage
            console.log('[Auth] Usando datos normalizados del localStorage después del error');
            setUser(normalizedUser);
            setIsAuthenticated(true);
          }
        } else {
          console.log('[Auth] No se encontró usuario en localStorage');
        }
      } catch (error) {
        console.error('[Auth] Error al cargar datos de autenticación:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Valores que se proveerán a través del contexto
  const value = {
    user,
    setUser,  // Exponemos la función setUser para poder actualizar el usuario desde otros componentes
    isAuthenticated,
    isLoading,
    login,
    logout,
    register
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;
