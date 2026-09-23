import React from 'react';
import {
  X,
  Package,
  MapPin,
  Calendar,
  AlertTriangle,
  FileText,
  DollarSign,
  Printer,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Product, CATEGORIES_CONFIG } from '../types/inventory';
import { UserProfile } from '../types/auth';
import { formatCurrency, formatDate } from '../utils/barcodeUtils';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenMovement: (product: Product, type: 'ENTRADA' | 'SALIDA') => void;
  onPrintLabel: (product: Product) => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (product: Product) => void;
  currentUser?: UserProfile;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onOpenMovement,
  onPrintLabel,
  onEditProduct,
  onDeleteProduct,
  currentUser,
}) => {
  if (!product) return null;

  const category = CATEGORIES_CONFIG[product.category];

  // Toxicity band styling helper
  const getToxicityBadge = () => {
    switch (product.toxicityBand) {
      case 'I':
        return { label: 'Categoría I - Extremadamente Peligroso (Banda Roja)', bg: 'bg-red-700 text-white' };
      case 'II':
        return { label: 'Categoría II - Altamente Peligroso (Banda Amarilla)', bg: 'bg-amber-400 text-stone-950 font-bold' };
      case 'III':
        return { label: 'Categoría III - Moderadamente Peligroso (Banda Azul)', bg: 'bg-blue-600 text-white' };
      case 'IV':
        return { label: 'Categoría IV - Ligeramente Peligroso (Banda Verde)', bg: 'bg-emerald-700 text-white' };
      default:
        return { label: 'No Tóxico / Fertilizante o Herramienta', bg: 'bg-stone-200 text-stone-800' };
    }
  };

  const tox = getToxicityBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-start justify-between p-6 bg-emerald-950 text-white">
          <div>
            <span className="text-xs uppercase tracking-wider text-emerald-300 font-bold">
              {category.label}
            </span>
            <h2 className="text-xl font-bold mt-1 text-white">{product.name}</h2>
            <div className="flex items-center gap-2 text-xs text-emerald-200/80 mt-1">
              <span>SKU: {product.sku}</span>
              <span>·</span>
              <span>Código: {product.barcode}</span>
              <span>·</span>
              <span>{product.presentation}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-850"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs text-stone-700 max-h-[70vh] overflow-y-auto">
          {/* Toxicity Band Banner */}
          <div className={`p-2.5 rounded-lg flex items-center gap-2 ${tox.bg}`}>
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="font-semibold text-xs">{tox.label}</span>
          </div>

          {/* Key Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div>
              <span className="text-stone-500 block text-[11px]">Stock Disponible</span>
              <span className="text-base font-bold text-stone-900 tabular-nums">
                {product.currentStock} {product.presentation}
              </span>
            </div>
            <div>
              <span className="text-stone-500 block text-[11px]">Punto de Reorden</span>
              <span className="text-sm font-semibold text-stone-800 tabular-nums">
                {product.minStock} unidades
              </span>
            </div>
            <div>
              <span className="text-stone-500 block text-[11px]">Stock de Seguridad</span>
              <span className="text-sm font-semibold text-stone-800 tabular-nums">
                {product.safetyStock} unidades
              </span>
            </div>
            <div>
              <span className="text-stone-500 block text-[11px]">Capacidad Bodega</span>
              <span className="text-sm font-semibold text-stone-800 tabular-nums">
                {product.maxStock} unidades
              </span>
            </div>
          </div>

          {/* Pricing & Commercial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-stone-50 rounded-lg border border-stone-200">
              <span className="text-stone-500 block text-[11px]">Costo Unitario de Compra</span>
              <span className="text-sm font-bold text-stone-900 tabular-nums">
                {formatCurrency(product.unitCost)}
              </span>
            </div>
            <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200">
              <span className="text-emerald-800 block text-[11px] font-semibold">
                Precio de Venta al Agricultor
              </span>
              <span className="text-sm font-extrabold text-emerald-950 tabular-nums">
                {formatCurrency(product.sellingPrice)}
              </span>
            </div>
          </div>

          {/* Agricultural Data */}
          <div className="space-y-3 pt-2 border-t border-stone-200">
            <h4 className="font-bold text-stone-900 text-sm">Ficha Técnica y Agronómica</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-stone-500 block text-[11px]">Ingrediente Activo / Composición</span>
                <span className="font-semibold text-stone-800">
                  {product.activeIngredient || 'No especificado'}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block text-[11px]">Registro Fitosanitario / ICA / SAG</span>
                <span className="font-mono font-semibold text-stone-800">
                  {product.registrationNumber}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block text-[11px]">Fabricante / Proveedor Oficial</span>
                <span className="font-semibold text-stone-800">{product.supplier}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[11px]">Ubicación en Almacén</span>
                <span className="font-semibold text-stone-800">{product.location}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[11px]">Número de Lote (Batch)</span>
                <span className="font-mono font-semibold text-stone-800">{product.batchNumber}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[11px]">Fecha de Caducidad</span>
                <span className="font-semibold text-stone-800 tabular-nums">
                  {formatDate(product.expirationDate)}
                </span>
              </div>
            </div>

            <div>
              <span className="text-stone-500 block text-[11px] mb-1">Descripción del Insumo</span>
              <p className="text-stone-700 leading-relaxed bg-stone-50 p-2.5 rounded border border-stone-200">
                {product.description}
              </p>
            </div>

            {product.notes && (
              <div>
                <span className="text-stone-500 block text-[11px] mb-1">Notas y Recomendaciones de Bodega</span>
                <p className="text-stone-600 italic bg-amber-50/50 p-2.5 rounded border border-amber-200">
                  {product.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onPrintLabel(product);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Etiqueta QR</span>
            </button>

            {(!currentUser || currentUser.permissions.canEditProduct) && onEditProduct && (
              <button
                onClick={() => {
                  onClose();
                  onEditProduct(product);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 transition-colors cursor-pointer"
              >
                <Edit2 className="w-4 h-4 text-stone-600" />
                <span>Editar Insumo</span>
              </button>
            )}

            {(!currentUser || currentUser.permissions.canDeleteProduct) && onDeleteProduct && (
              <button
                onClick={() => {
                  onClose();
                  onDeleteProduct(product);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-semibold text-red-700 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Eliminar</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {(!currentUser || currentUser.permissions.canRegisterEntries) && (
              <button
                onClick={() => {
                  onClose();
                  onOpenMovement(product, 'ENTRADA');
                }}
                className="flex items-center gap-1 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Entrada (+)</span>
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onOpenMovement(product, 'SALIDA');
              }}
              className="flex items-center gap-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Venta / Salida (-)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
