import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservaService, espacioService, usuarioService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import RestrictedAccess from '../RestrictedAccess/RestrictedAccess';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalReservas: 0,
    reservasPendientes: 0,
    reservasAprobadas: 0,
    totalEspacios: 0,
    totalUsuarios: 0
  });
  const [recentReservas, setRecentReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Función para navegar a reservas con filtro
  const navigateToReservas = (filter = null) => {
    if (filter) {
      navigate(`/reservas?filter=${filter}`);
    } else {
      navigate('/reservas');
    }
  };

  // Función para navegar a espacios
  const navigateToEspacios = () => {
    navigate('/espacios');
  };

  // Función para navegar a usuarios
  const navigateToUsuarios = () => {
    navigate('/usuarios');
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Obtener datos de espacios y usuarios en paralelo
      const [espaciosRes, usuariosRes] = await Promise.all([
        espacioService.getAll(),
        usuarioService.getAll()
      ]);
      
      // Obtener todas las reservas
      const reservasRes = await reservaService.getAll();
      console.log("[Dashboard] Todas las reservas obtenidas:", reservasRes.data);
      
      // Para depuración: analizar estructura de datos
      if (Array.isArray(reservasRes.data) && reservasRes.data.length > 0) {
        console.log("[Dashboard] Primera reserva:", reservasRes.data[0]);
        console.log("[Dashboard] Campos disponibles:", Object.keys(reservasRes.data[0]));
      }
      
      // Crear una copia de las reservas para filtrar
      let reservas = [...reservasRes.data];
      
      // Filtrar si no es admin
      if (!isAdmin && user) {
        console.log("[Dashboard] Usuario no admin:", user);
        
        // Filtrar reservas por nombre de usuario
        reservas = reservas.filter(reserva => {
          // Comparar el NombreUsuario con el nombre del usuario actual
          const esReservaDelUsuario = reserva.NombreUsuario === user?.Nombre;
          
          console.log(`[Dashboard] Reserva ID:${reserva.ID_Reserva || reserva.id}, Usuario:${reserva.NombreUsuario}, Usuario actual:${user?.Nombre}, Coincide:${esReservaDelUsuario}`);
          
          return esReservaDelUsuario;
        });
        
        console.log(`[Dashboard] Total de reservas filtradas: ${reservas.length}`);
      } else {
        console.log("[Dashboard] Usuario admin, mostrando todas las reservas:", reservas.length);
      }
      const espacios = espaciosRes.data;
      const usuarios = usuariosRes.data;
      
      console.log("[Dashboard] Reservas a mostrar:", reservas);

      setStats({
        totalReservas: reservas.length,
        reservasPendientes: reservas.filter(r => r.Estado === 'Pendiente').length,
        reservasAprobadas: reservas.filter(r => r.Estado === 'Aprobada').length,
        totalEspacios: espacios.length,
        totalUsuarios: isAdmin ? usuarios.length : 1 // Si no es admin, solo ve su propio usuario
      });

      // Obtener las 5 reservas más recientes
      const sortedReservas = reservas
        .sort((a, b) => new Date(b.FechaCreacion) - new Date(a.FechaCreacion))
        .slice(0, 5);
      setRecentReservas(sortedReservas);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getStatusBadge = (estado) => {
    const statusClasses = {
      'Pendiente': 'status-pending',
      'Aprobada': 'status-approved',
      'Rechazada': 'status-rejected'
    };
    return `status-badge ${statusClasses[estado] || ''}`;
  };
  
  // Función para cambiar el estado de una reserva
  const handleStatusChange = async (id, newStatus) => {
    try {
      const reserva = recentReservas.find(r => (r.ID_Reserva || r.id) === id);
      if (!reserva) {
        throw new Error('Reserva no encontrada');
      }
      
      // Enviar toda la reserva con solo el estado modificado
      const updateData = {
        ...reserva,  // Incluir todos los campos originales
        Estado: newStatus  // Solo cambiar el estado
      };
      
      // Limpiar campos que pueden causar problemas
      delete updateData.NombreUsuario;
      delete updateData.NombreEspacio;
      
      await reservaService.update(id, updateData);
      fetchDashboardData(); // Refrescar los datos
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    }
  };

  if (loading) {
    return <div className="loading">Cargando dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard - Sistema de Reservas</h1>
      
      <div className="welcome-message">
        <h2>Bienvenido, {user?.Nombre} {user?.Apellido}</h2>
        <p>Rol: {user?.Rol || 'Usuario'}</p>
      </div>
      
      <h2>{isAdmin ? "Estadísticas Generales" : "Mis Estadísticas"}</h2>
      
      <div className="stats-grid">
        <div className="stat-card clickable" onClick={() => navigateToReservas()}>
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{isAdmin ? 'Total Reservas' : 'Mis Reservas'}</h3>
            <p className="stat-number">{stats.totalReservas}</p>
          </div>
        </div>
        
        <div className="stat-card clickable" onClick={() => navigateToReservas('Pendiente')}>
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pendientes</h3>
            <p className="stat-number">{stats.reservasPendientes}</p>
          </div>
        </div>
        
        <div className="stat-card clickable" onClick={() => navigateToReservas('Aprobada')}>
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Aprobadas</h3>
            <p className="stat-number">{stats.reservasAprobadas}</p>
          </div>
        </div>
        
        <RestrictedAccess
          module="espacios"
          action="view"
        >
          <div className="stat-card clickable" onClick={navigateToEspacios}>
            <div className="stat-icon">🏢</div>
            <div className="stat-content">
              <h3>Espacios</h3>
              <p className="stat-number">{stats.totalEspacios}</p>
            </div>
          </div>
        </RestrictedAccess>
        
        <RestrictedAccess
          module="usuarios"
          action="viewAll"
        >
          <div className="stat-card clickable" onClick={navigateToUsuarios}>
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>Usuarios</h3>
              <p className="stat-number">{stats.totalUsuarios}</p>
            </div>
          </div>
        </RestrictedAccess>
      </div>

      <div className="recent-section">
        <h2>{isAdmin ? 'Reservas Recientes' : 'Mis Reservas Recientes'}</h2>
        <div className="recent-reservas">
          {recentReservas.length === 0 ? (
            <div className="no-data-message">
              <h3>{isAdmin ? 'No hay reservas en el sistema' : 'No tienes reservas'}</h3>
              <p>
                {isAdmin 
                  ? "Aún no se ha creado ninguna reserva en el sistema." 
                  : "No tienes reservas asociadas a tu cuenta."}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="recent-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Espacio</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Estado</th>
                    <RestrictedAccess 
                      module="reservas" 
                      action="edit"
                      fallback={null}
                    >
                      <th>Acciones</th>
                    </RestrictedAccess>
                  </tr>
                </thead>
                <tbody>
                  {recentReservas.map((reserva) => (
                    <tr key={reserva.ID_Reserva || reserva.id}>
                      <td>{reserva.NombreUsuario || 'N/A'}</td>
                      <td>{reserva.NombreEspacio || 'N/A'}</td>
                      <td>{formatDate(reserva.Fecha)}</td>
                      <td>{reserva.HoraInicio} - {reserva.HoraFin}</td>
                      <td>
                        <span className={getStatusBadge(reserva.Estado)}>
                          {reserva.Estado}
                        </span>
                      </td>
                      <RestrictedAccess 
                        module="reservas" 
                        action="edit"
                        fallback={null}
                      >
                        <td>
                          {reserva.Estado === 'Pendiente' && isAdmin && (
                            <div className="action-buttons">
                              <button 
                                className="btn btn-sm btn-success"
                                onClick={() => handleStatusChange(reserva.ID_Reserva || reserva.id, 'Aprobada')}
                              >
                                Aprobar
                              </button>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => handleStatusChange(reserva.ID_Reserva || reserva.id, 'Rechazada')}
                              >
                                Rechazar
                              </button>
                            </div>
                          )}
                        </td>
                      </RestrictedAccess>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
