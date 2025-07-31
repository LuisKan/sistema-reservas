import React, { useState, useEffect } from 'react';
import { rolService } from '../../services/api';
import './Roles.css';

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRol, setEditingRol] = useState(null);
  const [formData, setFormData] = useState({
    Nombre: ''
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await rolService.getAll();
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
      alert('Error al cargar los roles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRol) {
        await rolService.update(editingRol.ID_Rol || editingRol.id, formData);
      } else {
        await rolService.create(formData);
      }
      
      fetchRoles();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving rol:', error);
      alert('Error al guardar el rol');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este rol?')) {
      try {
        await rolService.delete(id);
        fetchRoles();
      } catch (error) {
        console.error('Error deleting rol:', error);
        alert('Error al eliminar el rol');
      }
    }
  };

  const handleEdit = (rol) => {
    setEditingRol(rol);
    setFormData({
      Nombre: rol.Nombre
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      Nombre: ''
    });
    setEditingRol(null);
  };

  if (loading) {
    return <div className="loading">Cargando roles...</div>;
  }

  return (
    <div className="roles">
      <div className="roles-header">
        <h1>Gestión de Roles</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          Nuevo Rol
        </button>
      </div>

      <div className="roles-grid">
        {roles.map((rol) => (
          <div key={rol.ID_Rol || rol.id} className="rol-card">
            <div className="rol-header">
              <h3>{rol.Nombre}</h3>
              <span className="rol-id">ID: {rol.ID_Rol || rol.id}</span>
            </div>
            <div className="rol-actions">
              <button 
                className="btn btn-sm btn-edit"
                onClick={() => handleEdit(rol)}
              >
                Editar
              </button>
              <button 
                className="btn btn-sm btn-delete"
                onClick={() => handleDelete(rol.ID_Rol || rol.id)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {roles.length === 0 && !loading && (
        <div className="empty-state">
          <p>No hay roles registrados</p>
          <button 
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            Crear primer rol
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingRol ? 'Editar Rol' : 'Nuevo Rol'}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nombre del Rol:</label>
                <input
                  type="text"
                  value={formData.Nombre}
                  onChange={(e) => setFormData({...formData, Nombre: e.target.value})}
                  placeholder="Ej: Administrador, Profesor, Estudiante"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRol ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;
