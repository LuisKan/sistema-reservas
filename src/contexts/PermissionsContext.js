import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

// Crear el contexto de permisos
const PermissionsContext = createContext();

// Definición de permisos por rol
const rolePermissions = {
  administrador: {
    reservas: { view: true, create: true, edit: true, delete: true },
    espacios: { view: true, create: true, edit: true, delete: true },
    roles: { view: true, create: true, edit: true, delete: true },
    usuarios: { view: true, create: true, edit: true, delete: true, viewAll: true }
  },
  profesor: {
    reservas: { view: true, create: true, edit: false, delete: false },
    espacios: { view: true, create: false, edit: false, delete: false },
    roles: { view: true, create: false, edit: false, delete: false },
    usuarios: { view: true, create: false, edit: true, delete: false, viewAll: false }
  },
  ayudante: {
    reservas: { view: true, create: true, edit: false, delete: false },
    espacios: { view: true, create: false, edit: false, delete: false },
    roles: { view: false, create: false, edit: false, delete: false },
    usuarios: { view: true, create: false, edit: true, delete: false, viewAll: false }
  },
  // Permisos para otros roles (por defecto)
  default: {
    reservas: { view: true, create: false, edit: false, delete: false },
    espacios: { view: true, create: false, edit: false, delete: false },
    roles: { view: true, create: false, edit: false, delete: false },
    usuarios: { view: true, create: false, edit: true, delete: false, viewAll: false }
  }
};

// Proveedor de permisos
export const PermissionsProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Función para verificar si un usuario tiene un permiso específico
  const hasPermission = (module, action) => {
    // Si no hay usuario, no tiene permisos
    if (!user) return false;
    
    // Obtener rol del usuario (normalizado a minúsculas)
    const userRole = (user.Rol || '').toLowerCase();
    console.log(`[Permisos] Verificando permisos para rol: "${userRole}", módulo: "${module}", acción: "${action}"`);
    
    // Obtener permisos según el rol
    const permissions = 
      rolePermissions[userRole] || 
      rolePermissions.default;
    
    const hasPermission = permissions[module] && permissions[module][action] === true;
    console.log(`[Permisos] ¿Tiene permiso?: ${hasPermission}`);
    
    // Verificar si el módulo y la acción existen en los permisos
    return hasPermission;
  };
  
  // Verificar si el usuario puede ver/editar un registro específico
  const canAccessRecord = (module, record, action) => {
    // Si no hay usuario, no tiene permisos
    if (!user) return false;
    
    // Obtener rol del usuario (normalizado a minúsculas)
    const userRole = (user.Rol || '').toLowerCase();
    
    console.log(`[PermissionsContext] Verificando acceso a registro específico: módulo=${module}, acción=${action}`);
    console.log(`[PermissionsContext] Usuario actual:`, user);
    console.log(`[PermissionsContext] Registro a verificar:`, record);
    
    // Si es administrador, siempre tiene acceso
    if (userRole === 'administrador') {
      console.log('[PermissionsContext] Es administrador, acceso permitido');
      return true;
    }
    
    // Para el módulo de usuarios, verificar si es el propio usuario
    if (module === 'usuarios') {
      // Verificar coincidencia por ID o por correo electrónico (más fiable)
      const userIdMatches = record && (
        String(record.id || '') === String(user.id || '') ||
        String(record.ID_Usuario || '') === String(user.ID_Usuario || '') ||
        String(record.id || '') === String(user.ID_Usuario || '') ||
        String(record.ID_Usuario || '') === String(user.id || '')
      );
      
      const emailMatches = record && 
        record.Correo && 
        user.Correo && 
        record.Correo.toLowerCase() === user.Correo.toLowerCase();
        
      const isOwnRecord = userIdMatches || emailMatches;
      
      console.log(`[PermissionsContext] ¿Coincide ID?: ${userIdMatches}`);
      console.log(`[PermissionsContext] ¿Coincide email?: ${emailMatches}`);
      console.log(`[PermissionsContext] ¿Es registro propio?: ${isOwnRecord}`);
      
      // Solo puede ver/editar su propio registro
      if (action === 'view' || action === 'edit') {
        const hasAccess = isOwnRecord;
        console.log(`[PermissionsContext] Acceso para ${action}: ${hasAccess}`);
        return hasAccess;
      }
      
      // No puede eliminar ningún usuario
      if (action === 'delete') {
        console.log('[PermissionsContext] No puede eliminar usuarios');
        return false;
      }
    }
    
    // Para otros módulos, usar los permisos del rol
    const hasAccess = hasPermission(module, action);
    console.log(`[PermissionsContext] Usando permisos de rol: ${hasAccess}`);
    return hasAccess;
  };
  
  // Valores que se proveerán a través del contexto
  const userRole = user ? (user.Rol || '').toLowerCase() : '';
  const isAdmin = userRole === 'administrador';
  
  // Imprimir información de debug
  console.log(`[Permisos] Usuario actual:`, user ? `${user.Nombre} (${user.Correo})` : 'No autenticado');
  console.log(`[Permisos] Rol detectado: "${userRole}"`);
  console.log(`[Permisos] ¿Es administrador?: ${isAdmin}`);
  
  const value = {
    hasPermission,
    canAccessRecord,
    isAdmin,
    userRole
  };
  
  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

// Hook personalizado para usar el contexto de permisos
export const usePermissions = () => {
  return useContext(PermissionsContext);
};

export default PermissionsContext;
