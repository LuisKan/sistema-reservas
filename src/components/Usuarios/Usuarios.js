import React, { useState, useEffect } from 'react';
import { usuarioService, rolService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../contexts/PermissionsContext';
import RestrictedAccess from '../RestrictedAccess/RestrictedAccess';
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
  const { user, setUser } = useAuth();
  const { isAdmin, hasPermission } = usePermissions();

  useEffect(() => {
    console.log('[Usuarios] Componente iniciado. Usuario actual:', user);
    console.log('[Usuarios] ¿Es admin?:', isAdmin);
    fetchData();
  }, [user, isAdmin]);

  const fetchData = async () => {
      try {
      setLoading(true);
      const [usuariosRes, rolesRes] = await Promise.all([
        usuarioService.getAll(),
        rolService.getAll()
      ]);
      
      // Debug: Ver la estructura de los datos y asegurar que el correo se está recibiendo
      console.log('Usuarios completos:', JSON.stringify(usuariosRes.data, null, 2));
      console.log('Roles completos:', JSON.stringify(rolesRes.data, null, 2));
      console.log('Usuario actual:', JSON.stringify(user, null, 2));
      
      // Asegurarnos de que todos los usuarios tienen un campo de correo accesible
      const usuariosNormalizados = usuariosRes.data.map(usuario => {
        // Normalizar el usuario para asegurar que todos los campos tienen un valor consistente
        return {
          ...usuario,
          ID_Usuario: usuario.ID_Usuario || usuario.id || 0,
          id: usuario.id || usuario.ID_Usuario || 0,
          Nombre: usuario.Nombre || '',
          Apellido: usuario.Apellido || '',
          // Asegurar que el correo siempre esté presente y con formato correcto
          Correo: usuario.Correo || usuario.correo || usuario.Email || usuario.email || '',
          Rol: usuario.Rol || usuario.rol || '',
          FechaCreacion: usuario.FechaCreacion || usuario.fechaCreacion || new Date().toISOString()
        };
      });
      
      console.log('Usuarios normalizados:', JSON.stringify(usuariosNormalizados, null, 2));
      
      // Si el usuario no es administrador, filtrar solo su propio usuario
      if (!isAdmin && user) {
        console.log('[Usuarios] No es admin, filtrando solo el usuario actual');
        console.log('[Usuarios] Usuario actual:', user);
        
        // Convertir el correo a minúsculas para comparación no sensible a mayúsculas/minúsculas
        const currentUserEmail = user.Correo?.toLowerCase();
        console.log('[Usuarios] Buscando usuario con correo:', currentUserEmail);
        
        // Manejar casos donde los campos ID pueden ser diferentes entre las fuentes
        let filteredUsuarios = [];
        
        if (currentUserEmail) {
          filteredUsuarios = usuariosNormalizados.filter(u => {
            // Convertir todos los campos posibles a strings para comparación
            const userId = String(u.id || u.ID_Usuario || '').toLowerCase();
            const currentId = String(user.id || user.ID_Usuario || '').toLowerCase();
            const uEmail = String(u.Correo || '').toLowerCase();
            
            const matchesId = userId === currentId;
            const matchesEmail = uEmail === currentUserEmail;
            
            console.log(`[Usuarios] Comparando: ${u.Nombre} (ID: ${userId}, Email: ${uEmail}) con usuario actual (ID: ${currentId}, Email: ${currentUserEmail})`);
            console.log(`[Usuarios] Coincide ID: ${matchesId}, Coincide Email: ${matchesEmail}`);
            
            return matchesId || matchesEmail;
          });
        }
        
        if (filteredUsuarios.length === 0) {
          console.log('[Usuarios] ¡Alerta! No se encontró al usuario actual en la lista. Creando registro con datos locales.');
          // Si no se encuentra el usuario, usamos los datos del localStorage para mostrar al usuario actual
          if (user) {
            const userToShow = {
              ...user,
              id: user.id || user.ID_Usuario || 4, // Asumimos un ID si no hay uno
              ID_Usuario: user.ID_Usuario || user.id || 4,
              Nombre: user.Nombre || '',
              Apellido: user.Apellido || '',
              Correo: user.Correo || user.correo || user.Email || user.email || '', // Asegurar que el correo esté presente
              Rol: user.Rol || '',
              FechaCreacion: user.FechaCreacion || new Date().toISOString()
            };
            console.log('[Usuarios] Usando datos del usuario de sesión:', userToShow);
            setUsuarios([userToShow]);
          } else {
            // Solo si realmente no hay datos de usuario disponibles
            console.error('[Usuarios] No hay datos de usuario disponibles');
            setUsuarios([]);
          }
        } else {
          console.log('[Usuarios] Usuarios filtrados encontrados:', filteredUsuarios);
          setUsuarios(filteredUsuarios);
        }
      } else {
        console.log('[Usuarios] Es admin o no hay usuario, mostrando todos los usuarios');
        setUsuarios(usuariosNormalizados);
      }      setRoles(rolesRes.data);
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
          // Asegurar que el correo tenga el formato correcto según la API
          Correo: formData.Correo,
          // En caso de que la API use otras propiedades para el correo
          correo: formData.Correo,
          Email: formData.Correo,
          email: formData.Correo,
          Rol: rolNombre
        };
        
        // Solo agregar contraseña si se ha modificado
        if (formData.Contraseña) {
          updateData.Contraseña = formData.Contraseña;
        }
        
        // Eliminar campos que pueden causar problemas
        delete updateData.FechaCreacion;
        
        console.log('Enviando datos de actualización:', JSON.stringify(updateData, null, 2));
        const response = await usuarioService.update(updateData.ID_Usuario, updateData);
        
        // Verificar si el usuario está actualizando su propio perfil
        // y actualizar localStorage para reflejar los cambios inmediatamente
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isCurrentUser = 
          String(currentUser.ID_Usuario) === String(updateData.ID_Usuario) ||
          String(currentUser.id) === String(updateData.ID_Usuario) ||
          (currentUser.Correo && updateData.Correo && 
           currentUser.Correo.toLowerCase() === updateData.Correo.toLowerCase());
        
        if (isCurrentUser) {
          console.log('[Usuarios] Usuario actualizando su propio perfil, actualizando localStorage');
          // Mantener los campos originales pero actualizar con los nuevos datos
          const updatedUser = {
            ...currentUser,
            Nombre: updateData.Nombre,
            Apellido: updateData.Apellido,
            Correo: updateData.Correo,
            Rol: updateData.Rol
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Actualizar el estado global del usuario
          setUser(updatedUser);
          
          console.log('[Usuarios] localStorage actualizado con:', updatedUser);
        }
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
    try {
      await usuarioService.delete(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting usuario:', error);
      alert('Error al eliminar el usuario');
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
    
    // Asegurarnos que el correo esté presente, buscando en diferentes posibles propiedades
    const correo = usuario.Correo || usuario.correo || usuario.Email || usuario.email || '';
    console.log(`[Usuarios] Correo detectado para edición: ${correo}`);
    
    setFormData({
      Nombre: usuario.Nombre,
      Apellido: usuario.Apellido,
      Correo: correo,
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
    if (!dateString) return 'Fecha no disponible';
    
    try {
      const date = new Date(dateString);
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Fecha no válida';
      }
      return date.toLocaleDateString('es-ES');
    } catch (error) {
      console.error('[Usuarios] Error al formatear fecha:', error);
      return 'Error en fecha';
    }
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
        <RestrictedAccess 
          module="usuarios" 
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
            Nuevo Usuario
          </button>
        </RestrictedAccess>
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
                <td>{usuario.Correo || usuario.correo || usuario.Email || usuario.email || 'No disponible'}</td>
                <td>
                  <span className="rol-badge">
                    {getRolNombre(usuario)}
                  </span>
                </td>
                <td>{formatDate(usuario.FechaCreacion)}</td>
                <td>
                  <div className="action-buttons">
                    {/* Siempre permitimos que un usuario pueda editar su propio perfil */}
                    <button 
                      className="btn btn-sm btn-edit"
                      onClick={() => handleEdit(usuario)}
                    >
                      Editar
                    </button>
                    
                    {/* Solo mostramos el botón eliminar para administradores */}
                    <RestrictedAccess
                      module="usuarios"
                      action="delete"
                      record={usuario}
                    >
                      <button 
                        className="btn btn-sm btn-delete"
                        onClick={() => handleDelete(usuario.ID_Usuario || usuario.id)}
                      >
                        Eliminar
                      </button>
                    </RestrictedAccess>
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
