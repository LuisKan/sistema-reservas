import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Si está cargando, mostrar indicador de carga o nada
  if (isLoading) {
    return <div className="loading">Cargando...</div>;
  }

  // Si no está autenticado, redirigir a la página de login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, renderizar los componentes hijos
  return <Outlet />;
};

export default ProtectedRoute;
