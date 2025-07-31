import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

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
                <Link to="/usuarios" className={`navbar-link ${isActive('/usuarios')}`}>
                  Usuarios
                </Link>
              </li>
              <li className="navbar-item">
                <Link to="/roles" className={`navbar-link ${isActive('/roles')}`}>
                  Roles
                </Link>
              </li>
            </ul>
            
            <div className="user-section">
              <span className="user-info">
                {user?.Nombre} ({user?.Rol})
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
