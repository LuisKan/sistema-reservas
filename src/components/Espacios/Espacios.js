import React, { useState, useEffect } from 'react';
import { espacioService } from '../../services/api';
import './Espacios.css';

const Espacios = () => {
  const [espacios, setEspacios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEspacio, setEditingEspacio] = useState(null);
  const [formData, setFormData] = useState({
    Nombre: '',
    Tipo: '',
    Ubicacion: '',
    Capacidad: ''
  });

  useEffect(() => {
    fetchEspacios();
  }, []);

  const fetchEspacios = async () => {
    try {
      setLoading(true);
      const response = await espacioService.getAll();
      setEspacios(response.data);
    } catch (error) {
      console.error('Error fetching espacios:', error);
      alert('Error al cargar los espacios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const espacioData = {
        ...formData,
        Capacidad: parseInt(formData.Capacidad)
      };

      if (editingEspacio) {
        await espacioService.update(editingEspacio.ID_Espacio || editingEspacio.id, espacioData);
      } else {
        await espacioService.create(espacioData);
      }
      
      fetchEspacios();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving espacio:', error);
      alert('Error al guardar el espacio');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este espacio?')) {
      try {
        await espacioService.delete(id);
        fetchEspacios();
      } catch (error) {
        console.error('Error deleting espacio:', error);
        alert('Error al eliminar el espacio');
      }
    }
  };

  const handleEdit = (espacio) => {
    setEditingEspacio(espacio);
    setFormData({
      Nombre: espacio.Nombre,
      Tipo: espacio.Tipo,
      Ubicacion: espacio.Ubicacion,
      Capacidad: espacio.Capacidad.toString()
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      Nombre: '',
      Tipo: '',
      Ubicacion: '',
      Capacidad: ''
    });
    setEditingEspacio(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  if (loading) {
    return <div className="loading">Cargando espacios...</div>;
  }

  return (
    <div className="espacios">
      <div className="espacios-header">
        <h1>Gestión de Espacios</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          Nuevo Espacio
        </button>
      </div>

      <div className="espacios-grid">
        {espacios.map((espacio) => (
          <div key={espacio.ID_Espacio || espacio.id} className="espacio-card">
            <div className="espacio-header">
              <h3>{espacio.Nombre}</h3>
              <span className="espacio-tipo">{espacio.Tipo}</span>
            </div>
            <div className="espacio-info">
              <p><strong>Ubicación:</strong> {espacio.Ubicacion}</p>
              <p><strong>Capacidad:</strong> {espacio.Capacidad} personas</p>
              <p><strong>Creado:</strong> {formatDate(espacio.FechaCreacion)}</p>
            </div>
            <div className="espacio-actions">
              <button 
                className="btn btn-sm btn-edit"
                onClick={() => handleEdit(espacio)}
              >
                Editar
              </button>
              <button 
                className="btn btn-sm btn-delete"
                onClick={() => handleDelete(espacio.ID_Espacio || espacio.id)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {espacios.length === 0 && !loading && (
        <div className="empty-state">
          <p>No hay espacios registrados</p>
          <button 
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            Crear primer espacio
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingEspacio ? 'Editar Espacio' : 'Nuevo Espacio'}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  value={formData.Nombre}
                  onChange={(e) => setFormData({...formData, Nombre: e.target.value})}
                  placeholder="Ej: Aula 402"
                  required
                />
              </div>
              <div className="form-group">
                <label>Tipo:</label>
                <select
                  value={formData.Tipo}
                  onChange={(e) => setFormData({...formData, Tipo: e.target.value})}
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  <option value="Aula">Aula</option>
                  <option value="Laboratorio">Laboratorio</option>
                  <option value="Auditorio">Auditorio</option>
                  <option value="Sala de Reuniones">Sala de Reuniones</option>
                  <option value="Biblioteca">Biblioteca</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="form-group">
                <label>Ubicación:</label>
                <input
                  type="text"
                  value={formData.Ubicacion}
                  onChange={(e) => setFormData({...formData, Ubicacion: e.target.value})}
                  placeholder="Ej: Edificio B, Piso 4"
                  required
                />
              </div>
              <div className="form-group">
                <label>Capacidad:</label>
                <input
                  type="number"
                  value={formData.Capacidad}
                  onChange={(e) => setFormData({...formData, Capacidad: e.target.value})}
                  placeholder="Número de personas"
                  min="1"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEspacio ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Espacios;
