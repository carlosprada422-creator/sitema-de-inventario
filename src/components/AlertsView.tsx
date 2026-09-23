import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  ShoppingCart,
  TrendingDown,
  CheckCircle,
  Package,
  FileSpreadsheet,
  Printer,
  ArrowDownLeft,
  Truck,
  Lock,
} from 'lucide-react';
import { Product } from '../types/inventory';
import { CATEGORIES_CONFIG } from '../types/inventory';
import { UserProfile } from '../types/auth';
import {
  getLowStockAlerts,
  generatePurchaseRecommendations,
} from '../services/storage';
import { formatCurrency, formatDate } from '../utils/barcodeUtils';

interface AlertsViewProps {
  products: Product[];
  onQuickRestock: (product: Product) => void;
  onAutoRestockAll: (recommendations: any[]) => void;
  currentUser?: UserProfile;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  products,
  onQuickRestock,
  onAutoRestockAll,
  currentUser,
}) => {
  const alerts = getLowStockAlerts(products);
  const recommendations = generatePurchaseRecommendations(products);

  const [filterType, setFilterType] = useState<'all' | 'critical' | 'low' | 'expiring'>('all');

  const totalEstimatedReorderCost = recommendations.reduce(
    (acc, curr) => acc + curr.estimatedTotalCost,
    0
  );

  const totalSuggestedUnits = recommendations.reduce(
    (acc, curr) => acc + curr.suggestedReorderQuantity,
    0
  );

  // Group recommendations by supplier for organized purchase orders
  const groupedBySupplier = recommendations.reduce<Record<string, typeof recommendations>>(
    (acc, curr) => {
      if (!acc[curr.supplier]) {
        acc[curr.supplier] = [];
      }
      acc[curr.supplier].push(curr);
      return acc;
    },
    {}
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-red-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-red-100 text-red-700 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-red-600 font-semibold uppercase tracking-wider">
              Stock Crítico (Urgente)
            </span>
            <div className="text-2xl font-extrabold text-red-700 tabular-nums">
              {alerts.critical.length} <span className="text-xs font-normal text-stone-500">insumos</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-700 rounded-lg">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-amber-700 font-semibold uppercase tracking-wider">
              Punto de Reorden Superado
            </span>
            <div className="text-2xl font-extrabold text-amber-700 tabular-nums">
              {alerts.low.length} <span className="text-xs font-normal text-stone-500">insumos</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-orange-100 text-orange-700 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-orange-700 font-semibold uppercase tracking-wider">
              Próximos a Vencer (&lt; 60d)
            </span>
            <div className="text-2xl font-extrabold text-stone-900 tabular-nums">
              {alerts.expiringSoon.length} <span className="text-xs font-normal text-stone-500">lotes</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-lg">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">
              Inversión Sugerida
            </span>
            <div className="text-lg font-extrabold text-stone-900 tabular-nums">
              {formatCurrency(totalEstimatedReorderCost)}
            </div>
          </div>
        </div>
      </div>

      {/* Automated Purchase Order Generator Header */}
      <div className="bg-stone-900 text-white rounded-xl p-5 border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Reabastecimiento Inteligente de Inventario
          </span>
          <h3 className="text-lg font-bold text-white mt-0.5">
            Reporte Automático de Reposición para Distribuidora García
          </h3>
          <p className="text-xs text-stone-300 mt-1">
            Se requiere reordenar <strong>{totalSuggestedUnits} unidades</strong> distribuidas en{' '}
            <strong>{Object.keys(groupedBySupplier).length} proveedores</strong> autorizados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Orden</span>
          </button>

          {recommendations.length > 0 && (
            currentUser?.permissions?.canAutoRestock ? (
              <button
                onClick={() => onAutoRestockAll(recommendations)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                title="Aprobado para Administrador: genera órdenes y actualiza stock automáticamente"
              >
                <Truck className="w-4 h-4" />
                <span>Ejecutar Reposición Automática</span>
              </button>
            ) : (
              <div
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 text-stone-300 rounded-lg text-xs font-medium border border-stone-700"
                title="La orden automática está lista para autorización del Administrador"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Reposición (Requiere Admin)</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Suggested Orders by Supplier */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-stone-900 flex items-center justify-between">
          <span>Órdenes de Compra Sugeridas por Proveedor</span>
          <span className="text-xs font-normal text-stone-500">
            Cálculo: Capacidad Máxima - Stock Actual
          </span>
        </h4>

        {Object.keys(groupedBySupplier).length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-stone-200 text-stone-500">
            <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-stone-800">
              ¡Inventario en Niveles Óptimos!
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Todos los insumos agrícolas cuentan con existencias superiores al punto de reorden.
            </p>
          </div>
        ) : (
          Object.entries(groupedBySupplier).map(([supplier, items]) => {
            const supplierTotal = items.reduce((s, it) => s + it.estimatedTotalCost, 0);

            return (
              <div
                key={supplier}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs"
              >
                <div className="bg-stone-100/90 px-4 py-3 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                      Proveedor: {supplier}
                    </span>
                    <span className="text-xs text-stone-500">
                      ({items.length} {items.length === 1 ? 'insumo' : 'insumos'})
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-stone-800">
                    Subtotal Estimado:{' '}
                    <strong className="text-emerald-900 font-extrabold tabular-nums">
                      {formatCurrency(supplierTotal)}
                    </strong>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                      <tr>
                        <th className="py-2.5 px-4">Insumo</th>
                        <th className="py-2.5 px-3">Categoría</th>
                        <th className="py-2.5 px-3 text-right">Stock Actual</th>
                        <th className="py-2.5 px-3 text-right">Pto. Reorden</th>
                        <th className="py-2.5 px-3 text-right">Cantidad Sugerida</th>
                        <th className="py-2.5 px-3 text-right">Costo Unit.</th>
                        <th className="py-2.5 px-3 text-right">Total Estimado</th>
                        <th className="py-2.5 px-4 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {items.map((it) => {
                        const originalProduct = products.find((p) => p.id === it.productId);

                        return (
                          <tr key={it.productId} className="hover:bg-stone-50/80">
                            <td className="py-2.5 px-4">
                              <span className="font-bold text-stone-900">{it.productName}</span>
                              <span className="block font-mono text-[11px] text-stone-500">{it.sku}</span>
                            </td>
                            <td className="py-2.5 px-3 text-stone-700">
                              {CATEGORIES_CONFIG[it.category].label}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span
                                className={`font-bold tabular-nums ${
                                  it.urgency === 'CRITICA' ? 'text-red-700' : 'text-amber-700'
                                }`}
                              >
                                {it.currentStock}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-stone-600 tabular-nums">
                              {it.minStock}
                            </td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-emerald-800 tabular-nums">
                              +{it.suggestedReorderQuantity}
                            </td>
                            <td className="py-2.5 px-3 text-right text-stone-600 tabular-nums">
                              {formatCurrency(it.unitCost)}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-stone-900 tabular-nums">
                              {formatCurrency(it.estimatedTotalCost)}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              {originalProduct && (
                                <button
                                  onClick={() => onQuickRestock(originalProduct)}
                                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-semibold transition-colors whitespace-nowrap"
                                >
                                  Reabastecer
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Expiring Soon Agricultural Lots */}
      {alerts.expiringSoon.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-200 overflow-hidden shadow-xs">
          <div className="bg-orange-50 px-4 py-3 border-b border-orange-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-700" />
              <span className="text-xs font-bold text-orange-950 uppercase tracking-wide">
                Insumos Próximos a Vencer (Vigilancia de Calidad Agronómica)
              </span>
            </div>
            <span className="text-xs text-orange-800 font-semibold">
              Requieren rotación prioritaria
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-4">Insumo</th>
                  <th className="py-2.5 px-3">Lote (Batch)</th>
                  <th className="py-2.5 px-3">Fecha de Vencimiento</th>
                  <th className="py-2.5 px-3">Ubicación Bodega</th>
                  <th className="py-2.5 px-3 text-right">Stock Disponible</th>
                  <th className="py-2.5 px-4 text-center">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {alerts.expiringSoon.map((p) => (
                  <tr key={p.id} className="hover:bg-orange-50/40">
                    <td className="py-2.5 px-4 font-bold text-stone-900">{p.name}</td>
                    <td className="py-2.5 px-3 font-mono text-stone-700">{p.batchNumber}</td>
                    <td className="py-2.5 px-3 font-bold text-orange-700 tabular-nums">
                      {formatDate(p.expirationDate)}
                    </td>
                    <td className="py-2.5 px-3 text-stone-600">{p.location}</td>
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums">
                      {p.currentStock} {p.presentation}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="text-[11px] font-semibold text-orange-800 bg-orange-100 px-2 py-0.5 rounded">
                        Promover en ventas
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
