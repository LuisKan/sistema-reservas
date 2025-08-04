import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout, setUser } = useAuth();
  const [userInfo, setUserInfo] = useState(user);
  
  // Mantenerse sincronizado con localStorage para reflejar cambios inmediatos
  useEffect(() => {
    // Función para verificar cambios en localStorage
    const checkUserChanges = () => {
      try {
        const localStorageUser = JSON.parse(localStorage.getItem('user') || '{}');
        
        // Si el usuario actual tiene información diferente al localStorage, actualizar
        if (user && localStorageUser && 
            (user.Rol !== localStorageUser.Rol || 
             user.Nombre !== localStorageUser.Nombre)) {
          console.log('[Navbar] Detectado cambio en datos de usuario, actualizando desde localStorage');
          setUser(localStorageUser);
        }
        
        setUserInfo(localStorageUser);
      } catch (error) {
        console.error('[Navbar] Error al procesar datos de usuario:', error);
      }
    };
    
    // Verificar cambios al montar el componente
    checkUserChanges();
    
    // Configurar un intervalo para verificar cambios periódicamente
    const interval = setInterval(checkUserChanges, 2000);
    
    return () => clearInterval(interval);
  }, [user, setUser]);

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          Sistema de Reservas
        </Link>
        
        {isAuthenticated ? (
          <>
            <ul className="navbar-menu">
              <li className="navbar-item">
                <Link to="/" className={`navbar-link ${isActive('/')}`}>
                  Dashboard
                </Link>
              </li>
              <li className="navbar-item">
                <Link to="/reservas" className={`navbar-link ${isActive('/reservas')}`}>
                  Reservas
                </Link>
              </li>
              <li className="navbar-item">
                <Link to="/espacios" className={`navbar-link ${isActive('/espacios')}`}>
                  Espacios
                </Link>
              </li>
              <li className="navbar-item">
                <Link to="/disponibilidad" className={`navbar-link ${isActive('/disponibilidad')}`}>
                  Disponibilidad
                </Link>
              </li>
              <li className="navbar-item">
                <Link to="/usuarios" className={`navbar-link ${isActive('/usuarios')}`}>
                  Usuarios
                </Link>
              </li>
              <li className="navbar-item">
                <Link to="/roles" className={`navbar-link ${isActive('/roles')}`}>
                  Roles
                </Link>
              </li>
              {(userInfo?.Rol === 'Admin' || userInfo?.Rol === 'Administrador') && (
                <li className="navbar-item">
                  <Link to="/historial-reservas" className={`navbar-link ${isActive('/historial-reservas')}`}>
                    Historial
                  </Link>
                </li>
              )}
            </ul>
            
            <div className="user-section">
              <span className="user-info">
                {userInfo?.Nombre} ({userInfo?.Rol || 'Usuario'})
              </span>
              <button className="logout-button" onClick={logout}>
                Cerrar Sesión
              </button>
            </div>
          </>
        ) : (
          <div className="navbar-menu">
            <li className="navbar-item">
              <Link to="/login" className={`navbar-link ${isActive('/login')}`}>
                Iniciar Sesión
              </Link>
            </li>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
