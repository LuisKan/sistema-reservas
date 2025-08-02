import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './Historial.css';

const Historial = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('usuario');
  const [usuarios, setUsuarios] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [selectedUsuario, setSelectedUsuario] = useState('');
  const [selectedEspacio, setSelectedEspacio] = useState('');
  const [historialReservas, setHistorialReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar usuarios y espacios al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [usuariosRes, espaciosRes] = await Promise.all([
          api.usuarios.getAll(),
          api.espacios.getAll()
        ]);
        
        setUsuarios(usuariosRes.data || []);
        setEspacios(espaciosRes.data || []);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar datos iniciales');
      }
    };

    cargarDatos();
  }, []);

  const consultarHistorialUsuario = async () => {
    if (!selectedUsuario) {
      setError('Por favor selecciona un usuario');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await api.reservas.getHistorialPorUsuario(selectedUsuario);
      setHistorialReservas(response.data || []);
    } catch (error) {
      console.error('Error al consultar historial por usuario:', error);
      setError('Error al consultar el historial del usuario');
      setHistorialReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const consultarHistorialEspacio = async () => {
    if (!selectedEspacio) {
      setError('Por favor selecciona un espacio');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await api.reservas.getHistorialPorEspacio(selectedEspacio);
      setHistorialReservas(response.data || []);
    } catch (error) {
      console.error('Error al consultar historial por espacio:', error);
      setError('Error al consultar el historial del espacio');
      setHistorialReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearEstado = (estado) => {
    const estados = {
      'Confirmada': 'confirmada',
      'Pendiente': 'pendiente',
      'Cancelada': 'cancelada',
      'Completada': 'completada'
    };
    return estados[estado] || 'desconocido';
  };

  const limpiarResultados = () => {
    setHistorialReservas([]);
    setSelectedUsuario('');
    setSelectedEspacio('');
    setError('');
  };

  // Verificar si el usuario es administrador
  if (user?.Rol !== 'Admin') {
    return (
      <div className="historial-container">
        <div className="access-denied">
          <h2>Acceso Denegado</h2>
          <p>Solo los administradores pueden consultar el historial de reservas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="historial-container">
      <div className="historial-header">
        <h1>Historial de Reservas</h1>
        <p>Consulta el historial completo de reservas por usuario o por espacio</p>
      </div>

      <div className="tabs-container">
        <button 
          className={`tab-button ${activeTab === 'usuario' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('usuario');
            limpiarResultados();
          }}
        >
          Por Usuario
        </button>
        <button 
          className={`tab-button ${activeTab === 'espacio' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('espacio');
            limpiarResultados();
          }}
        >
          Por Espacio
        </button>
      </div>

      <div className="search-section">
        {activeTab === 'usuario' ? (
          <div className="search-form">
            <div className="form-group">
              <label htmlFor="usuario-select">Seleccionar Usuario:</label>
              <select
                id="usuario-select"
                value={selectedUsuario}
                onChange={(e) => setSelectedUsuario(e.target.value)}
                className="form-select"
              >
                <option value="">-- Selecciona un usuario --</option>
                {usuarios.map(usuario => (
                  <option key={usuario.ID_Usuario} value={usuario.ID_Usuario}>
                    {usuario.Nombre} {usuario.Apellido} ({usuario.Email})
                  </option>
                ))}
              </select>
            </div>
            <button 
              onClick={consultarHistorialUsuario}
              disabled={loading || !selectedUsuario}
              className="search-button"
            >
              {loading ? 'Consultando...' : 'Consultar Historial'}
            </button>
          </div>
        ) : (
          <div className="search-form">
            <div className="form-group">
              <label htmlFor="espacio-select">Seleccionar Espacio:</label>
              <select
                id="espacio-select"
                value={selectedEspacio}
                onChange={(e) => setSelectedEspacio(e.target.value)}
                className="form-select"
              >
                <option value="">-- Selecciona un espacio --</option>
                {espacios.map(espacio => (
                  <option key={espacio.ID_Espacio} value={espacio.ID_Espacio}>
                    {espacio.Nombre} - {espacio.Ubicacion}
                  </option>
                ))}
              </select>
            </div>
            <button 
              onClick={consultarHistorialEspacio}
              disabled={loading || !selectedEspacio}
              className="search-button"
            >
              {loading ? 'Consultando...' : 'Consultar Historial'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {historialReservas.length > 0 && (
        <div className="results-section">
          <div className="results-header">
            <h3>
              Historial de Reservas 
              {activeTab === 'usuario' && selectedUsuario && (
                <span> - {usuarios.find(u => u.ID_Usuario == selectedUsuario)?.Nombre}</span>
              )}
              {activeTab === 'espacio' && selectedEspacio && (
                <span> - {espacios.find(e => e.ID_Espacio == selectedEspacio)?.Nombre}</span>
              )}
            </h3>
            <p className="results-count">Total de reservas: {historialReservas.length}</p>
          </div>

          <div className="table-container">
            <table className="historial-table">
              <thead>
                <tr>
                  <th>ID Reserva</th>
                  {activeTab === 'usuario' ? <th>Espacio</th> : <th>Usuario</th>}
                  <th>Fecha Inicio</th>
                  <th>Fecha Fin</th>
                  <th>Estado</th>
                  <th>Fecha Creación</th>
                  <th>Propósito</th>
                </tr>
              </thead>
              <tbody>
                {historialReservas.map(reserva => (
                  <tr key={reserva.ID_Reserva}>
                    <td>{reserva.ID_Reserva}</td>
                    {activeTab === 'usuario' ? (
                      <td>{reserva.Espacio?.Nombre || 'N/A'}</td>
                    ) : (
                      <td>{reserva.Usuario?.Nombre} {reserva.Usuario?.Apellido}</td>
                    )}
                    <td>{formatearFecha(reserva.Fecha_Inicio)}</td>
                    <td>{formatearFecha(reserva.Fecha_Fin)}</td>
                    <td>
                      <span className={`estado ${formatearEstado(reserva.Estado)}`}>
                        {reserva.Estado}
                      </span>
                    </td>
                    <td>{formatearFecha(reserva.Fecha_Creacion)}</td>
                    <td>{reserva.Proposito || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {historialReservas.length === 0 && !loading && !error && (selectedUsuario || selectedEspacio) && (
        <div className="no-results">
          <p>No se encontraron reservas para la selección actual.</p>
        </div>
      )}
    </div>
  );
};

export default Historial;
