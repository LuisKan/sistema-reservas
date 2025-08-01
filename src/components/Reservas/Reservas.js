import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { reservaService, usuarioService, espacioService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import RestrictedAccess from '../RestrictedAccess/RestrictedAccess';
import './Reservas.css';
import './user-display.css';

const Reservas = () => {
  const [reservas, setReservas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReserva, setEditingReserva] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    ID_Usuario: '',
    ID_Espacio: '',
    Fecha: '',
    HoraInicio: '',
    HoraFin: '',
    Estado: 'Pendiente'
  });
  const { user } = useAuth();
  const { isAdmin, hasPermission } = usePermissions();

  useEffect(() => {
    fetchData();
    
    // Verificar si hay un filtro en la URL
    const filterParam = searchParams.get('filter');
    if (filterParam) {
      setFiltroEstado(filterParam);
    }
  }, [searchParams]);

  // Efecto para asegurar que el formulario tenga siempre un ID de usuario válido
  useEffect(() => {
    // Imprimir usuario completo para depuración
    console.log('[Reservas] Usuario actual (objeto completo):', JSON.stringify(user, null, 2));
    
    if (showModal && user) {
      // Usar el ID del usuario actual de la sesión
      const userId = user.id || user.ID_Usuario;
      console.log('[Reservas] Usando ID de usuario real de la sesión:', userId);
      
      // Para usuarios no administradores, siempre usar su propio ID
      if (!isAdmin) {
        console.log('[Reservas] Usuario no admin - Configurando ID de usuario en formData:', userId);
        setFormData(prev => ({
          ...prev,
          ID_Usuario: userId
        }));
      } 
      // Para administradores, solo configurar si no hay ID seleccionado
      else if (!formData.ID_Usuario || formData.ID_Usuario === 0) {
        console.log('[Reservas] Admin sin ID seleccionado - Configurando ID de usuario en formData:', userId);
        setFormData(prev => ({
          ...prev,
          ID_Usuario: userId
        }));
      }
    }
  }, [showModal, isAdmin, formData.ID_Usuario, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Obtener datos de usuarios y espacios en paralelo
      const [usuariosRes, espaciosRes] = await Promise.all([
        usuarioService.getAll(),
        espacioService.getAll()
      ]);
      
      // Obtener todas las reservas sin importar el rol del usuario
      const reservasRes = await reservaService.getAll();
      console.log("[Reservas] Todas las reservas obtenidas:", reservasRes.data);
      console.log("[Reservas] Estructura completa:", JSON.stringify(reservasRes.data, null, 2));
      
      // IMPORTANTE: Si no hay datos, verificar si la respuesta está estructurada diferente
      if (Array.isArray(reservasRes.data) && reservasRes.data.length > 0) {
        console.log("[Reservas] Primera reserva:", reservasRes.data[0]);
        console.log("[Reservas] Campos disponibles:", Object.keys(reservasRes.data[0]));
      } else {
        console.warn("[Reservas] No hay reservas disponibles o el formato de respuesta es incorrecto");
      }
      
      // Nota: El filtrado se hace directamente en el renderizado
      // Esto garantiza que siempre se usa el filtrado más reciente
      
      setReservas(reservasRes.data || []);
      
      // DEBUG: Verificar estado después de setear reservas
      console.log("[Reservas] Estado de reservas después de setear:", reservasRes.data || []);
      console.log("[Reservas] Cantidad total de reservas:", (reservasRes.data || []).length);
      
      // Procesar y normalizar los datos de espacios para asegurar consistencia
      console.log("[Reservas] Datos de espacios recibidos:", espaciosRes.data);
      const espaciosProcesados = espaciosRes.data.map(espacio => {
        // Asegurarnos de que cada espacio tenga una propiedad ID consistente
        return {
          ...espacio,
          // Si el espacio tiene ID_Espacio, lo copiamos a id para consistencia
          id: espacio.id || espacio.ID_Espacio
        };
      });
      console.log("[Reservas] Espacios procesados:", espaciosProcesados);
      
      setUsuarios(usuariosRes.data);
      setEspacios(espaciosProcesados);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('[Reservas] Iniciando envío del formulario...');
      console.log('[Reservas] Datos del formulario antes de procesar:', formData);
      
      // Validar que la hora de inicio sea anterior a la hora de fin
      if (formData.HoraInicio && formData.HoraFin) {
        const horaInicio = new Date(`2000-01-01T${formData.HoraInicio}`);
        const horaFin = new Date(`2000-01-01T${formData.HoraFin}`);
        
        if (horaInicio >= horaFin) {
          alert('La hora de inicio debe ser anterior a la hora de fin');
          return;
        }
      }
      
      // Si estamos editando, usamos el ID original de la reserva
      const reservaId = editingReserva ? (editingReserva.ID_Reserva || editingReserva.id) : 0;
      console.log(`[Reservas] ID de reserva para actualización: ${reservaId}`);
      
      // Obtener el nombre del espacio seleccionado
      console.log('[Reservas] Buscando espacio con ID:', formData.ID_Espacio);
      const espacioSeleccionado = espacios.find(e => 
        e.id === formData.ID_Espacio || e.ID_Espacio === formData.ID_Espacio
      );
      console.log('[Reservas] Espacio seleccionado:', espacioSeleccionado);
      const nombreEspacio = espacioSeleccionado ? espacioSeleccionado.Nombre : '';
      
      // Preparar datos normalizados de la reserva
      const reservaData = {
        ID_Espacio: parseInt(formData.ID_Espacio) || 0,
        Fecha: formData.Fecha || '',
        HoraInicio: formData.HoraInicio || '',
        HoraFin: formData.HoraFin || '',
        Estado: formData.Estado || 'Pendiente',
        NombreEspacio: nombreEspacio || '',
        // Mantener la fecha de creación si estamos editando
        FechaCreacion: editingReserva?.FechaCreacion || null
      };
      
      // Preparar la información del usuario para la reserva
      console.log('[Reservas] isAdmin:', isAdmin);
      console.log('[Reservas] user actual (COMPLETO):', JSON.stringify(user, null, 2));
      console.log('[Reservas] user.ID_Usuario:', user?.ID_Usuario);
      console.log('[Reservas] user.id:', user?.id);
      console.log('[Reservas] user.Nombre:', user?.Nombre);
      console.log('[Reservas] formData.ID_Usuario:', formData.ID_Usuario);
      
      // Determinar qué usuario usar para la reserva
      let usuarioParaReserva;
      let idUsuarioFinal;
      
      if (isAdmin && formData.ID_Usuario) {
        // Si es admin y ha seleccionado un usuario específico, usar ese usuario
        const usuarioSeleccionado = usuarios.find(u => 
          (u.id || u.ID_Usuario) == formData.ID_Usuario
        );
        
        if (usuarioSeleccionado) {
          usuarioParaReserva = {
            ID_Usuario: usuarioSeleccionado.ID_Usuario || usuarioSeleccionado.id,
            id: usuarioSeleccionado.id || usuarioSeleccionado.ID_Usuario,
            Nombre: usuarioSeleccionado.Nombre,
            Apellido: usuarioSeleccionado.Apellido,
            Email: usuarioSeleccionado.Email || usuarioSeleccionado.Correo,
            Rol: usuarioSeleccionado.Rol
          };
          idUsuarioFinal = usuarioSeleccionado.ID_Usuario || usuarioSeleccionado.id;
          console.log('[Reservas] Admin seleccionó usuario específico:', JSON.stringify(usuarioParaReserva, null, 2));
        } else {
          console.error('[Reservas] No se encontró el usuario seleccionado con ID:', formData.ID_Usuario);
        }
      } else {
        // Si no es admin o no ha seleccionado usuario, usar el usuario actual de la sesión
        usuarioParaReserva = {
          ID_Usuario: user?.ID_Usuario || user?.id,
          id: user?.id || user?.ID_Usuario,
          Nombre: user?.Nombre,
          Apellido: user?.Apellido,
          Email: user?.Email || user?.Correo,
          Rol: user?.Rol
        };
        idUsuarioFinal = user?.ID_Usuario || user?.id;
        console.log('[Reservas] Usando usuario actual de la sesión:', JSON.stringify(usuarioParaReserva, null, 2));
      }
      
      // Asegurar que reservaData tenga el ID_Usuario correcto
      reservaData.ID_Usuario = idUsuarioFinal;
      console.log('[Reservas] ID_Usuario final asignado a reservaData:', reservaData.ID_Usuario);
      
      console.log('[Reservas] ===== DATOS FINALES ANTES DE ENVIAR =====');
      console.log('[Reservas] Usuario final para la reserva:', usuarioParaReserva);
      console.log('[Reservas] Es admin?:', isAdmin);
      console.log('[Reservas] formData.ID_Usuario:', formData.ID_Usuario);
      console.log('[Reservas] reservaData.ID_Usuario:', reservaData.ID_Usuario);
      console.log('[Reservas] usuarioParaReserva.Nombre:', usuarioParaReserva?.Nombre);
      console.log('[Reservas] user.Nombre del contexto:', user?.Nombre);
      console.log('[Reservas] =======================================');
      
      if (editingReserva) {
        console.log(`[Reservas] Actualizando reserva con ID: ${reservaId}`);
        console.log('[Reservas] Datos para actualización:', reservaData);
        await reservaService.update(reservaId, reservaData, usuarioParaReserva);
      } else {
        console.log('[Reservas] ===== CREANDO NUEVA RESERVA =====');
        console.log('[Reservas] Datos para creación:', JSON.stringify(reservaData, null, 2));
        console.log('[Reservas] Usuario para creación:', JSON.stringify(usuarioParaReserva, null, 2));
        await reservaService.create(reservaData, usuarioParaReserva);
      }
      
      fetchData();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving reserva:', error);
      alert('Error al guardar la reserva');
    }
  };

  const handleDelete = async (id) => {
    try {
      await reservaService.delete(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting reserva:', error);
      alert('Error al eliminar la reserva');
    }
  };

  const handleEdit = (reserva) => {
    console.log('[Reservas] Editando reserva:', reserva);
    console.log('[Reservas] ID_Espacio en la reserva:', reserva.ID_Espacio);
    console.log('[Reservas] Lista de espacios disponibles:', espacios);
    
    // Buscar el espacio correspondiente en la lista de espacios
    const espacioReserva = espacios.find(e => e.id === reserva.ID_Espacio || e.ID_Espacio === reserva.ID_Espacio);
    console.log('[Reservas] Espacio encontrado:', espacioReserva);
    
    // Asegurarse de que la fecha tiene un formato válido
    let formattedDate = '';
    try {
      // Intentar extraer la fecha en formato YYYY-MM-DD
      if (reserva.Fecha) {
        const dateObj = new Date(reserva.Fecha);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString().split('T')[0];
        } else if (reserva.Fecha.includes('T')) {
          formattedDate = reserva.Fecha.split('T')[0];
        } else {
          formattedDate = reserva.Fecha;
        }
      }
    } catch (error) {
      console.error('[Reservas] Error al formatear la fecha:', error);
      formattedDate = '';
    }
    
    console.log('[Reservas] Fecha formateada para el formulario:', formattedDate);
    
    // Para seleccionar el espacio correcto, debemos asegurarnos de usar el ID en el formato adecuado
    const espacioId = espacioReserva ? espacioReserva.id : reserva.ID_Espacio;
    console.log('[Reservas] ID_Espacio que se usará en el formulario:', espacioId);
    
    setEditingReserva(reserva);
    setFormData({
      ID_Usuario: reserva.ID_Usuario || '',
      ID_Espacio: espacioId || '',  // Usar el ID encontrado o el original como respaldo
      Fecha: formattedDate,
      HoraInicio: reserva.HoraInicio || '',
      HoraFin: reserva.HoraFin || '',
      Estado: reserva.Estado || 'Pendiente'
    });
    setShowModal(true);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      if (!hasPermission('reservas', 'edit')) {
        alert('No tienes permisos para cambiar el estado de las reservas');
        return;
      }
      
      console.log(`[Reservas] Cambiando estado de reserva ${id} a: ${newStatus}`);
      
      const reserva = reservas.find(r => (r.ID_Reserva || r.id) === id);
      if (!reserva) {
        throw new Error('Reserva no encontrada');
      }
      
      console.log('[Reservas] Reserva encontrada:', reserva);
      
      // Formatear las horas en el formato que espera el backend (hh:mm:ss)
      const formatearHora = (hora) => {
        if (!hora) return '';
        // Si ya tiene segundos, lo dejamos así
        if (hora.split(':').length === 3) return hora;
        // Si solo tiene horas y minutos, añadimos segundos
        return hora + ':00';
      };
      
      // Mantener todos los campos necesarios, incluidos los nombres
      const updateData = {
        ID_Espacio: reserva.ID_Espacio || 0,
        Fecha: reserva.Fecha ? new Date(reserva.Fecha).toISOString().split('T')[0] : '',
        HoraInicio: formatearHora(reserva.HoraInicio),
        HoraFin: formatearHora(reserva.HoraFin),
        Estado: newStatus,  // Cambiar el estado
        NombreEspacio: reserva.NombreEspacio || '',
        // Si hay fecha de creación, mantenerla
        FechaCreacion: reserva.FechaCreacion || null
      };
      
      // Encontrar el usuario de la reserva
      const usuarioReserva = usuarios.find(u => 
        (u.id || u.ID_Usuario) === reserva.ID_Usuario || u.Nombre === reserva.NombreUsuario
      ) || { ID_Usuario: reserva.ID_Usuario, Nombre: reserva.NombreUsuario };
      
      console.log('[Reservas] Datos de actualización de estado:', updateData);
      console.log('[Reservas] Usuario de la reserva:', usuarioReserva);
      
      await reservaService.update(id, updateData, usuarioReserva);
      console.log('[Reservas] Estado actualizado con éxito');
      
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error al actualizar el estado');
    }
  };

  const resetForm = () => {
    setFormData({
      ID_Usuario: '',
      ID_Espacio: '',
      Fecha: '',
      HoraInicio: '',
      HoraFin: '',
      Estado: 'Pendiente'
    });
    setEditingReserva(null);
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
    return <div className="loading">Cargando reservas...</div>;
  }

  return (
    <div className="reservas">
      <div className="reservas-header">
        <h1>{isAdmin ? "Gestión de Reservas" : "Mis Reservas"}</h1>
        
        {/* Filtros de estado */}
        <div className="filters-section">
          <label htmlFor="filtro-estado">Filtrar por estado:</label>
          <select 
            id="filtro-estado"
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="filter-select"
          >
            <option value="">Todos los estados</option>
            <option value="Pendiente">Pendientes</option>
            <option value="Aprobada">Aprobadas</option>
            <option value="Rechazada">Rechazadas</option>
          </select>
        </div>
        
        <RestrictedAccess 
          module="reservas" 
          action="create"
        >
          <button 
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              // Si el usuario no es administrador, pre-seleccionar su ID
              if (!isAdmin && user) {
                const userId = user.id || user.ID_Usuario;
                console.log(`[Reservas] Pre-seleccionando ID de usuario: ${userId}`);
                setFormData(prev => ({ 
                  ...prev, 
                  ID_Usuario: userId,
                  NombreUsuario: user.Nombre // Añadir nombre de usuario
                }));
              } else if (isAdmin) {
                console.log('[Reservas] Usuario administrador - formulario sin pre-selección');
              }
              setShowModal(true);
            }}
          >
            Nueva Reserva
          </button>
        </RestrictedAccess>
      </div>

      <div className="reservas-table">
        {reservas.length === 0 ? (
          <div className="no-data-message">
            <h3>No hay reservas disponibles</h3>
            <p>
              {isAdmin 
                ? "No se ha creado ninguna reserva en el sistema." 
                : "No tienes reservas asociadas a tu cuenta."}
            </p>
            <button 
              className="btn btn-primary" 
              onClick={() => fetchData()}
              style={{marginTop: '15px'}}
            >
              Recargar datos
            </button>
          </div>
        ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Espacio</th>
              <th>Fecha</th>
              <th>Hora Inicio</th>
              <th>Hora Fin</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {/* Filtrar reservas según el usuario actual y el filtro de estado */}
            {(() => {
              console.log("[Render] Estado actual de reservas:", reservas);
              console.log("[Render] Cantidad de reservas:", reservas.length);
              console.log("[Render] Usuario actual:", user);
              console.log("[Render] Es admin:", isAdmin);
              console.log("[Render] Filtro estado:", filtroEstado);
              
              const reservasFiltradas = reservas.filter(reserva => {
                console.log(`[Filtro] Procesando reserva:`, reserva);
                
                // Permitir que administradores vean todas las reservas
                let esReservaDelUsuario = true;
                if (!isAdmin) {
                  // Comparar el NombreUsuario con el nombre del usuario actual
                  esReservaDelUsuario = reserva.NombreUsuario === user?.Nombre;
                  console.log(`[Filtro] Reserva ID ${reserva.ID_Reserva || reserva.id}, Usuario: ${reserva.NombreUsuario}, Usuario Actual: ${user?.Nombre}, Coincide: ${esReservaDelUsuario}`);
                }
                
                // Aplicar filtro de estado si está definido
                let cumpleFiltroEstado = true;
                if (filtroEstado) {
                  cumpleFiltroEstado = reserva.Estado === filtroEstado;
                  console.log(`[Filtro] Reserva ID ${reserva.ID_Reserva || reserva.id}, Estado: ${reserva.Estado}, Filtro: ${filtroEstado}, Cumple: ${cumpleFiltroEstado}`);
                }
                
                const pasaFiltro = esReservaDelUsuario && cumpleFiltroEstado;
                console.log(`[Filtro] Reserva ${reserva.ID_Reserva || reserva.id} pasa filtro: ${pasaFiltro}`);
                return pasaFiltro;
              });
              
              console.log("[Render] Reservas después de filtrar:", reservasFiltradas);
              console.log("[Render] Cantidad de reservas filtradas:", reservasFiltradas.length);
              
              return reservasFiltradas.map((reserva) => (
                <tr key={reserva.ID_Reserva || reserva.id}>
                  <td>{reserva.ID_Reserva || reserva.id}</td>
                  <td>{reserva.NombreUsuario}</td>
                  <td>{reserva.NombreEspacio}</td>
                  <td>{formatDate(reserva.Fecha)}</td>
                  <td>{reserva.HoraInicio}</td>
                  <td>{reserva.HoraFin}</td>
                  <td>
                    <span className={getStatusBadge(reserva.Estado)}>
                      {reserva.Estado}
                    </span>
                  </td>
                <td>
                  <div className="action-buttons">
                    {/* Botón de editar solo visible para reservas pendientes */}
                    {reserva.Estado === 'Pendiente' && (
                      <button 
                        className="btn btn-sm btn-edit"
                        onClick={() => handleEdit(reserva)}
                      >
                        Editar
                      </button>
                    )}
                    
                    {reserva.Estado === 'Pendiente' && (
                      <RestrictedAccess
                        module="reservas"
                        action="edit"
                      >
                        <>
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
                        </>
                      </RestrictedAccess>
                    )}
                    
                    {/* Botón de eliminar siempre visible */}
                    <button 
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDelete(reserva.ID_Reserva || reserva.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
              ));
            })()}
          </tbody>
        </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingReserva ? 'Editar Reserva' : 'Nueva Reserva'}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Usuario:</label>
                {isAdmin ? (
                  <select
                    value={formData.ID_Usuario}
                    onChange={(e) => {
                      console.log('[Reservas] Usuario seleccionado - ID:', e.target.value);
                      const usuarioSeleccionado = usuarios.find(u => (u.id || u.ID_Usuario) == e.target.value);
                      console.log('[Reservas] Usuario seleccionado - Datos:', usuarioSeleccionado);
                      setFormData({...formData, ID_Usuario: e.target.value});
                    }}
                    required
                  >
                    <option value="">Seleccionar usuario</option>
                    {usuarios.map(usuario => {
                      const userId = usuario.id || usuario.ID_Usuario;
                      console.log(`[Reservas] Opción de usuario: ID=${userId}, Nombre=${usuario.Nombre}`);
                      return (
                        <option key={userId} value={userId}>
                          {usuario.Nombre} {usuario.Apellido || ''}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  <div className="user-display">
                    {user?.Nombre} {user?.Apellido || ''}
                    <input 
                      type="hidden" 
                      value={formData.ID_Usuario || user?.ID_Usuario || user?.id || ''} 
                      name="ID_Usuario"
                      readOnly
                    />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Espacio:</label>
                <select
                  value={formData.ID_Espacio}
                  onChange={(e) => {
                    console.log('[Reservas] Espacio seleccionado:', e.target.value);
                    setFormData({...formData, ID_Espacio: e.target.value});
                  }}
                  required
                >
                  <option value="">Seleccionar espacio</option>
                  {espacios.map(espacio => {
                    // Usar el ID consistentemente
                    const espacioId = espacio.id || espacio.ID_Espacio;
                    console.log(`[Reservas] Opción de espacio: ${espacioId} - ${espacio.Nombre}`);
                    return (
                      <option key={espacioId} value={espacioId}>
                        {espacio.Nombre} - {espacio.Ubicacion || ''}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label>Fecha:</label>
                <input
                  type="date"
                  value={formData.Fecha}
                  onChange={(e) => setFormData({...formData, Fecha: e.target.value})}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Hora Inicio:</label>
                  <input
                    type="time"
                    value={formData.HoraInicio}
                    onChange={(e) => setFormData({...formData, HoraInicio: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Hora Fin:</label>
                  <input
                    type="time"
                    value={formData.HoraFin}
                    onChange={(e) => setFormData({...formData, HoraFin: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Estado:</label>
                {isAdmin ? (
                  <select
                    value={formData.Estado}
                    onChange={(e) => setFormData({...formData, Estado: e.target.value})}
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Aprobada">Aprobada</option>
                    <option value="Rechazada">Rechazada</option>
                  </select>
                ) : (
                  <select
                    value="Pendiente"
                    disabled={true}
                  >
                    <option value="Pendiente">Pendiente</option>
                  </select>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingReserva ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservas;
