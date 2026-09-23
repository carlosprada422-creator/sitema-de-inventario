export type UserRole = 'admin' | 'empleado';

export interface UserPermissions {
  canSellAndInvoice: boolean;       // Realizar ventas y emitir facturas
  canRegisterEntries: boolean;      // Registrar entradas de insumos (Solo Admin)
  canCreateProduct: boolean;        // Crear insumos agrícolas (Solo Admin)
  canEditProduct: boolean;          // Editar fichas, costos y precios (Solo Admin)
  canDeleteProduct: boolean;        // Eliminar insumos (Solo Admin)
  canAutoRestock: boolean;          // Reabastecimiento masivo automático (Solo Admin)
  canResetDatabase: boolean;        // Restablecer base de datos (Solo Admin)
  canManageAllMovements: boolean;   // Acceso a auditoría completa de movimientos (Solo Admin)
  canScanBarcodes: boolean;         // Escanear códigos para consulta y ventas
  canExportMonthlyReports: boolean; // Reportes mensuales gerenciales (Solo Admin)
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  roleTitle: string;
  badgeColor: string;
  email: string;
  permissions: UserPermissions;
}

export const USER_ROLES_PROFILES: Record<UserRole, UserProfile> = {
  admin: {
    id: 'user-admin',
    name: 'Ing. Carlos García',
    role: 'admin',
    roleTitle: 'Administrador General',
    badgeColor: 'bg-emerald-500 text-emerald-950',
    email: 'carlos.garcia@distribuidoragarcia.com',
    permissions: {
      canSellAndInvoice: true,
      canRegisterEntries: true,
      canCreateProduct: true,
      canEditProduct: true,
      canDeleteProduct: true,
      canAutoRestock: true,
      canResetDatabase: true,
      canManageAllMovements: true,
      canScanBarcodes: true,
      canExportMonthlyReports: true,
    },
  },
  empleado: {
    id: 'user-empleado',
    name: 'Roberto Gómez',
    role: 'empleado',
    roleTitle: 'Empleado de Ventas y Facturación',
    badgeColor: 'bg-sky-500 text-sky-950',
    email: 'roberto.gomez@distribuidoragarcia.com',
    permissions: {
      canSellAndInvoice: true,       // PERMITIDO: Generar facturas y realizar ventas
      canRegisterEntries: false,     // RESTRINGIDO: No puede registrar entradas de inventario
      canCreateProduct: false,       // RESTRINGIDO: No puede crear insumos
      canEditProduct: false,         // RESTRINGIDO: No puede editar precios ni costos
      canDeleteProduct: false,       // RESTRINGIDO: No puede eliminar
      canAutoRestock: false,         // RESTRINGIDO: No puede autorizar compras
      canResetDatabase: false,       // RESTRINGIDO: No puede restablecer base de datos
      canManageAllMovements: false,  // RESTRINGIDO: Solo consulta movimientos propios
      canScanBarcodes: true,         // PERMITIDO: Para escanear y agregar a la venta
      canExportMonthlyReports: false,// RESTRINGIDO: Reportes financieros exclusivos de administración
    },
  },
};
