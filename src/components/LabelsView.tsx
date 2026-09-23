import React, { useState } from 'react';
import {
  Printer,
  QrCode,
  Search,
  Filter,
  Package,
  Layers,
} from 'lucide-react';
import { Product, CATEGORIES_CONFIG } from '../types/inventory';
import { generateBarcodeSvg, formatDate } from '../utils/barcodeUtils';

interface LabelsViewProps {
  products: Product[];
  onOpenLabelDetail: (product: Product) => void;
}

export const LabelsView: React.FC<LabelsViewProps> = ({
  products,
  onOpenLabelDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filtered = products.filter((p) => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.batchNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Centro de Etiquetado y Marcación
          </span>
          <h2 className="text-lg font-bold text-stone-900 mt-0.5">
            Generación de Etiquetas QR y Códigos de Barras para Bodega
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Impresión de rótulos térmicos para sacos de fertilizantes, semillas, canecas y estanterías físicas.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir Catálogo de Etiquetas</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar insumo para generar etiqueta..."
            className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-emerald-900 text-white font-semibold'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Todos
          </button>
          {Object.values(CATEGORIES_CONFIG).map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === c.id
                  ? 'bg-emerald-900 text-white font-semibold'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Label Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const barcodeSvg = generateBarcodeSvg(p.barcode, 200, 42);

          return (
            <div
              key={p.id}
              className="bg-white border-2 border-stone-300 rounded-xl p-4 shadow-xs hover:border-emerald-700 transition-all flex flex-col justify-between space-y-3 group"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-stone-200 pb-2">
                <div>
                  <span className="text-[10px] font-black uppercase text-emerald-900 tracking-tight block">
                    Distribuidora García
                  </span>
                  <span className="text-[10px] text-stone-500">{CATEGORIES_CONFIG[p.category].label}</span>
                </div>
                <span className="font-mono text-xs font-bold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded">
                  {p.sku}
                </span>
              </div>

              {/* Product Info */}
              <div>
                <h4 className="font-bold text-stone-900 text-sm leading-tight group-hover:text-emerald-950">
                  {p.name}
                </h4>
                <div className="text-xs text-stone-600 mt-1 flex items-center gap-1.5">
                  <span>{p.presentation}</span>
                  <span>·</span>
                  <span>Lote: <strong>{p.batchNumber}</strong></span>
                </div>
              </div>

              {/* Vector Barcode rendering */}
              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200 flex flex-col items-center justify-center space-y-1">
                <div
                  className="w-full flex items-center justify-center overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                />
                <div className="font-mono text-[11px] font-bold text-stone-800 tracking-wider">
                  {p.barcode}
                </div>
              </div>

              {/* Meta and print button */}
              <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs">
                <span className="text-[11px] text-stone-500">
                  Ubicación: <strong className="text-stone-700">{p.location}</strong>
                </span>

                <button
                  onClick={() => onOpenLabelDetail(p)}
                  className="flex items-center gap-1 px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Ver Etiqueta</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
