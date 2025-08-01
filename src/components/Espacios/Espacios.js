import React, { useState, useEffect } from 'react';
import { espacioService } from '../../services/api';
import { usePermissions } from '../../contexts/PermissionsContext';
import RestrictedAccess from '../RestrictedAccess/RestrictedAccess';
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
  const { hasPermission } = usePermissions();

  useEffect(() => {
    fetchEspacios();
  }, []);

  const fetchEspacios = async () => {
    try {
      setLoading(true);
      const response = await espacioService.getAll();
      
      console.log('[Espacios] Datos recibidos del backend:', response.data);
      
      // Procesar los espacios para asegurar que tienen fechas válidas
      const espaciosProcesados = response.data.map(espacio => {
        // Si no hay fecha de creación o es inválida, asignamos la fecha actual
        if (!espacio.FechaCreacion || 
            espacio.FechaCreacion === 'undefined' || 
            isNaN(new Date(espacio.FechaCreacion).getTime())) {
          console.log(`[Espacios] Fecha inválida para espacio ${espacio.Nombre}, asignando fecha actual`);
          return {
            ...espacio,
            FechaCreacion: new Date().toISOString()
          };
        }
        return espacio;
      });
      
      setEspacios(espaciosProcesados);
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
      // Verificar que todos los campos requeridos estén presentes
      if (!formData.Nombre || !formData.Tipo || !formData.Ubicacion || !formData.Capacidad) {
        alert('Por favor complete todos los campos requeridos');
        return;
      }
      
      // Asegurarnos de que la capacidad sea un número
      const capacidad = parseInt(formData.Capacidad);
      if (isNaN(capacidad) || capacidad <= 0) {
        alert('La capacidad debe ser un número mayor que cero');
        return;
      }
      
      // Crear objeto con el formato exacto que espera el backend
      const espacioData = {
        Nombre: formData.Nombre,
        Tipo: formData.Tipo,
        Ubicacion: formData.Ubicacion,
        Capacidad: capacidad
      };
      
      console.log('[Espacios] Datos a enviar:', espacioData);

      if (editingEspacio) {
        const id = editingEspacio.ID_Espacio || editingEspacio.id;
        console.log(`[Espacios] Actualizando espacio con ID: ${id}`);
        await espacioService.update(id, espacioData);
      } else {
        console.log('[Espacios] Creando nuevo espacio');
        await espacioService.create(espacioData);
      }
      
      fetchEspacios();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving espacio:', error);
      alert('Error al guardar el espacio: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    try {
      await espacioService.delete(id);
      fetchEspacios();
    } catch (error) {
      console.error('Error deleting espacio:', error);
      alert('Error al eliminar el espacio');
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
    // Si no hay fecha o la fecha es inválida
    if (!dateString || dateString === 'undefined' || dateString === 'null') {
      return "Fecha no disponible";
    }
    
    try {
      const date = new Date(dateString);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.error('[Espacios] Fecha inválida:', dateString);
        return "Fecha inválida";
      }
      
      // Formatear la fecha como día/mes/año
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('[Espacios] Error al formatear fecha:', error);
      return "Error en formato de fecha";
    }
  };

  if (loading) {
    return <div className="loading">Cargando espacios...</div>;
  }

  return (
    <div className="espacios">
      <div className="espacios-header">
        <h1>Gestión de Espacios</h1>
        <RestrictedAccess 
          module="espacios" 
          action="create"
          fallback={null}
        >
          <button 
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            Nuevo Espacio
          </button>
        </RestrictedAccess>
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
              {/* Mostrar fecha en formato ISO para depuración si es necesario */}
              {/* <p className="debug-info">Fecha ISO: {espacio.FechaCreacion}</p> */}
            </div>
            <div className="espacio-actions">
              <RestrictedAccess
                module="espacios"
                action="edit"
              >
                <button 
                  className="btn btn-sm btn-edit"
                  onClick={() => handleEdit(espacio)}
                >
                  Editar
                </button>
              </RestrictedAccess>
              
              <RestrictedAccess
                module="espacios"
                action="delete"
              >
                <button 
                  className="btn btn-sm btn-delete"
                  onClick={() => handleDelete(espacio.ID_Espacio || espacio.id)}
                >
                  Eliminar
                </button>
              </RestrictedAccess>
            </div>
          </div>
        ))}
      </div>

      {espacios.length === 0 && !loading && (
        <div className="empty-state">
          <p>No hay espacios registrados</p>
          <RestrictedAccess 
            module="espacios" 
            action="create"
            fallback={null}
          >
            <button 
              className="btn btn-primary"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              Crear primer espacio
            </button>
          </RestrictedAccess>
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
