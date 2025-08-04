import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './DisponibilidadEspacios.css';

const DisponibilidadEspacios = () => {
  const [espacios, setEspacios] = useState([]);
  const [selectedEspacio, setSelectedEspacio] = useState('');
  const [fecha, setFecha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar espacios al montar el componente
  useEffect(() => {
    const cargarEspacios = async () => {
      try {
        console.log('[DisponibilidadEspacios] Cargando espacios...');
        console.log('[DisponibilidadEspacios] Token en localStorage:', localStorage.getItem('token') ? 'Sí existe' : 'No existe');
        
        const response = await api.espacios.getAll();
        console.log('[DisponibilidadEspacios] Respuesta de espacios:', response);
        setEspacios(response.data || []);
        console.log('[DisponibilidadEspacios] Espacios cargados:', response.data?.length || 0);
      } catch (error) {
        console.error('[DisponibilidadEspacios] Error al cargar espacios:', error);
        
        if (error.response?.status === 401) {
          setError('No tienes autorización para ver los espacios. Por favor, inicia sesión nuevamente.');
        } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
          setError('No se puede conectar al servidor. Verifica que el backend esté ejecutándose.');
        } else {
          setError('Error al cargar la lista de espacios. Inténtalo de nuevo.');
        }
      }
    };

    cargarEspacios();
  }, []);

  const verificarDisponibilidad = async () => {
    // Validaciones
    if (!selectedEspacio) {
      setError('Por favor selecciona un espacio');
      return;
    }
    if (!fecha) {
      setError('Por favor selecciona una fecha');
      return;
    }
    if (!horaInicio) {
      setError('Por favor selecciona la hora de inicio');
      return;
    }
    if (!horaFin) {
      setError('Por favor selecciona la hora de fin');
      return;
    }

    // Validar que la hora de inicio sea menor a la hora de fin
    if (horaInicio >= horaFin) {
      setError('La hora de inicio debe ser menor a la hora de fin');
      return;
    }

    // Validar que la fecha no sea en el pasado
    const fechaSeleccionada = new Date(fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaSeleccionada < hoy) {
      setError('No puedes verificar disponibilidad para fechas pasadas');
      return;
    }

    setLoading(true);
    setError('');
    setDisponibilidad(null);

    // Log detallado de los parámetros que se van a enviar
    console.log('[DisponibilidadEspacios] Parámetros a enviar:');
    console.log('- espacioId:', selectedEspacio, typeof selectedEspacio);
    console.log('- fecha:', fecha, typeof fecha);
    console.log('- horaInicio:', horaInicio, typeof horaInicio);
    console.log('- horaFin:', horaFin, typeof horaFin);

    try {
      const response = await api.reservas.verificarDisponibilidad(
        selectedEspacio,
        fecha,
        horaInicio,
        horaFin
      );

      console.log('[DisponibilidadEspacios] Respuesta del servidor:', response);
      
      // Normalizar la respuesta del backend (que usa "Disponible" con mayúscula)
      const disponibilidadNormalizada = {
        disponible: response.data.Disponible,
        espacio: response.data.Espacio,
        fecha: response.data.Fecha,
        horaInicio: response.data.HoraInicio,
        horaFin: response.data.HoraFin,
        mensaje: response.data.mensaje
      };
      
      console.log('[DisponibilidadEspacios] Datos normalizados:', disponibilidadNormalizada);
      setDisponibilidad(disponibilidadNormalizada);
    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
      
      if (error.response?.status === 409) {
        // Conflicto - espacio no disponible
        setDisponibilidad({
          disponible: false,
          mensaje: error.response.data?.mensaje || 'El espacio no está disponible en el horario seleccionado',
          reservasConflicto: error.response.data?.reservasConflicto || []
        });
      } else {
        setError('Error al verificar la disponibilidad del espacio');
      }
    } finally {
      setLoading(false);
    }
  };

  const limpiarFormulario = () => {
    setSelectedEspacio('');
    setFecha('');
    setHoraInicio('');
    setHoraFin('');
    setDisponibilidad(null);
    setError('');
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearHora = (hora) => {
    return hora ? hora.substring(0, 5) : '';
  };

  // Obtener la fecha mínima (hoy)
  const getFechaMinima = () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  };

  return (
    <div className="disponibilidad-container">
      <div className="disponibilidad-header">
        <h1>Verificar Disponibilidad de Espacios</h1>
        <p>Consulta si un espacio está disponible en una fecha y horario específico</p>
      </div>

      <div className="formulario-disponibilidad">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="espacio-select">Espacio:</label>
            <select
              id="espacio-select"
              value={selectedEspacio}
              onChange={(e) => setSelectedEspacio(e.target.value)}
              className="form-control"
            >
              <option value="">-- Selecciona un espacio --</option>
              {espacios.map(espacio => (
                <option key={espacio.ID_Espacio} value={espacio.ID_Espacio}>
                  {espacio.Nombre} - {espacio.Ubicacion} (Cap: {espacio.Capacidad})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="fecha-input">Fecha:</label>
            <input
              type="date"
              id="fecha-input"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="form-control"
              min={getFechaMinima()}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="hora-inicio">Hora de Inicio:</label>
            <input
              type="time"
              id="hora-inicio"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="hora-fin">Hora de Fin:</label>
            <input
              type="time"
              id="hora-fin"
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              className="form-control"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            onClick={verificarDisponibilidad}
            disabled={loading}
            className="btn-verificar"
          >
            {loading ? 'Verificando...' : 'Verificar Disponibilidad'}
          </button>
          <button
            onClick={limpiarFormulario}
            className="btn-limpiar"
          >
            Limpiar
          </button>
        </div>
      </div>

      {error && (
        <div className="mensaje-error">
          <i className="icon-error">⚠️</i>
          {error}
        </div>
      )}

      {disponibilidad && (
        <div className={`resultado-disponibilidad ${disponibilidad.disponible ? 'disponible' : 'no-disponible'}`}>
          <div className="resultado-header">
            <i className={`icon-resultado ${disponibilidad.disponible ? '✅' : '❌'}`}>
              {disponibilidad.disponible ? '✅' : '❌'}
            </i>
            <h3>
              {disponibilidad.disponible ? 'Espacio Disponible' : 'Espacio No Disponible'}
            </h3>
          </div>

          <div className="resultado-detalles">
            <div className="detalle-item">
              <strong>Espacio:</strong> {espacios.find(e => e.ID_Espacio == selectedEspacio)?.Nombre}
            </div>
            <div className="detalle-item">
              <strong>Fecha:</strong> {formatearFecha(fecha)}
            </div>
            <div className="detalle-item">
              <strong>Horario:</strong> {formatearHora(horaInicio)} - {formatearHora(horaFin)}
            </div>
          </div>

          <div className="mensaje-resultado">
            {disponibilidad.mensaje || (disponibilidad.disponible 
              ? 'El espacio está libre en el horario solicitado. ¡Puedes hacer tu reserva!' 
              : 'El espacio no está disponible en este horario.')}
          </div>

          {!disponibilidad.disponible && disponibilidad.reservasConflicto && disponibilidad.reservasConflicto.length > 0 && (
            <div className="reservas-conflicto">
              <h4>Reservas existentes en conflicto:</h4>
              <div className="tabla-conflictos">
                <table>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Horario</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disponibilidad.reservasConflicto.map((reserva, index) => (
                      <tr key={index}>
                        <td>{reserva.Usuario || 'N/A'}</td>
                        <td>
                          {formatearHora(reserva.Hora_Inicio)} - {formatearHora(reserva.Hora_Fin)}
                        </td>
                        <td>
                          <span className={`estado ${reserva.Estado?.toLowerCase()}`}>
                            {reserva.Estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {disponibilidad.disponible && (
            <div className="sugerencia-reserva">
              <p>💡 <strong>Tip:</strong> Ve a la sección "Reservas" para crear una nueva reserva con estos datos.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DisponibilidadEspacios;
