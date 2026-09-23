import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Eye,
  QrCode,
  Edit2,
  Trash2,
  Plus,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  DollarSign,
  PackageCheck,
  CheckCircle2,
} from 'lucide-react';
import { Product, ProductCategory, CATEGORIES_CONFIG } from '../types/inventory';
import { UserProfile } from '../types/auth';
import { formatCurrency, formatDate } from '../utils/barcodeUtils';

interface ProductCatalogProps {
  products: Product[];
  onOpenQuickMovement: (product: Product, type: 'ENTRADA' | 'SALIDA') => void;
  onOpenProductDetails: (product: Product) => void;
  onOpenPrintLabel: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
  onOpenNewProduct: () => void;
  onOpenScanner: () => void;
  currentUser?: UserProfile;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  onOpenQuickMovement,
  onOpenProductDetails,
  onOpenPrintLabel,
  onEditProduct,
  onDeleteProduct,
  onOpenNewProduct,
  onOpenScanner,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low_stock' | 'expiring'>('all');

  // Calculate high-level summary KPIs
  const metrics = useMemo(() => {
    let totalStockUnits = 0;
    let totalValuation = 0;
    let lowStockCount = 0;
    let expiringCount = 0;

    const now = new Date();
    const sixtyDays = new Date();
    sixtyDays.setDate(now.getDate() + 60);

    for (const p of products) {
      totalStockUnits += p.currentStock;
      totalValuation += p.currentStock * p.unitCost;
      if (p.currentStock <= p.minStock) {
        lowStockCount++;
      }
      if (p.expirationDate) {
        const exp = new Date(p.expirationDate);
        if (exp <= sixtyDays) {
          expiringCount++;
        }
      }
    }

    return {
      totalCount: products.length,
      totalStockUnits,
      totalValuation,
      lowStockCount,
      expiringCount,
    };
  }, [products]);

  // Filtered product list
  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const now = new Date();
    const sixtyDays = new Date();
    sixtyDays.setDate(now.getDate() + 60);

