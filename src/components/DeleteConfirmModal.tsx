import React from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  Package,
  ShieldAlert,
} from 'lucide-react';
import { Product } from '../types/inventory';
import { formatCurrency } from '../utils/barcodeUtils';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirmDelete: (productId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  product,
  onConfirmDelete,
}) => {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-red-950 text-white">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-800 text-red-200 rounded-lg">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Eliminar Insumo del Inventario</h3>
              <p className="text-[11px] text-red-300">
                Distribuidora García · Acción de Administrador
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-red-300 hover:text-white p-1 rounded-lg hover:bg-red-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-stone-700">
          <p className="text-stone-800 font-medium">
            ¿Estás seguro de que deseas eliminar este insumo agrícola del catálogo de Distribuidora García?
          </p>

          {/* Product summary card */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-extrabold text-stone-900 text-sm block">
                  {product.name}
                </span>
                <span className="text-[11px] text-stone-500 font-mono">
                  SKU: {product.sku} · Código: {product.barcode}
                </span>
              </div>
              <span className="px-2 py-0.5 bg-stone-200 text-stone-800 text-[10px] font-bold rounded">
                {product.category.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200/80 text-[11px]">
              <div>
                <span className="text-stone-500 block">Stock en Bodega:</span>
                <span className="font-bold text-stone-900 tabular-nums">
                  {product.currentStock} {product.presentation}
                </span>
              </div>
              <div>
                <span className="text-stone-500 block">Precio de Venta:</span>
                <span className="font-bold text-stone-900 tabular-nums">
                  {formatCurrency(product.sellingPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Stock warning if product still has units */}
          {product.currentStock > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-tight">
                <strong>Advertencia de existencias:</strong> Este producto cuenta con{' '}
                <strong>{product.currentStock} unidades activas</strong> en almacén. Al eliminarlo,
                se desvinculará del catálogo operativo.
              </div>
            </div>
          )}

          <p className="text-stone-500 text-[11px]">
            Esta acción solo puede ser ejecutada por usuarios con permiso de Administrador.
          </p>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 bg-white hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirmDelete(product.id);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar Insumo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
