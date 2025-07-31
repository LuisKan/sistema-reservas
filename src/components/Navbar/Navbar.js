import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          Sistema de Reservas
        </Link>
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
      </div>
    </nav>
  );
};

export default Navbar;
