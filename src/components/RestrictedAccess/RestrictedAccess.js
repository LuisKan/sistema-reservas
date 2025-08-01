import React from 'react';
import { usePermissions } from '../../contexts/PermissionsContext';
import { useAuth } from '../../contexts/AuthContext';

const RestrictedAccess = ({ 
  module,
  action,
  record,
  fallback,
  children
}) => {
  const { hasPermission, canAccessRecord, userRole, isAdmin } = usePermissions();
  const { user } = useAuth();
  
  console.log(`[RestrictedAccess] Verificando acceso: módulo=${module}, acción=${action}`);
  console.log(`[RestrictedAccess] Usuario: ${user?.Nombre}, Rol: ${user?.Rol}, isAdmin: ${isAdmin}`);
  
  let hasAccess = false;
  
  // Si se proporciona un registro específico, verificamos el acceso a ese registro
  if (record) {
    console.log(`[RestrictedAccess] Verificando acceso a registro específico:`, record);
    hasAccess = canAccessRecord(module, record, action);
  } 
  // Si no hay registro, verificamos el permiso general
  else {
    hasAccess = hasPermission(module, action);
  }
  
  console.log(`[RestrictedAccess] Resultado: ${hasAccess ? 'ACCESO PERMITIDO' : 'ACCESO DENEGADO'}`);
  
  // Si tiene permiso, renderizamos los hijos
  if (hasAccess) {
    return children;
  } else {
    return fallback || null;
  }
};

export default RestrictedAccess;
