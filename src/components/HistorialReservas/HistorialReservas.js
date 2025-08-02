import React, { useState, useEffect } from 'react';
import { reservaService, usuarioService, espacioService } from '../../services/api';
import { usePermissions } from '../../contexts/PermissionsContext';
import RestrictedAccess from '../RestrictedAccess/RestrictedAccess';
import './HistorialReservas.css';

const HistorialReservas = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [historialReservas, setHistorialReservas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [consultaTipo, setConsultaTipo] = useState('usuario'); // 'usuario' o 'espacio'
  const [selectedUsuario, setSelectedUsuario] = useState('');
  const [selectedEspacio, setSelectedEspacio] = useState('');
  const [error, setError] = useState('');
  
  const { isAdmin, hasPermission } = usePermissions();

  useEffect(() => {
    fetchUsuariosYEspacios();
  }, []);

  // Verificar permisos de administrador - DESPUÉS de todos los hooks
  if (!isAdmin && !hasPermission('historial_reservas')) {
    return <RestrictedAccess />;
  }

  const fetchUsuariosYEspacios = async () => {
    try {
      const [usuariosRes, espaciosRes] = await Promise.all([
        usuarioService.getAll(),
        espacioService.getAll()
      ]);
      
      setUsuarios(usuariosRes.data || []);
      setEspacios(espaciosRes.data || []);
    } catch (error) {
      console.error('Error al cargar usuarios y espacios:', error);
      setError('Error al cargar los datos iniciales');
    }
  };

  const consultarHistorial = async () => {
    if (consultaTipo === 'usuario' && !selectedUsuario) {
      setError('Por favor selecciona un usuario');
      return;
    }
    
    if (consultaTipo === 'espacio' && !selectedEspacio) {
      setError('Por favor selecciona un espacio');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let response;
      
      if (consultaTipo === 'usuario') {
        response = await reservaService.getHistorialPorUsuario(selectedUsuario);
      } else {
        response = await reservaService.getHistorialPorEspacio(selectedEspacio);
      }
      
      setHistorialReservas(response.data || []);
      
      if (!response.data || response.data.length === 0) {
        setError('No se encontraron reservas para los criterios seleccionados');
      }
    } catch (error) {
      console.error('Error al consultar historial:', error);
      setError('Error al consultar el historial de reservas');
      setHistorialReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const limpiarConsulta = () => {
    setHistorialReservas([]);
    setSelectedUsuario('');
    setSelectedEspacio('');
    setError('');
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES');
  };

  const formatearHora = (hora) => {
    if (!hora) return 'N/A';
    // Si la hora viene como "HH:mm:ss" o "HH:mm", extraer solo HH:mm
    if (typeof hora === 'string' && hora.includes(':')) {
      return hora.substring(0, 5);
    }
    return hora;
  };

  const getEstadoClass = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'confirmada':
        return 'estado-confirmada';
      case 'pendiente':
        return 'estado-pendiente';
      case 'cancelada':
        return 'estado-cancelada';
      default:
        return 'estado-default';
    }
  };

  return (
    <div className="historial-reservas-container">
      <div className="historial-header">
        <h2>Historial de Reservas</h2>
        <p className="historial-subtitle">Consulta el historial de reservas por usuario o por espacio</p>
      </div>

      <div className="historial-controls">
        <div className="consulta-tipo">
          <label>
            <input
              type="radio"
              value="usuario"
              checked={consultaTipo === 'usuario'}
              onChange={(e) => setConsultaTipo(e.target.value)}
            />
            Consultar por Usuario
          </label>
          <label>
            <input
              type="radio"
              value="espacio"
              checked={consultaTipo === 'espacio'}
              onChange={(e) => setConsultaTipo(e.target.value)}
            />
            Consultar por Espacio
          </label>
        </div>

        <div className="filtros-section">
          {consultaTipo === 'usuario' && (
            <div className="filtro-grupo">
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
                    {usuario.Nombre} {usuario.Apellido} ({usuario.Correo})
                  </option>
                ))}
              </select>
            </div>
          )}

          {consultaTipo === 'espacio' && (
            <div className="filtro-grupo">
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
                    {espacio.Nombre} - {espacio.Tipo}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="botones-accion">
            <button
              onClick={consultarHistorial}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Consultando...' : 'Consultar Historial'}
            </button>
            <button
              onClick={limpiarConsulta}
              className="btn btn-secondary"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {historialReservas.length > 0 && (
        <div className="historial-resultados">
          <h3>
            Resultados ({historialReservas.length} reserva{historialReservas.length !== 1 ? 's' : ''})
          </h3>
          
          <div className="tabla-container">
            <table className="historial-tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Usuario</th>
                  <th>Espacio</th>
                  <th>Fecha</th>
                  <th>Hora Inicio</th>
                  <th>Hora Fin</th>
                  <th>Estado</th>
                  <th>Fecha Creación</th>
                </tr>
              </thead>
              <tbody>
                {historialReservas.map(reserva => (
                  <tr key={reserva.ID_Reserva || reserva.id}>
                    <td>{reserva.ID_Reserva || reserva.id}</td>
                    <td>
                      <div className="usuario-info">
                        <span className="nombre-usuario">
                          {reserva.NombreUsuario || 'Usuario desconocido'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="espacio-info">
                        <span className="nombre-espacio">
                          {reserva.NombreEspacio || 'Espacio desconocido'}
                        </span>
                      </div>
                    </td>
                    <td>{formatearFecha(reserva.Fecha)}</td>
                    <td>{formatearHora(reserva.HoraInicio)}</td>
                    <td>{formatearHora(reserva.HoraFin)}</td>
                    <td>
                      <span className={`estado-badge ${getEstadoClass(reserva.Estado)}`}>
                        {reserva.Estado || 'Pendiente'}
                      </span>
                    </td>
                    <td>{formatearFecha(reserva.FechaCreacion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && historialReservas.length === 0 && !error && (
        <div className="sin-resultados">
          <p>Selecciona los criterios de búsqueda y haz clic en "Consultar Historial" para ver los resultados.</p>
        </div>
      )}
    </div>
  );
};

export default HistorialReservas;
