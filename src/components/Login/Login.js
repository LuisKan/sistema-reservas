import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { rolService } from '../../services/api';
import './Login.css';

const Login = () => {
  // Estado para controlar si mostrar el formulario de login o registro
  const [isLoginForm, setIsLoginForm] = useState(true);
  
  // Estados para el formulario de login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados adicionales para el formulario de registro
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rol, setRol] = useState('');
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();
  
  // Cargar roles desde la API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true);
        console.log('Intentando cargar roles desde la API...');
        
        const response = await rolService.getAll();
        console.log('Respuesta completa de roles:', response);
        console.log('Roles obtenidos:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          if (response.data.length > 0) {
            console.log('Primer rol (ejemplo):', JSON.stringify(response.data[0]));
            setRoles(response.data);
            
            // Intentar determinar la estructura del objeto de rol
            const firstRole = response.data[0];
            const roleKeys = Object.keys(firstRole);
            console.log('Campos disponibles en el objeto rol:', roleKeys);
            
            // Buscar el campo de nombre del rol
            const nombreCampo = roleKeys.find(key => 
              ['Nombre', 'nombre', 'Name', 'name'].includes(key)
            );
            
            if (nombreCampo) {
              console.log(`Campo para el nombre del rol encontrado: ${nombreCampo}`);
              setRol(firstRole[nombreCampo]);
            } else {
              console.log('No se pudo determinar el campo para el nombre del rol');
              // Usar un valor por defecto
              setRol('usuario');
            }
          } else {
            console.log('No hay roles disponibles en la respuesta');
            setRol('usuario');
          }
        } else {
          console.log('La respuesta no contiene un array de roles:', response.data);
          setRol('usuario');
        }
      } catch (error) {
        console.error('Error al cargar roles:', error);
        console.error('Detalles del error:', {
          message: error.message,
          response: error.response?.data
        });
        setError('No se pudieron cargar los roles. Por favor, inténtelo más tarde.');
        // Establecer roles predeterminados para que el usuario pueda continuar
        setRol('usuario');
      } finally {
        setLoadingRoles(false);
      }
    };

    if (!isLoginForm) {
      fetchRoles();
    }
  }, [isLoginForm]);

  // Manejar el envío del formulario de login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/'); // Redirigir al dashboard después del inicio de sesión exitoso
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Error en el inicio de sesión. Inténtelo de nuevo.');
      console.error('Error de login:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manejar el envío del formulario de registro
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);
    
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setIsLoading(false);
      return;
    }
    
    try {
      // Construimos el objeto de usuario con exactamente la misma estructura que funciona en Postman
      const userData = {
        "Nombre": nombre,
        "Apellido": apellido,
        "Correo": email,
        "Contraseña": password,
        "Rol": rol
      };
      
      console.log('Enviando datos de registro:', userData);
      const result = await register(userData);
      
      if (result.success) {
        // Mostrar mensaje de éxito y volver al formulario de login
        setSuccessMsg('Registro exitoso. Ahora puede iniciar sesión.');
        setIsLoginForm(true);
        
        // Limpiar campos de registro
        setNombre('');
        setApellido('');
        setEmail(''); // También limpiamos el email
        setPassword('');
        setConfirmPassword('');
        
        console.log('Usuario registrado correctamente:', result);
      } else {
        setError(result.message);
        console.error('Error en el registro:', result);
      }
    } catch (error) {
      console.error('Error de registro:', error);
      console.log('Error completo:', {
        message: error.message,
        response: error.response,
        data: error.response?.data
      });
      
      // Intentar extraer un mensaje de error más específico
      if (error.response) {
        const errorData = error.response.data;
        if (typeof errorData === 'string') {
          setError(errorData);
        } else if (errorData?.message) {
          setError(errorData.message);
        } else if (errorData?.error) {
          setError(errorData.error);
        } else if (errorData?.title) {
          // Para errores de ASP.NET Core
          setError(errorData.title);
        } else if (errorData?.errors) {
          // Para validaciones de ASP.NET Core
          const errorMessages = [];
          for (const field in errorData.errors) {
            errorMessages.push(`${field}: ${errorData.errors[field].join(', ')}`);
          }
          setError(`Errores de validación: ${errorMessages.join('; ')}`);
        } else {
          setError(`Error en el registro (${error.response.status}). Inténtelo de nuevo.`);
        }
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Error en el registro. Inténtelo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle entre formularios
  const toggleForm = () => {
    setIsLoginForm(!isLoginForm);
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="login-container">
      <div className="login-form-container">
        <h2>{isLoginForm ? 'Iniciar Sesión' : 'Registrarse'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        {successMsg && <div className="success-message">{successMsg}</div>}
        
        {isLoginForm ? (
          // Formulario de Inicio de Sesión
          <form onSubmit={handleLoginSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ejemplo@correo.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Contraseña"
              />
            </div>

            <button 
              type="submit" 
              className="login-button" 
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
            
            <div className="form-footer">
              <p>¿No tienes una cuenta? <button type="button" className="toggle-form-btn" onClick={toggleForm}>Regístrate aquí</button></p>
            </div>
          </form>
        ) : (
          // Formulario de Registro
          <form onSubmit={handleRegisterSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="nombre">Nombre</label>
              <input
                type="text"
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                placeholder="Ingrese su nombre"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="apellido">Apellido</label>
              <input
                type="text"
                id="apellido"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                required
                placeholder="Ingrese su apellido"
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-email">Correo Electrónico</label>
              <input
                type="email"
                id="register-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ejemplo@correo.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-password">Contraseña</label>
              <input
                type="password"
                id="register-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Contraseña"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirm-password">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirme su contraseña"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="rol">Rol</label>
              <select
                id="rol"
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                required
                disabled={loadingRoles || roles.length === 0}
              >
                {loadingRoles ? (
                  <option value="">Cargando roles...</option>
                ) : roles.length > 0 ? (
                  roles.map((rolItem) => {
                    // Determinamos dinámicamente qué campos utilizar
                    const id = rolItem.id || rolItem.Id || rolItem.ID;
                    const nombre = rolItem.nombre || rolItem.Nombre || rolItem.name || rolItem.Name;
                    
                    console.log(`Rol encontrado: ID=${id}, Nombre=${nombre}`);
                    
                    return (
                      <option key={id} value={nombre}>
                        {nombre}
                      </option>
                    );
                  })
                ) : (
                  <>
                    <option value="usuario">Usuario</option>
                    <option value="ayudante">Ayudante</option>
                    <option value="docente">Docente</option>
                    <option value="administrador">Administrador</option>
                  </>
                )}
              </select>
            </div>

            <button 
              type="submit" 
              className="register-button" 
              disabled={isLoading}
            >
              {isLoading ? 'Registrando...' : 'Registrarse'}
            </button>
            
            <div className="form-footer">
              <p>¿Ya tienes una cuenta? <button type="button" className="toggle-form-btn" onClick={toggleForm}>Inicia sesión aquí</button></p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
