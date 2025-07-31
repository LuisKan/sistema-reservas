import React, { useState, useEffect } from 'react';
import { reservaService, espacioService, usuarioService } from '../../services/api';
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [reservasRes, espaciosRes, usuariosRes] = await Promise.all([
        reservaService.getAll(),
        espacioService.getAll(),
        usuarioService.getAll()
      ]);

      const reservas = reservasRes.data;
      const espacios = espaciosRes.data;
      const usuarios = usuariosRes.data;

      setStats({
        totalReservas: reservas.length,
        reservasPendientes: reservas.filter(r => r.Estado === 'Pendiente').length,
        reservasAprobadas: reservas.filter(r => r.Estado === 'Aprobada').length,
        totalEspacios: espacios.length,
        totalUsuarios: usuarios.length
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

  if (loading) {
    return <div className="loading">Cargando dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Dashboard - Sistema de Reservas</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Total Reservas</h3>
            <p className="stat-number">{stats.totalReservas}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pendientes</h3>
            <p className="stat-number">{stats.reservasPendientes}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Aprobadas</h3>
            <p className="stat-number">{stats.reservasAprobadas}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>Espacios</h3>
            <p className="stat-number">{stats.totalEspacios}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Usuarios</h3>
            <p className="stat-number">{stats.totalUsuarios}</p>
          </div>
        </div>
      </div>

      <div className="recent-section">
        <h2>Reservas Recientes</h2>
        <div className="recent-reservas">
          {recentReservas.length === 0 ? (
            <p>No hay reservas recientes</p>
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
