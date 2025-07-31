import React, { useState, useEffect } from 'react';
import { reservaService, usuarioService, espacioService } from '../../services/api';
import './Reservas.css';

const Reservas = () => {
  const [reservas, setReservas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReserva, setEditingReserva] = useState(null);
  const [formData, setFormData] = useState({
    ID_Usuario: '',
    ID_Espacio: '',
    Fecha: '',
    HoraInicio: '',
    HoraFin: '',
    Estado: 'Pendiente'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reservasRes, usuariosRes, espaciosRes] = await Promise.all([
        reservaService.getAll(),
        usuarioService.getAll(),
        espacioService.getAll()
      ]);
      
      setReservas(reservasRes.data);
      setUsuarios(usuariosRes.data);
      setEspacios(espaciosRes.data);
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
      const usuario = usuarios.find(u => u.id === parseInt(formData.ID_Usuario));
      const espacio = espacios.find(e => e.id === parseInt(formData.ID_Espacio));
      
      const reservaData = {
        ...formData,
        ID_Usuario: parseInt(formData.ID_Usuario),
        ID_Espacio: parseInt(formData.ID_Espacio),
        NombreUsuario: usuario ? usuario.Nombre : '',
        NombreEspacio: espacio ? espacio.Nombre : ''
      };

      if (editingReserva) {
        await reservaService.update(editingReserva.ID_Reserva || editingReserva.id, reservaData);
      } else {
        await reservaService.create(reservaData);
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
    if (window.confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
      try {
        await reservaService.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting reserva:', error);
        alert('Error al eliminar la reserva');
      }
    }
  };

  const handleEdit = (reserva) => {
    setEditingReserva(reserva);
    setFormData({
      ID_Usuario: reserva.ID_Usuario,
      ID_Espacio: reserva.ID_Espacio,
      Fecha: reserva.Fecha.split('T')[0],
      HoraInicio: reserva.HoraInicio,
      HoraFin: reserva.HoraFin,
      Estado: reserva.Estado
    });
    setShowModal(true);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const reserva = reservas.find(r => (r.ID_Reserva || r.id) === id);
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
        <h1>Gestión de Reservas</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          Nueva Reserva
        </button>
      </div>

      <div className="reservas-table">
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
            {reservas.map((reserva) => (
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
                    <button 
                      className="btn btn-sm btn-edit"
                      onClick={() => handleEdit(reserva)}
                    >
                      Editar
                    </button>
                    {reserva.Estado === 'Pendiente' && (
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
                    )}
                    <button 
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDelete(reserva.ID_Reserva || reserva.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                <select
                  value={formData.ID_Usuario}
                  onChange={(e) => setFormData({...formData, ID_Usuario: e.target.value})}
                  required
                >
                  <option value="">Seleccionar usuario</option>
                  {usuarios.map(usuario => (
                    <option key={usuario.id} value={usuario.id}>
                      {usuario.Nombre} {usuario.Apellido}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Espacio:</label>
                <select
                  value={formData.ID_Espacio}
                  onChange={(e) => setFormData({...formData, ID_Espacio: e.target.value})}
                  required
                >
                  <option value="">Seleccionar espacio</option>
                  {espacios.map(espacio => (
                    <option key={espacio.id} value={espacio.id}>
                      {espacio.Nombre} - {espacio.Ubicacion}
                    </option>
                  ))}
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
                <select
                  value={formData.Estado}
                  onChange={(e) => setFormData({...formData, Estado: e.target.value})}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aprobada">Aprobada</option>
                  <option value="Rechazada">Rechazada</option>
                </select>
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
