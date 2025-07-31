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

      if (response.data && response.data.Usuario) {
        const userData = response.data.Usuario;
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
          // Intentamos verificar si el usuario guardado es válido
          try {
            const currentUser = await usuarioService.getCurrentUser();
            if (currentUser.data) {
              setUser(currentUser.data);
              setIsAuthenticated(true);
            } else {
              // Si no obtenemos datos válidos, limpiamos el localStorage
              localStorage.removeItem('user');
            }
          } catch (error) {
            console.error('Error al verificar usuario actual:', error);
            // En caso de error, asumimos que la sesión expiró
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Error al cargar datos de autenticación:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Valores que se proveerán a través del contexto
  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout
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
