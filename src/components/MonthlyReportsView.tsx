import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  Printer,
  TrendingDown,
  TrendingUp,
  Package,
  Layers,
  BarChart3,
  DollarSign,
  Building,
  CheckCircle2,
  FileDown,
} from 'lucide-react';
import { Product, StockMovement, CATEGORIES_CONFIG, ProductCategory } from '../types/inventory';
import { UserProfile } from '../types/auth';
import { formatCurrency, formatDate, formatDateTime } from '../utils/barcodeUtils';

interface MonthlyReportsViewProps {
  products: Product[];
  movements: StockMovement[];
  onOpenPdfExport: (month: string) => void;
  currentUser?: UserProfile;
}

export const MonthlyReportsView: React.FC<MonthlyReportsViewProps> = ({
  products,
  movements,
  onOpenPdfExport,
  currentUser,
}) => {
  // Current month default: 2026-09
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');

  // Available months extracted from movements
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    // Add current month
    set.add('2026-09');
    set.add('2026-08');
    set.add('2026-07');
    movements.forEach((m) => {
      if (m.date) {
        set.add(m.date.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [movements]);

  // Filter movements for selected month
  const monthMovements = useMemo(() => {
    return movements.filter((m) => m.date.startsWith(selectedMonth));
  }, [movements, selectedMonth]);

  // Calculate monthly stats
  const stats = useMemo(() => {
    let totalExitUnits = 0;
    let totalExitValue = 0;
    let totalEntryUnits = 0;
    let totalEntryCost = 0;

    const categoryConsumption: Record<string, { units: number; value: number }> = {};
    const productConsumption: Record<string, { name: string; sku: string; units: number; value: number }> = {};
    const clientConsumption: Record<string, { units: number; value: number; count: number }> = {};

    // Initialize categories
    Object.keys(CATEGORIES_CONFIG).forEach((cat) => {
      categoryConsumption[cat] = { units: 0, value: 0 };
    });

    monthMovements.forEach((m) => {
      if (m.type === 'SALIDA') {
        totalExitUnits += m.quantity;
        const val = m.totalCost || m.quantity * m.unitCost;
        totalExitValue += val;

        // By category
        if (m.category && categoryConsumption[m.category]) {
          categoryConsumption[m.category].units += m.quantity;
          categoryConsumption[m.category].value += val;
        }

        // By product
        if (!productConsumption[m.productId]) {
          productConsumption[m.productId] = {
            name: m.productName,
            sku: m.sku,
            units: 0,
            value: 0,
          };
        }
        productConsumption[m.productId].units += m.quantity;
        productConsumption[m.productId].value += val;

        // By client / destination
        const client = m.entity || 'Cliente General';
        if (!clientConsumption[client]) {
          clientConsumption[client] = { units: 0, value: 0, count: 0 };
        }
        clientConsumption[client].units += m.quantity;
        clientConsumption[client].value += val;
        clientConsumption[client].count += 1;
      } else if (m.type === 'ENTRADA') {
        totalEntryUnits += m.quantity;
        totalEntryCost += m.totalCost || m.quantity * m.unitCost;
      }
    });

    // Top 5 consumed products
    const topProducts = Object.values(productConsumption)
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    // Top client destinations
    const topClients = Object.entries(clientConsumption)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalExitUnits,
      totalExitValue,
      totalEntryUnits,
      totalEntryCost,
      netBalance: totalEntryUnits - totalExitUnits,
      categoryConsumption,
      topProducts,
      topClients,
    };
  }, [monthMovements]);

  // Export report as CSV
  const handleExportCsv = () => {
    const rows = [
      ['DISTRIBUIDORA GARCIA - REPORTE DE MOVIMIENTOS Y CONSUMO'],
      ['Periodo:', selectedMonth],
      ['Generado el:', new Date().toLocaleString('es-CO')],
      [],
      ['Fecha', 'Tipo', 'Insumo', 'SKU', 'Motivo', 'Cantidad', 'Costo Unit.', 'Total', 'Destino/Origen', 'Responsable', 'Doc. Soporte'],
    ];

    monthMovements.forEach((m) => {
      rows.push([
        formatDate(m.date),
        m.type,
        `"${m.productName}"`,
        m.sku,
        m.reason,
        m.quantity.toString(),
        m.unitCost.toString(),
        m.totalCost.toString(),
        `"${m.entity || ''}"`,
        `"${m.operator || ''}"`,
        `"${m.referenceDocument || ''}"`,
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_consumo_${selectedMonth}_distribuidora_garcia.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthLabel = (mStr: string) => {
    const [year, month] = mStr.split('-');
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  };

  return (
    <div className="space-y-6">
      {/* Month Selector Bar & Actions */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-800 text-white rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider block">
              Periodo de Reporte Mensual
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="font-bold text-base text-stone-900 bg-stone-50 border border-stone-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-emerald-700"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
              </select>
              <span className="text-xs text-stone-500">
                ({monthMovements.length} movimientos registrados)
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(!currentUser || currentUser.permissions.canExportMonthlyReports) ? (
            <button
              onClick={() => onOpenPdfExport(selectedMonth)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
              title="Exportar resumen profesional de movimientos y niveles de stock en PDF"
            >
              <FileDown className="w-4 h-4" />
              <span>Exportar a PDF</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 border border-stone-200 text-stone-400 rounded-lg text-xs font-medium cursor-not-allowed"
              title="Reportes mensuales restringidos a Administrador (Empleado solo realiza facturas y ventas)"
            >
              <FileDown className="w-4 h-4 text-stone-400" />
              <span>PDF (Solo Admin)</span>
            </div>
          )}

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition-colors border border-stone-300 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Reporte</span>
          </button>
        </div>
      </div>

      {/* Report Header for Print / View */}
      <div className="bg-emerald-950 text-white p-6 rounded-xl border border-emerald-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">
              Reporte Oficial de Operaciones
            </span>
            <h2 className="text-xl font-extrabold text-white mt-1">
              Consumo y Rotación de Insumos · {monthLabel(selectedMonth)}
            </h2>
            <p className="text-xs text-emerald-200/80 mt-1">
              Distribuidora García · Nit 900.482.102-3 · Sede Principal y Almacenes de Despacho
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-emerald-300 block">Movimiento Comercial del Mes:</span>
            <span className="text-2xl font-black text-white tabular-nums">
              {formatCurrency(stats.totalExitValue)}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Consumed / Exits */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Total Salidas / Consumo
            </span>
            <div className="p-1.5 bg-amber-50 text-amber-700 rounded-md">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 tabular-nums">
            {stats.totalExitUnits}{' '}
            <span className="text-xs font-normal text-stone-500">unidades despachadas</span>
          </div>
          <div className="text-xs text-stone-600 mt-1">
            Valor comercial: <strong>{formatCurrency(stats.totalExitValue)}</strong>
          </div>
        </div>

        {/* Total Entries / Stock Received */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Total Entradas / Compras
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-800 tabular-nums">
            +{stats.totalEntryUnits}{' '}
            <span className="text-xs font-normal text-stone-500">unidades ingresadas</span>
          </div>
          <div className="text-xs text-stone-600 mt-1">
            Inversión recepción: <strong>{formatCurrency(stats.totalEntryCost)}</strong>
          </div>
        </div>

        {/* Net Units Balance */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Balance Neto de Existencias
            </span>
            <div className="p-1.5 bg-stone-100 text-stone-700 rounded-md">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-black tabular-nums ${
              stats.netBalance >= 0 ? 'text-emerald-700' : 'text-stone-800'
            }`}
          >
            {stats.netBalance >= 0 ? `+${stats.netBalance}` : stats.netBalance}{' '}
            <span className="text-xs font-normal text-stone-500">saldo del mes</span>
          </div>
          <div className="text-xs text-stone-500 mt-1">
            {stats.netBalance >= 0 ? 'Stock en incremento' : 'Stock en desacumulación por alta demanda'}
          </div>
        </div>

        {/* Operational Transactions */}
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Transacciones del Mes
            </span>
            <div className="p-1.5 bg-sky-50 text-sky-700 rounded-md">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900 tabular-nums">
            {monthMovements.length}{' '}
            <span className="text-xs font-normal text-stone-500">registros auditables</span>
          </div>
          <div className="text-xs text-stone-500 mt-1">
            Seguimiento 100% trazable con QR/lotes
          </div>
        </div>
      </div>

      {/* Consumption by Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <h3 className="text-sm font-bold text-stone-900 mb-4 flex items-center justify-between">
            <span>Consumo Mensual por Categoría Agrícola</span>
            <span className="text-xs font-normal text-stone-500">Unidades y Porcentaje</span>
          </h3>

          <div className="space-y-3.5">
            {Object.entries(CATEGORIES_CONFIG).map(([key, cat]) => {
              const data = stats.categoryConsumption[key] || { units: 0, value: 0 };
              const percent = stats.totalExitUnits > 0 ? (data.units / stats.totalExitUnits) * 100 : 0;

              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-800">{cat.label}</span>
                    <div className="space-x-2 tabular-nums">
                      <span className="text-stone-600 font-bold">{data.units} uds</span>
                      <span className="text-stone-400">({percent.toFixed(1)}%)</span>
                      <span className="font-bold text-stone-900">
                        {formatCurrency(data.value)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-700 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Products Consumed */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <h3 className="text-sm font-bold text-stone-900 mb-4 flex items-center justify-between">
            <span>Insumos Agrícolas de Mayor Salida (Top 5)</span>
            <span className="text-xs font-normal text-stone-500">Mayor demanda</span>
          </h3>

          {stats.topProducts.length === 0 ? (
            <p className="text-xs text-stone-500 py-8 text-center">
              No se registraron salidas de inventario en este mes.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.map((p, index) => {
                const percent = stats.totalExitUnits > 0 ? (p.units / stats.totalExitUnits) * 100 : 0;

                return (
                  <div
                    key={p.sku}
                    className="p-3 bg-stone-50 rounded-lg border border-stone-200/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-800 text-white font-bold text-xs">
                        {index + 1}
                      </span>
                      <div>
                        <div className="font-bold text-xs text-stone-900">{p.name}</div>
                        <div className="font-mono text-[11px] text-stone-500">{p.sku}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-xs text-emerald-900 tabular-nums">
                        {p.units} unidades
                      </div>
                      <div className="text-[11px] text-stone-500 tabular-nums">
                        {formatCurrency(p.value)} ({percent.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Consuming Agricultural Clients / Farms */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
        <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Building className="w-4 h-4 text-emerald-800" />
            <span>Fincas y Clientes con Mayor Consumo del Mes</span>
          </span>
          <span className="text-xs font-normal text-stone-500">Destino de los insumos</span>
        </h3>

        {stats.topClients.length === 0 ? (
          <p className="text-xs text-stone-500 py-4 text-center">Sin despachos este mes.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {stats.topClients.map((c, i) => (
              <div key={c.name} className="p-3 bg-stone-50 rounded-lg border border-stone-200">
                <span className="text-xs font-bold text-stone-900 block truncate" title={c.name}>
                  {i + 1}. {c.name}
                </span>
                <div className="flex items-center justify-between text-xs mt-2">
                  <span className="text-stone-500">{c.units} unidades ({c.count} despachos)</span>
                  <span className="font-bold text-stone-800 tabular-nums">
                    {formatCurrency(c.value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Movement Ledger Table for the Month */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-stone-100 border-b border-stone-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
            Libro de Movimientos Auditables del Periodo ({monthMovements.length})
          </h3>
          <span className="text-xs text-stone-500">Trazabilidad completa con lote y soporte</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Fecha / Hora</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-4">Insumo</th>
                <th className="py-2.5 px-3 text-right">Cantidad</th>
                <th className="py-2.5 px-3">Lote</th>
                <th className="py-2.5 px-3">Origen / Destino</th>
                <th className="py-2.5 px-3">Responsable</th>
                <th className="py-2.5 px-3">Doc. Soporte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {monthMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-500 text-xs">
                    No hay registros de movimientos en el mes de {monthLabel(selectedMonth)}.
                  </td>
                </tr>
              ) : (
                monthMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-stone-50">
                    <td className="py-2.5 px-4 text-stone-600 font-mono text-[11px]">
                      {formatDateTime(m.date)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.type === 'ENTRADA'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-bold text-stone-900">{m.productName}</span>
                      <span className="block font-mono text-[10px] text-stone-500">{m.sku}</span>
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-bold tabular-nums ${
                        m.type === 'ENTRADA' ? 'text-emerald-700' : 'text-amber-800'
                      }`}
                    >
                      {m.type === 'ENTRADA' ? `+${m.quantity}` : `-${m.quantity}`}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-stone-700">{m.batchNumber}</td>
                    <td className="py-2.5 px-3 text-stone-700 font-medium truncate max-w-[150px]">
                      {m.entity || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3 text-stone-600">{m.operator}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500">
                      {m.referenceDocument || 'Sin Doc.'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
