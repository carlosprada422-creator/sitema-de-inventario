import React from 'react';
import {
  Scan,
  Plus,
  AlertTriangle,
  Package,
  ArrowLeftRight,
  BarChart3,
  QrCode,
  Shield,
  User,
  Lock,
  Receipt,
} from 'lucide-react';
import { UserProfile } from '../types/auth';

export type NavTab = 'catalog' | 'movements' | 'alerts' | 'reports' | 'labels';

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenScanner: () => void;
  onOpenNewProduct: () => void;
  onOpenInvoiceSale?: () => void;
  criticalAlertCount: number;
  currentUser: UserProfile;
  onOpenRoleSwitcher: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenScanner,
  onOpenNewProduct,
  onOpenInvoiceSale,
  criticalAlertCount,
  currentUser,
  onOpenRoleSwitcher,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-emerald-950 text-white border-b border-emerald-800/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectTab('catalog')}
              className="text-left group cursor-pointer focus:outline-none"
            >
              <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                Distribuidora García
              </span>
              <span className="block text-[11px] text-emerald-300/80 font-medium tracking-wider uppercase">
                Control de Insumos Agrícolas
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => onSelectTab('catalog')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'catalog'
                  ? 'border-emerald-400 text-white font-semibold'
                  : 'border-transparent text-emerald-200/80 hover:text-white hover:border-emerald-500/50'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inventario</span>
            </button>

            <button
              onClick={() => onSelectTab('movements')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'movements'
                  ? 'border-emerald-400 text-white font-semibold'
                  : 'border-transparent text-emerald-200/80 hover:text-white hover:border-emerald-500/50'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Entradas y Salidas</span>
            </button>

            <button
              onClick={() => onSelectTab('alerts')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 relative ${
                activeTab === 'alerts'
                  ? 'border-emerald-400 text-white font-semibold'
                  : 'border-transparent text-emerald-200/80 hover:text-white hover:border-emerald-500/50'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Alertas de Stock</span>
              {criticalAlertCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-amber-500 text-emerald-950 rounded">
                  {criticalAlertCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('reports')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'reports'
                  ? 'border-emerald-400 text-white font-semibold'
                  : 'border-transparent text-emerald-200/80 hover:text-white hover:border-emerald-500/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Reportes Mensuales</span>
            </button>

            <button
              onClick={() => onSelectTab('labels')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'labels'
                  ? 'border-emerald-400 text-white font-semibold'
                  : 'border-transparent text-emerald-200/80 hover:text-white hover:border-emerald-500/50'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Etiquetas QR</span>
            </button>
          </nav>

          {/* Zone 3: Primary Actions and Role Profile */}
          <div className="flex items-center gap-2">
            {onOpenInvoiceSale && (
              <button
                onClick={onOpenInvoiceSale}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-amber-950 rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                title="Generar Factura y Despachar Venta a Cliente"
              >
                <Receipt className="w-4 h-4" />
                <span className="hidden sm:inline">Facturar / Venta</span>
                <span className="sm:hidden">Venta</span>
              </button>
            )}

            <button
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-lg transition-colors shadow-xs cursor-pointer whitespace-nowrap"
              title="Escanear código QR o de barras"
            >
              <Scan className="w-4 h-4" />
              <span className="hidden sm:inline">Escanear</span>
            </button>

            {currentUser.permissions.canCreateProduct ? (
              <button
                onClick={onOpenNewProduct}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg transition-colors border border-emerald-700 cursor-pointer whitespace-nowrap"
                title="Registrar nuevo insumo (Permiso Administrador)"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">Nuevo Insumo</span>
              </button>
            ) : (
              <button
                onClick={onOpenRoleSwitcher}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium bg-emerald-900/60 text-emerald-300/70 rounded-lg border border-emerald-800/60 cursor-pointer hover:bg-emerald-900"
                title="Creación de insumos restringida a Administrador (Empleado solo realiza ventas y facturación)"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Solo Admin</span>
              </button>
            )}

            {/* User Role Switcher Pill */}
            <button
              onClick={onOpenRoleSwitcher}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                currentUser.role === 'admin'
                  ? 'bg-emerald-900/90 border-emerald-700 text-white hover:bg-emerald-850'
                  : 'bg-sky-950/80 border-sky-700 text-sky-100 hover:bg-sky-900'
              }`}
              title="Haz clic para cambiar entre perfil Administrador y Empleado"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                  currentUser.role === 'admin' ? 'bg-emerald-500 text-emerald-950' : 'bg-sky-400 text-sky-950'
                }`}
              >
                {currentUser.role === 'admin' ? 'AG' : 'EB'}
              </div>
              <div className="text-left hidden sm:block">
                <span className="block font-semibold text-xs leading-none text-white">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-emerald-300/80 font-normal">
                  {currentUser.role === 'admin' ? '👑 Admin' : '👷 Empleado'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile secondary tab bar */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-2 border-t border-emerald-800/60 no-scrollbar">
          <button
            onClick={() => onSelectTab('catalog')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${
              activeTab === 'catalog' ? 'bg-emerald-800 text-white font-semibold' : 'text-emerald-200'
            }`}
          >
            Inventario
          </button>
          <button
            onClick={() => onSelectTab('movements')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${
              activeTab === 'movements' ? 'bg-emerald-800 text-white font-semibold' : 'text-emerald-200'
            }`}
          >
            Entradas y Salidas
          </button>
          <button
            onClick={() => onSelectTab('alerts')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${
              activeTab === 'alerts' ? 'bg-emerald-800 text-white font-semibold' : 'text-emerald-200'
            }`}
          >
            Alertas ({criticalAlertCount})
          </button>
          <button
            onClick={() => onSelectTab('reports')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${
              activeTab === 'reports' ? 'bg-emerald-800 text-white font-semibold' : 'text-emerald-200'
            }`}
          >
            Reportes
          </button>
          <button
            onClick={() => onSelectTab('labels')}
            className={`px-2.5 py-1 text-xs whitespace-nowrap rounded ${
              activeTab === 'labels' ? 'bg-emerald-800 text-white font-semibold' : 'text-emerald-200'
            }`}
          >
            Etiquetas
          </button>
        </div>
      </div>
    </header>
  );
};
