import React from 'react';
import { usePermissions } from '../../contexts/PermissionsContext';

// Componente para renderizar condicionalmente según permisos
const RestrictedAccess = ({ 
  module, 
  action, 
  record = null,
  children,
  fallback = null
}) => {
  const { hasPermission, canAccessRecord } = usePermissions();
  
  const hasAccess = record 
    ? canAccessRecord(module, record, action) 
    : hasPermission(module, action);
  
  return hasAccess ? children : fallback;
};

export default RestrictedAccess;
