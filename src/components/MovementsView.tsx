import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Download,
  Plus,
  Calendar,
  FileText,
  User,
  Building,
  Receipt,
  Lock,
} from 'lucide-react';
import { StockMovement, MovementType, CATEGORIES_CONFIG } from '../types/inventory';
import { UserProfile } from '../types/auth';
import { formatCurrency, formatDateTime, formatDate } from '../utils/barcodeUtils';

interface MovementsViewProps {
  movements: StockMovement[];
  onOpenNewMovement: () => void;
  onOpenInvoiceSale?: () => void;
  currentUser?: UserProfile;
}

export const MovementsView: React.FC<MovementsViewProps> = ({
  movements,
  onOpenNewMovement,
  onOpenInvoiceSale,
  currentUser,
}) => {
  const isEmployee = currentUser?.role === 'empleado';
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'ENTRADA' | 'SALIDA'>('all');

  const filteredMovements = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return movements.filter((m) => {
      if (typeFilter !== 'all' && m.type !== typeFilter) {
        return false;
      }
      if (q) {
        const matchName = m.productName.toLowerCase().includes(q);
        const matchSku = m.sku.toLowerCase().includes(q);
        const matchEntity = m.entity?.toLowerCase().includes(q);
        const matchOp = m.operator?.toLowerCase().includes(q);
        const matchBatch = m.batchNumber?.toLowerCase().includes(q);
        const matchDoc = m.referenceDocument?.toLowerCase().includes(q);
        return matchName || matchSku || matchEntity || matchOp || matchBatch || matchDoc;
      }
      return true;
    });
  }, [movements, searchTerm, typeFilter]);

  const summary = useMemo(() => {
    let entryCount = 0;
    let exitCount = 0;
    let entryUnits = 0;
    let exitUnits = 0;

    movements.forEach((m) => {
      if (m.type === 'ENTRADA') {
        entryCount++;
        entryUnits += m.quantity;
      } else {
        exitCount++;
        exitUnits += m.quantity;
      }
    });

    return { entryCount, exitCount, entryUnits, exitUnits };
  }, [movements]);

  const handleExportCsv = () => {
    const headers = [
      'ID Movimiento',
      'Fecha y Hora',
      'Tipo',
      'Motivo',
      'Insumo',
      'SKU',
      'Cantidad',
      'Lote',
      'Entidad / Cliente / Proveedor',
      'Operador Responsable',
      'Documento Referencia',
      'Notas',
    ];

    const rows = filteredMovements.map((m) => {
      return [
        m.id,
        m.date,
        m.type,
        m.reason,
        `"${m.productName}"`,
        m.sku,
        m.quantity,
        m.batchNumber || '',
        `"${m.entity || ''}"`,
        `"${m.operator}"`,
        m.referenceDocument || '',
        `"${m.notes || ''}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `movimientos_distribuidora_garcia_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Role banner if Employee */}
      {isEmployee && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sky-950 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-200 text-sky-900 rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold block text-sm">Perfil de Empleado Activo: {currentUser.name}</span>
              <span className="text-sky-800 text-[11px]">
                Permisos asignados: Generar facturas de venta y registrar despachos a agricultores. Las entradas y compras están reservadas para Administración.
              </span>
            </div>
          </div>
          {onOpenInvoiceSale && (
            <button
              onClick={onOpenInvoiceSale}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <Receipt className="w-4 h-4" />
              <span>Nueva Factura y Venta</span>
            </button>
          )}
        </div>
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              Entradas Registradas
            </span>
            <div className="text-xl font-extrabold text-emerald-800 tabular-nums mt-0.5">
              +{summary.entryUnits} <span className="text-xs font-normal text-stone-500">unidades ({summary.entryCount} recepciones)</span>
            </div>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              Ventas y Salidas
            </span>
            <div className="text-xl font-extrabold text-amber-700 tabular-nums mt-0.5">
              -{summary.exitUnits} <span className="text-xs font-normal text-stone-500">unidades ({summary.exitCount} despachos/facturas)</span>
            </div>
          </div>
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              Total Operaciones
            </span>
            <div className="text-xl font-extrabold text-stone-900 tabular-nums mt-0.5">
              {movements.length} <span className="text-xs font-normal text-stone-500">movimientos auditables</span>
            </div>
          </div>
          <div className="p-2.5 bg-stone-100 text-stone-700 rounded-lg">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Control bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por insumo, cliente, proveedor, factura o lote..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                typeFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTypeFilter('ENTRADA')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                typeFilter === 'ENTRADA' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Solo Entradas (+)
            </button>
            <button
              onClick={() => setTypeFilter('SALIDA')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
                typeFilter === 'SALIDA' ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Solo Salidas (-)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenInvoiceSale && (
            <button
              onClick={onOpenInvoiceSale}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
              title="Generar Factura y Despachar Insumos"
            >
              <Receipt className="w-4 h-4" />
              <span>Generar Factura / Venta</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold border border-stone-300 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={onOpenNewMovement}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isEmployee ? 'Registrar Venta' : 'Registrar Movimiento'}</span>
          </button>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Fecha & Hora</th>
                <th className="py-3 px-3">Tipo & Motivo</th>
                <th className="py-3 px-4">Insumo Agrícola</th>
                <th className="py-3 px-3 text-right">Cantidad</th>
                <th className="py-3 px-3">Lote</th>
                <th className="py-3 px-3">Cliente / Proveedor / Destino</th>
                <th className="py-3 px-3">Operador</th>
                <th className="py-3 px-4">Doc. Soporte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    No se encontraron registros de movimientos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isEntry = m.type === 'ENTRADA';
                  return (
                    <tr key={m.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-stone-600 font-medium">
                        {formatDateTime(m.date)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            isEntry
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isEntry ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          <span>{isEntry ? 'Entrada' : 'Salida'}</span>
                        </span>
                        <span className="block text-[10px] text-stone-500 mt-0.5">
                          {m.reason.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-stone-900 block">{m.productName}</span>
                        <span className="text-[10px] text-stone-500 font-mono">SKU: {m.sku}</span>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap font-extrabold">
                        <span className={isEntry ? 'text-emerald-800' : 'text-amber-800'}>
                          {isEntry ? `+${m.quantity}` : `-${m.quantity}`}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono text-[11px] bg-stone-100 px-1.5 py-0.5 rounded text-stone-700">
                          {m.batchNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-stone-800 font-medium">
                        {m.entity || <span className="text-stone-400 italic">No especificado</span>}
                      </td>
                      <td className="py-3 px-3 text-stone-600 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-stone-400" />
                          <span>{m.operator}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-stone-600 font-mono text-[11px]">
                        {m.referenceDocument || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
