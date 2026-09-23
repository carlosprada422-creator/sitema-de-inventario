import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Package,
  AlertCircle,
  FileCheck,
  Building2,
  User,
  Lock,
} from 'lucide-react';
import { Product, MovementType, MovementReason } from '../types/inventory';
import { CATEGORIES_CONFIG } from '../types/inventory';
import { UserProfile } from '../types/auth';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialProduct?: Product | null;
  initialType?: MovementType;
  currentUserName?: string;
  currentUser?: UserProfile;
  onConfirmMovement: (
    productId: string,
    type: MovementType,
    reason: MovementReason,
    quantity: number,
    operator: string,
    entity: string,
    batchNumber?: string,
    referenceDocument?: string,
    notes?: string
  ) => { success: boolean; message: string };
}

export const MovementModal: React.FC<MovementModalProps> = ({
  isOpen,
  onClose,
  products,
  initialProduct,
  initialType = 'ENTRADA',
  currentUserName,
  currentUser,
  onConfirmMovement,
}) => {
  const isEmployee = currentUser?.role === 'empleado';
  const effectiveInitialType = isEmployee ? 'SALIDA' : initialType;

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [type, setType] = useState<MovementType>(effectiveInitialType);
  const [reason, setReason] = useState<MovementReason>(isEmployee ? 'VENTA_CLIENTE' : 'COMPRA_PROVEEDOR');
  const [quantity, setQuantity] = useState<number>(1);
  const [operator, setOperator] = useState<string>(currentUser?.name || currentUserName || 'Ing. Carlos García');
  const [entity, setEntity] = useState<string>('');
  const [batchNumber, setBatchNumber] = useState<string>('');
  const [referenceDocument, setReferenceDocument] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const actType = isEmployee ? 'SALIDA' : initialType;
    if (initialProduct) {
      setSelectedProductId(initialProduct.id);
      setBatchNumber(initialProduct.batchNumber || '');
      setEntity(actType === 'ENTRADA' ? initialProduct.supplier : '');
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
      setBatchNumber(products[0].batchNumber || '');
      setEntity(actType === 'ENTRADA' ? products[0].supplier : '');
    }
    setType(actType);
    setReason(actType === 'ENTRADA' ? 'COMPRA_PROVEEDOR' : 'VENTA_CLIENTE');
    setQuantity(1);
    setOperator(currentUser?.name || currentUserName || 'Ing. Carlos García');
    setErrorMessage(null);
  }, [isOpen, initialProduct, initialType, products, isEmployee, currentUser, currentUserName]);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === selectedProductId);

  const handleProductChange = (newId: string) => {
    setSelectedProductId(newId);
    const prod = products.find((p) => p.id === newId);
    if (prod) {
      setBatchNumber(prod.batchNumber);
      if (type === 'ENTRADA') {
        setEntity(prod.supplier);
      }
    }
  };

  const handleTypeChange = (newType: MovementType) => {
    setType(newType);
    if (newType === 'ENTRADA') {
      setReason('COMPRA_PROVEEDOR');
      if (currentProduct) setEntity(currentProduct.supplier);
    } else {
      setReason('VENTA_CLIENTE');
      setEntity('');
    }
  };

  const calculateProjectedStock = () => {
    if (!currentProduct) return 0;
    if (type === 'ENTRADA') return currentProduct.currentStock + quantity;
    if (type === 'SALIDA') return currentProduct.currentStock - quantity;
    return quantity;
  };

  const projectedStock = calculateProjectedStock();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedProductId) {
      setErrorMessage('Por favor selecciona un insumo agrícola.');
      return;
    }

    if (quantity <= 0) {
      setErrorMessage('La cantidad debe ser mayor a cero.');
      return;
    }

    if (type === 'SALIDA' && currentProduct && quantity > currentProduct.currentStock) {
      setErrorMessage(
        `Stock insuficiente para salida. Stock disponible en bodega: ${currentProduct.currentStock} ${currentProduct.presentation}`
      );
      return;
    }

    if (!entity.trim()) {
      setErrorMessage(
        type === 'ENTRADA'
          ? 'Por favor indica el proveedor de origen.'
          : 'Por favor indica el cliente, finca o destino de salida.'
      );
      return;
    }

    const res = onConfirmMovement(
      selectedProductId,
      type,
      reason,
      quantity,
      operator,
      entity,
      batchNumber,
      referenceDocument,
      notes
    );

    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden my-6">
        {/* Header */}
        <div
          className={`flex items-center justify-between p-5 text-white ${
            type === 'ENTRADA' ? 'bg-emerald-950' : 'bg-amber-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-lg ${
                type === 'ENTRADA' ? 'bg-emerald-800 text-emerald-200' : 'bg-amber-800 text-amber-200'
              }`}
            >
              {type === 'ENTRADA' ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold">
                {type === 'ENTRADA'
                  ? 'Registrar Entrada de Insumo Agrícola'
                  : 'Registrar Salida de Insumo Agrícola'}
              </h3>
              <p className="text-xs opacity-80">
                Distribuidora García · Actualización automática de inventario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-300 hover:text-white p-1 rounded-lg hover:bg-black/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-stone-700">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Role Notification Banner if Employee */}
          {isEmployee && (
            <div className="p-2.5 bg-sky-50 border border-sky-200 rounded-lg text-sky-900 text-[11px] flex items-center gap-2">
              <Lock className="w-4 h-4 text-sky-700 shrink-0" />
              <span>
                <strong>Modo Empleado:</strong> Tu permiso solo te permite registrar ventas y generar facturas. La recepción y compras de inventario están restringidas al Administrador.
              </span>
            </div>
          )}

          {/* Movement Type Switcher */}
          <div className="grid grid-cols-2 gap-2">
            {isEmployee ? (
              <div
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg font-medium border border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
                title="Los empleados no tienen permiso para registrar entradas de insumos"
              >
                <Lock className="w-3.5 h-3.5 text-stone-400" />
                <span>Entrada (Solo Admin)</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleTypeChange('ENTRADA')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold border transition-colors cursor-pointer ${
                  type === 'ENTRADA'
                    ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Entrada (Recepción)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleTypeChange('SALIDA')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold border transition-colors cursor-pointer ${
                type === 'SALIDA'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                  : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Salida (Venta / Despacho)</span>
            </button>
          </div>

          {/* Insumo Selector */}
          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Insumo Agrícola a Gestionar
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.sku}] · Stock actual: {p.currentStock} {p.presentation}
                </option>
              ))}
            </select>
          </div>

          {/* Reason & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                Motivo del Movimiento
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as MovementReason)}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white"
              >
                {type === 'ENTRADA' ? (
                  <>
                    <option value="COMPRA_PROVEEDOR">Compra a Proveedor</option>
                    <option value="DEVOLUCION_CLIENTE">Devolución de Agricultor</option>
                    <option value="AJUSTE_INVENTARIO">Ajuste de Conteo Físico</option>
                  </>
                ) : isEmployee ? (
                  <>
                    <option value="VENTA_CLIENTE">Venta a Agricultor / Finca (Despacho)</option>
                  </>
                ) : (
                  <>
                    <option value="VENTA_CLIENTE">Venta a Agricultor / Finca</option>
                    <option value="TRASLADO_FINCA">Traslado a Finca / Silo</option>
                    <option value="MERMA_DETERIORO">Merma por Avería / Caducado</option>
                    <option value="CONSUMO_INTERNO">Consumo Interno / Demostración</option>
                    <option value="DEVOLUCION_PROVEEDOR">Devolución a Fabricante</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                Cantidad ({currentProduct?.presentation || 'Unidades'})
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-bold tabular-nums focus:ring-2 focus:ring-emerald-700 focus:bg-white"
              />
            </div>
          </div>

          {/* Real-time projected stock indicator */}
          {currentProduct && (
            <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-stone-500 block">Stock Actual en Bodega:</span>
                <span className="font-bold text-stone-800">
                  {currentProduct.currentStock} {currentProduct.presentation}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-stone-500 block">Nuevo Stock Proyectado:</span>
                <span
                  className={`font-bold tabular-nums ${
                    projectedStock < 0
                      ? 'text-red-600'
                      : projectedStock <= currentProduct.minStock
                      ? 'text-amber-600'
                      : 'text-emerald-700'
                  }`}
                >
                  {projectedStock} {currentProduct.presentation}
                </span>
              </div>
            </div>
          )}

          {/* Entity (Supplier or Destination) & Operator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                {type === 'ENTRADA' ? 'Proveedor / Origen' : 'Cliente / Finca de Destino'}
              </label>
              <input
                type="text"
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                placeholder={type === 'ENTRADA' ? 'Ej. Yara International' : 'Ej. Hacienda El Edén - Lote 2'}
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                Responsable de Bodega
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="Nombre del operario"
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                required
              />
            </div>
          </div>

          {/* Batch & Reference Doc */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                Número de Lote (Batch)
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="Ej. LT-2026-99"
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-mono focus:ring-2 focus:ring-emerald-700 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">
                Doc. Soporte (Factura / Remisión)
              </label>
              <input
                type="text"
                value={referenceDocument}
                onChange={(e) => setReferenceDocument(e.target.value)}
                placeholder="Ej. Factura #FAC-2041 o Remisión #RM-55"
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Observaciones del Movimiento
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles adicionales sobre el transporte, condiciones del empaque o cultivo..."
              className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-emerald-700 focus:bg-white"
            />
          </div>

          {/* Submit button */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-5 py-2 text-white rounded-lg font-bold transition-colors cursor-pointer shadow-xs ${
                type === 'ENTRADA'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {type === 'ENTRADA' ? 'Confirmar Entrada (+)' : 'Confirmar Salida (-)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
