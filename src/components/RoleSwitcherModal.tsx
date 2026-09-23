import React from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  User,
  Check,
  Lock,
  ArrowRight,
  Receipt,
  Trash2,
  Edit2,
  Plus,
} from 'lucide-react';
import { UserRole, UserProfile, USER_ROLES_PROFILES } from '../types/auth';

interface RoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectRole: (role: UserRole) => void;
}

export const RoleSwitcherModal: React.FC<RoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectRole,
}) => {
  if (!isOpen) return null;

  const roles: UserRole[] = ['admin', 'empleado'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-emerald-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-800 text-emerald-200 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Control de Permisos y Roles de Usuario</h3>
              <p className="text-xs text-emerald-300/80">
                Distribuidora García · Política de Acceso Administrador vs. Empleados
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-850 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Roles List */}
        <div className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 text-xs">
            <strong>Regla de acceso del sistema:</strong> Los empleados únicamente tienen permiso para{' '}
            <strong className="text-emerald-800">generar facturas y realizar ventas</strong>. El
            Administrador cuenta con todos los permisos: agregar, editar, eliminar insumos, compras y auditoría total.
          </div>

          <div className="space-y-3">
            {roles.map((roleKey) => {
              const profile = USER_ROLES_PROFILES[roleKey];
              const isCurrent = currentUser.role === roleKey;

              return (
                <div
                  key={roleKey}
                  onClick={() => {
                    onSelectRole(roleKey);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    isCurrent
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                          roleKey === 'admin'
                            ? 'bg-emerald-900 text-white'
                            : 'bg-sky-800 text-white'
                        }`}
                      >
                        {roleKey === 'admin' ? 'AG' : 'RG'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-stone-900 text-sm">
                            {profile.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              roleKey === 'admin'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {profile.roleTitle}
                          </span>
                        </div>
                        <span className="text-[11px] text-stone-500 font-mono">
                          {profile.email}
                        </span>
                      </div>
                    </div>

                    {isCurrent && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" />
                        <span>Perfil Activo</span>
                      </span>
                    )}
                  </div>

                  {/* Permissions Checklist */}
                  <div className="mt-3 pt-3 border-t border-stone-200/80 grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-bold text-emerald-900">
                        Generar Facturas y Ventas
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {profile.permissions.canCreateProduct ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      )}
                      <span className={profile.permissions.canCreateProduct ? 'text-stone-800 font-medium' : 'text-stone-400'}>
                        Agregar nuevos insumos
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {profile.permissions.canEditProduct ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      )}
                      <span className={profile.permissions.canEditProduct ? 'text-stone-800 font-medium' : 'text-stone-400'}>
                        Editar insumos y precios
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {profile.permissions.canDeleteProduct ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      )}
                      <span className={profile.permissions.canDeleteProduct ? 'text-red-700 font-medium' : 'text-stone-400'}>
                        Eliminar insumos del catálogo
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {profile.permissions.canRegisterEntries ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      )}
                      <span className={profile.permissions.canRegisterEntries ? 'text-stone-800 font-medium' : 'text-stone-400'}>
                        Registrar entradas / compras
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {profile.permissions.canAutoRestock ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      )}
                      <span className={profile.permissions.canAutoRestock ? 'text-stone-800 font-medium' : 'text-stone-400'}>
                        Reabastecimiento automático
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};
