import React, { useState, useEffect } from 'react';
import { usuarioService, rolService } from '../../services/api';
import './Usuarios.css';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [formData, setFormData] = useState({
    Nombre: '',
    Apellido: '',
    Correo: '',
    Contraseña: '',
    Rol: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usuariosRes, rolesRes] = await Promise.all([
        usuarioService.getAll(),
        rolService.getAll()
      ]);
      
      // Debug: Ver la estructura de los datos
      console.log('Usuarios completos:', JSON.stringify(usuariosRes.data, null, 2));
      console.log('Roles completos:', JSON.stringify(rolesRes.data, null, 2));
      console.log('Primer usuario:', usuariosRes.data[0]);
      console.log('Primer rol:', rolesRes.data[0]);
      
      setUsuarios(usuariosRes.data);
      setRoles(rolesRes.data);
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
      if (editingUsuario) {
        // Obtener el usuario actual para mantener los campos que no queremos modificar
        const usuarioActual = await usuarioService.getById(editingUsuario.ID_Usuario || editingUsuario.id);
        console.log('Usuario actual obtenido del API:', JSON.stringify(usuarioActual.data, null, 2));
        
        // Buscar el nombre del rol basado en su ID
        let rolNombre = '';
        if (formData.Rol) {
          const rolSeleccionado = roles.find(r => (r.ID_Rol || r.id) == formData.Rol);
          rolNombre = rolSeleccionado ? rolSeleccionado.Nombre : '';
        }

        // Mantener la estructura exacta del objeto que regresa el API
        // pero actualizar solo los campos que estamos editando
        const updateData = {
          ...usuarioActual.data,  // Mantener la estructura original
          Nombre: formData.Nombre,
          Apellido: formData.Apellido,
          Correo: formData.Correo,
          Rol: rolNombre
        };
        
        // Solo agregar contraseña si se ha modificado
        if (formData.Contraseña) {
          updateData.Contraseña = formData.Contraseña;
        }
        
        // Eliminar campos que pueden causar problemas
        delete updateData.FechaCreacion;
        
        console.log('Enviando datos de actualización:', JSON.stringify(updateData, null, 2));
        await usuarioService.update(updateData.ID_Usuario, updateData);
      } else {
        // Buscar el nombre del rol basado en su ID para nuevos usuarios también
        let rolNombre = '';
        if (formData.Rol) {
          const rolSeleccionado = roles.find(r => (r.ID_Rol || r.id) == formData.Rol);
          rolNombre = rolSeleccionado ? rolSeleccionado.Nombre : '';
        }

        const newUserData = {
          Nombre: formData.Nombre,
          Apellido: formData.Apellido,
          Correo: formData.Correo,
          Contraseña: formData.Contraseña,
          Rol: rolNombre  // Usar el nombre del rol, no el ID
        };
        console.log('Creando nuevo usuario con datos:', JSON.stringify(newUserData, null, 2));
        await usuarioService.create(newUserData);
      }
      
      fetchData();
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving usuario:', error);
      alert('Error al guardar el usuario');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        await usuarioService.delete(id);
        fetchData();
      } catch (error) {
        console.error('Error deleting usuario:', error);
        alert('Error al eliminar el usuario');
      }
    }
  };

  const handleEdit = (usuario) => {
    console.log('Usuario a editar:', JSON.stringify(usuario, null, 2));
    setEditingUsuario(usuario);
    
    // Buscar el ID del rol correspondiente al nombre de rol del usuario
    let rolId = '';
    if (usuario.Rol && typeof usuario.Rol === 'string') {
      const rolEncontrado = roles.find(r => r.Nombre === usuario.Rol);
      rolId = rolEncontrado ? (rolEncontrado.ID_Rol || rolEncontrado.id) : '';
    } else {
      rolId = usuario.ID_Rol || usuario.RolId || '';
    }
    
    setFormData({
      Nombre: usuario.Nombre,
      Apellido: usuario.Apellido,
      Correo: usuario.Correo,
      Contraseña: '', // Dejamos en blanco para que no se cambie a menos que se introduzca un nuevo valor
      Rol: rolId
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      Nombre: '',
      Apellido: '',
      Correo: '',
      Contraseña: '',
      Rol: ''
    });
    setEditingUsuario(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getRolNombre = (usuario) => {
    // Buscar el rol por diferentes posibles campos
    const rolId = usuario.ID_Rol || usuario.RolId || usuario.Rol;
    if (!rolId) return 'Sin asignar';
    
    // Si el rol ya es un string (nombre), devolverlo
    if (typeof rolId === 'string' && isNaN(rolId)) {
      return rolId;
    }
    
    // Buscar el rol en la lista de roles por ID
    const rol = roles.find(r => (r.ID_Rol || r.id) === rolId);
    return rol ? rol.Nombre : 'Sin asignar';
  };

  if (loading) {
    return <div className="loading">Cargando usuarios...</div>;
  }

  return (
    <div className="usuarios">
      <div className="usuarios-header">
        <h1>Gestión de Usuarios</h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          Nuevo Usuario
        </button>
      </div>

      <div className="usuarios-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Fecha Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.ID_Usuario || usuario.id}>
                <td>{usuario.ID_Usuario || usuario.id}</td>
                <td>{usuario.Nombre}</td>
                <td>{usuario.Apellido}</td>
                <td>{usuario.Correo}</td>
                <td>
                  <span className="rol-badge">
                    {getRolNombre(usuario)}
                  </span>
                </td>
                <td>{formatDate(usuario.FechaCreacion)}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="btn btn-sm btn-edit"
                      onClick={() => handleEdit(usuario)}
                    >
                      Editar
                    </button>
                    <button 
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDelete(usuario.ID_Usuario || usuario.id)}
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
              <h2>{editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
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
                  required
                />
              </div>
              <div className="form-group">
                <label>Apellido:</label>
                <input
                  type="text"
                  value={formData.Apellido}
                  onChange={(e) => setFormData({...formData, Apellido: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Correo:</label>
                <input
                  type="email"
                  value={formData.Correo}
                  onChange={(e) => setFormData({...formData, Correo: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contraseña:</label>
                <input
                  type="password"
                  value={formData.Contraseña}
                  onChange={(e) => setFormData({...formData, Contraseña: e.target.value})}
                  required={!editingUsuario}
                  placeholder={editingUsuario ? "Dejar en blanco para mantener actual" : ""}
                />
              </div>
              <div className="form-group">
                <label>Rol:</label>
                <select
                  value={formData.Rol || ''}
                  onChange={(e) => setFormData({...formData, Rol: e.target.value})}
                >
                  <option value="">Seleccionar rol</option>
                  {roles.map(rol => (
                    <option key={rol.ID_Rol || rol.id} value={rol.ID_Rol || rol.id}>
                      {rol.Nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUsuario ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