    return products.filter((p) => {
      // Category match
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === 'low_stock' && p.currentStock > p.minStock) {
        return false;
      }
      if (statusFilter === 'expiring') {
        if (!p.expirationDate) return false;
        const exp = new Date(p.expirationDate);
        if (exp > sixtyDays) return false;
      }

      // Search match
      if (q) {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const matchesBarcode = p.barcode.includes(q);
        const matchesSupplier = p.supplier.toLowerCase().includes(q);
        const matchesActive = p.activeIngredient?.toLowerCase().includes(q);
        const matchesLocation = p.location.toLowerCase().includes(q);
        return matchesName || matchesSku || matchesBarcode || matchesSupplier || matchesActive || matchesLocation;
      }

      return true;
    });
  }, [products, searchTerm, selectedCategory, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium">Insumos Registrados</span>
            <div className="text-xl font-extrabold text-stone-900 tabular-nums">
              {metrics.totalCount} <span className="text-xs font-normal text-stone-500">referencias</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-800 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium">Alertas de Stock Bajo</span>
            <div className="text-xl font-extrabold text-amber-700 tabular-nums">
              {metrics.lowStockCount} <span className="text-xs font-normal text-stone-500">productos</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-sky-50 text-sky-800 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium">Valoración de Inventario</span>
            <div className="text-lg font-extrabold text-stone-900 tabular-nums">
              {formatCurrency(metrics.totalValuation)}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-stone-100 text-stone-800 rounded-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-medium">Unidades en Almacén</span>
            <div className="text-xl font-extrabold text-stone-900 tabular-nums">
              {metrics.totalStockUnits.toLocaleString('es-CO')}{' '}
              <span className="text-xs font-normal text-stone-500">unidades/sacos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Live Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, SKU, código de barras, lote o proveedor..."
              className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-xs text-stone-400 hover:text-stone-700"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(!currentUser || currentUser.permissions.canCreateProduct) && (
              <button
                onClick={onOpenNewProduct}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs whitespace-nowrap"
                title="Registrar nuevo insumo agrícola en catálogo"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Insumo</span>
              </button>
            )}

            {/* Quick Status Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-lg text-xs self-start md:self-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Todos ({products.length})
              </button>
              <button
                onClick={() => setStatusFilter('low_stock')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
                  statusFilter === 'low_stock'
                    ? 'bg-amber-100 text-amber-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Bajo Stock ({metrics.lowStockCount})</span>
              </button>
              <button
                onClick={() => setStatusFilter('expiring')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
                  statusFilter === 'expiring'
                    ? 'bg-red-100 text-red-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-red-600" />
                <span>Próximos a Vencer ({metrics.expiringCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Pill/Segment Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-stone-100 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-emerald-900 text-white font-semibold'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Todas las Categorías
          </button>
          {Object.values(CATEGORIES_CONFIG).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-emerald-900 text-white font-semibold'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Inventory Data Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/90 text-stone-700 font-semibold border-b border-stone-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Insumo / Descripción</th>
                <th className="py-3 px-3">Categoría & Registro</th>
                <th className="py-3 px-3">Ubicación Bodega</th>
                <th className="py-3 px-3 text-right">Stock Actual</th>
                <th className="py-3 px-3 text-right">Pto. Reorden</th>
                <th className="py-3 px-3">Lote & Vencimiento</th>
                <th className="py-3 px-3 text-right">Precio Venta</th>
                <th className="py-3 px-4 text-center">Acciones Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    <p className="text-sm font-semibold text-stone-700 mb-1">
                      No se encontraron insumos con los filtros seleccionados
                    </p>
                    <p className="text-xs text-stone-500 mb-4">
                      Intenta buscar por otro término o restablece los filtros.
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                        setStatusFilter('all');
                      }}
                      className="px-3.5 py-1.5 bg-emerald-800 text-white rounded-md text-xs font-semibold"
                    >
                      Restablecer Filtros
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.currentStock <= p.minStock;
                  const isCritical = p.currentStock <= p.safetyStock;

                  const now = new Date();
                  const sixtyDays = new Date();
                  sixtyDays.setDate(now.getDate() + 60);
                  const isExpiring = p.expirationDate ? new Date(p.expirationDate) <= sixtyDays : false;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-emerald-50/40 transition-colors group"
                    >
                      {/* Name & SKU */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900 group-hover:text-emerald-950">
                          {p.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                          <span className="font-mono text-stone-700 font-semibold">{p.sku}</span>
                          <span>·</span>
                          <span className="font-mono">{p.barcode}</span>
                          <span>·</span>
                          <span className="text-stone-600">{p.presentation}</span>
                        </div>
                      </td>

                      {/* Category & ICA */}
                      <td className="py-3 px-3">
                        <div className="font-medium text-stone-800">
                          {CATEGORIES_CONFIG[p.category].label}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {p.registrationNumber} · {p.supplier}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3 text-stone-700 font-mono text-[11px]">
                        {p.location}
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-3 text-right">
                        <div
                          className={`font-bold tabular-nums text-sm ${
                            isCritical
                              ? 'text-red-700'
                              : isLow
                              ? 'text-amber-700'
                              : 'text-stone-900'
                          }`}
                        >
                          {p.currentStock}
                        </div>
                        <div className="text-[10px] text-stone-500 font-normal">
                          {isCritical ? (
                            <span className="text-red-600 font-semibold">Crítico</span>
                          ) : isLow ? (
                            <span className="text-amber-600 font-semibold">Bajo Stock</span>
                          ) : (
                            <span className="text-emerald-700">Óptimo</span>
                          )}
                        </div>
                      </td>

                      {/* Reorder point */}
                      <td className="py-3 px-3 text-right tabular-nums text-stone-600">
                        {p.minStock}
                      </td>

                      {/* Batch & Expiration */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-[11px] text-stone-800">{p.batchNumber}</div>
                        <div
                          className={`text-[11px] tabular-nums ${
                            isExpiring ? 'text-red-600 font-semibold' : 'text-stone-500'
                          }`}
                        >
                          {formatDate(p.expirationDate)}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3 text-right font-semibold text-stone-900 tabular-nums">
                        {formatCurrency(p.sellingPrice)}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onOpenQuickMovement(p, 'ENTRADA')}
                            className="p-1.5 text-emerald-800 hover:bg-emerald-100 rounded transition-colors"
                            title="Registrar Entrada (+ Stock)"
                          >
                            <ArrowDownLeft className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onOpenQuickMovement(p, 'SALIDA')}
                            className="p-1.5 text-amber-800 hover:bg-amber-100 rounded transition-colors"
                            title="Registrar Salida (- Stock)"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onOpenProductDetails(p)}
                            className="p-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900 rounded transition-colors"
                            title="Ver Ficha Agronómica"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onOpenPrintLabel(p)}
                            className="p-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900 rounded transition-colors"
                            title="Generar Etiqueta QR / Barras"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>

                          {(!currentUser || currentUser.permissions.canEditProduct) && (
                            <button
                              onClick={() => onEditProduct(p)}
                              className="p-1.5 text-stone-600 hover:bg-stone-100 hover:text-stone-900 rounded transition-colors cursor-pointer"
                              title="Editar Datos del Insumo (Permiso Administrador)"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {(!currentUser || currentUser.permissions.canDeleteProduct) && onDeleteProduct && (
                            <button
                              onClick={() => onDeleteProduct(p)}
                              className="p-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 rounded transition-colors cursor-pointer"
                              title="Eliminar Insumo del Inventario (Permiso Administrador)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-600 gap-2">
          <div>
            Mostrando <strong>{filteredProducts.length}</strong> de <strong>{products.length}</strong> insumos agrícolas registrados
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Stock Normal
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Bajo Stock
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Stock Crítico
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
