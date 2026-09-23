import React, { useState } from 'react';
import {
  X,
  Receipt,
  Plus,
  Trash2,
  Printer,
  FileDown,
  CheckCircle,
  AlertCircle,
  User,
  Building,
  CreditCard,
  Package,
} from 'lucide-react';
import { Product, MovementReason } from '../types/inventory';
import { UserProfile } from '../types/auth';
import { formatCurrency, formatDate } from '../utils/barcodeUtils';
import { jsPDF } from 'jspdf';

interface SaleItem {
  product: Product;
  quantity: number;
  unitPrice: number;
}

interface InvoiceSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentUser: UserProfile;
  initialProduct?: Product | null;
  onConfirmSale: (
    items: { productId: string; quantity: number; unitPrice: number }[],
    customerName: string,
    customerNit: string,
    farmName: string,
    paymentMethod: string,
    invoiceNumber: string,
    sellerName: string
  ) => { success: boolean; message: string };
}

export const InvoiceSaleModal: React.FC<InvoiceSaleModalProps> = ({
  isOpen,
  onClose,
  products,
  currentUser,
  initialProduct,
  onConfirmSale,
}) => {
  const [invoiceNumber] = useState(`FAC-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [customerName, setCustomerName] = useState('Hacienda El Progreso');
  const [customerNit, setCustomerNit] = useState('901.340.112-9');
  const [farmName, setFarmName] = useState('Vereda El Manantial - Lote 4');
  const [paymentMethod, setPaymentMethod] = useState<'CONTADO' | 'TRANSFERENCIA' | 'CREDITO_30_DIAS'>('CONTADO');

  // Cart
  const [items, setItems] = useState<SaleItem[]>(() => {
    if (initialProduct) {
      return [{ product: initialProduct, quantity: 1, unitPrice: initialProduct.sellingPrice }];
    }
    const defaultProd = products.find((p) => p.currentStock > 0) || products[0];
    return defaultProd
      ? [{ product: defaultProd, quantity: 1, unitPrice: defaultProd.sellingPrice }]
      : [];
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedInvoice, setGeneratedInvoice] = useState<{
    invoiceNumber: string;
    date: string;
    total: number;
    items: SaleItem[];
    customerName: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const available = products.find(
      (p) => p.currentStock > 0 && !items.some((it) => it.product.id === p.id)
    );
    if (available) {
      setItems([...items, { product: available, quantity: 1, unitPrice: available.sellingPrice }]);
    } else if (products.length > 0) {
      setItems([...items, { product: products[0], quantity: 1, unitPrice: products[0].sellingPrice }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const updated = [...items];
    updated[index] = {
      product: prod,
      quantity: 1,
      unitPrice: prod.sellingPrice,
    };
    setItems(updated);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const updated = [...items];
    const max = updated[index].product.currentStock;
    const finalQty = Math.max(1, Math.min(qty, max));
    updated[index].quantity = finalQty;
    setItems(updated);
  };

  // Totals
  const subtotal = items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  const iva = 0; // Fertilizantes e insumos agroquímicos son exentos de IVA en normativa agropecuaria
  const total = subtotal + iva;

  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage('Debes agregar al menos un insumo agrícola para facturar.');
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage('Por favor ingresa el nombre del agricultor o cliente.');
      return;
    }

    // Verify stock availability
    for (const it of items) {
      if (it.quantity > it.product.currentStock) {
        setErrorMessage(
          `Stock insuficiente para "${it.product.name}". Disponible en bodega: ${it.product.currentStock} ${it.product.presentation}.`
        );
        return;
      }
    }

    const payload = items.map((it) => ({
      productId: it.product.id,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
    }));

    const result = onConfirmSale(
      payload,
      customerName,
      customerNit,
      farmName,
      paymentMethod,
      invoiceNumber,
      currentUser.name
    );

    if (result.success) {
      setGeneratedInvoice({
        invoiceNumber,
        date: new Date().toLocaleString('es-CO'),
        total,
        items: [...items],
        customerName,
      });
    } else {
      setErrorMessage(result.message);
    }
  };

  // Generate PDF Invoice
  const handleDownloadInvoicePdf = () => {
    if (!generatedInvoice) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 15;

    // Header
    doc.setFillColor(10, 42, 28);
    doc.rect(margin, y, pageWidth - margin * 2, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DISTRIBUIDORA GARCÍA S.A.S.', margin + 6, y + 8);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('NIT: 900.482.102-3 · Régimen Común · Distribución de Insumos Agrícolas', margin + 6, y + 13);
    doc.text('PBX: (601) 745-8900 · info@distribuidoragarcia.com', margin + 6, y + 18);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`FACTURA DE VENTA`, pageWidth - margin - 6, y + 8, { align: 'right' });
    doc.setFontSize(9);
    doc.text(`No. ${generatedInvoice.invoiceNumber}`, pageWidth - margin - 6, y + 14, { align: 'right' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${generatedInvoice.date}`, pageWidth - margin - 6, y + 19, { align: 'right' });

    y += 34;

    // Client box
    doc.setFillColor(248, 250, 248);
    doc.setDrawColor(220, 225, 220);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 1.5, 1.5, 'FD');

    doc.setTextColor(30, 40, 30);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL CLIENTE / AGRICULTOR:', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${customerName}`, margin + 4, y + 10);
    doc.text(`NIT / C.C: ${customerNit}`, margin + 4, y + 15);

    doc.text(`Finca / Destino: ${farmName || 'Entrega en Mostrador'}`, margin + 90, y + 10);
    doc.text(`Vendedor: ${currentUser.name} (${currentUser.roleTitle})`, margin + 90, y + 15);

    y += 26;

    // Table Header
    doc.setFillColor(235, 242, 237);
    doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
    doc.setTextColor(40, 60, 45);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('INSUMO AGRÍCOLA', margin + 3, y + 4.2);
    doc.text('LOTE', margin + 75, y + 4.2);
    doc.text('CANTIDAD', margin + 110, y + 4.2, { align: 'right' });
    doc.text('PRECIO UNIT.', margin + 145, y + 4.2, { align: 'right' });
    doc.text('SUBTOTAL', pageWidth - margin - 3, y + 4.2, { align: 'right' });

    y += 6;

    // Table rows
    generatedInvoice.items.forEach((it) => {
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
      doc.setDrawColor(240, 240, 240);
      doc.line(margin, y + 6, pageWidth - margin, y + 6);

      doc.setTextColor(30, 35, 30);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text(it.product.name.substring(0, 38), margin + 3, y + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.text(it.product.batchNumber, margin + 75, y + 4.2);
      doc.text(`${it.quantity} ${it.product.presentation}`, margin + 110, y + 4.2, { align: 'right' });
      doc.text(formatCurrency(it.unitPrice), margin + 145, y + 4.2, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(it.quantity * it.unitPrice), pageWidth - margin - 3, y + 4.2, { align: 'right' });

      y += 6;
    });

    // Total box
    y += 4;
    doc.setFillColor(248, 250, 248);
    doc.rect(pageWidth - margin - 70, y, 70, 16, 'F');
    doc.setDrawColor(200, 210, 200);
    doc.rect(pageWidth - margin - 70, y, 70, 16, 'S');

    doc.setTextColor(50, 60, 50);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', pageWidth - margin - 66, y + 5);
    doc.text(formatCurrency(generatedInvoice.total), pageWidth - margin - 4, y + 5, { align: 'right' });

    doc.text('IVA Agropecuario (0%):', pageWidth - margin - 66, y + 9);
    doc.text('$0', pageWidth - margin - 4, y + 9, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(10, 50, 25);
    doc.text('TOTAL A PAGAR:', pageWidth - margin - 66, y + 14);
    doc.text(formatCurrency(generatedInvoice.total), pageWidth - margin - 4, y + 14, { align: 'right' });

    // Footer
    y += 30;
    doc.setDrawColor(180, 190, 180);
    doc.line(margin + 20, y, margin + 80, y);
    doc.line(pageWidth - margin - 80, y, pageWidth - margin - 20, y);

    doc.setTextColor(40, 50, 40);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text('Firma y Sello Despacho Bodega', margin + 50, y + 4, { align: 'center' });
    doc.text('Firma y C.C. Recibido a Conformidad', pageWidth - margin - 50, y + 4, { align: 'center' });

    doc.save(`factura_${generatedInvoice.invoiceNumber}_distribuidora_garcia.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-emerald-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-800 text-emerald-200 rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Generar Factura y Registrar Venta</h3>
              <p className="text-xs text-emerald-300/80">
                Distribuidora García · Permiso autorizado para: {currentUser.name} ({currentUser.roleTitle})
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

        {/* Content: Form or Success Receipt View */}
        {generatedInvoice ? (
          <div className="p-6 space-y-5 text-xs text-stone-700">
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-xl text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-700 mx-auto" />
              <h4 className="text-base font-extrabold text-emerald-950">
                ¡Venta Registrada y Factura Generada con Éxito!
              </h4>
              <p className="text-xs text-emerald-800">
                Se actualizaron automáticamente las existencias en bodega y se emitió la factura{' '}
                <strong className="font-mono">{generatedInvoice.invoiceNumber}</strong>.
              </p>
            </div>

            {/* Quick Invoice Card */}
            <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-3 font-mono">
              <div className="flex justify-between border-b pb-2 text-[11px]">
                <span className="font-bold text-stone-900">DISTRIBUIDORA GARCÍA S.A.S.</span>
                <span>{generatedInvoice.invoiceNumber}</span>
              </div>
              <div className="text-[11px] text-stone-600 space-y-0.5">
                <div>Cliente: {generatedInvoice.customerName}</div>
                <div>Fecha: {generatedInvoice.date}</div>
                <div>Vendedor: {currentUser.name}</div>
              </div>
              <div className="border-t border-dashed pt-2 space-y-1 text-[11px]">
                {generatedInvoice.items.map((it) => (
                  <div key={it.product.id} className="flex justify-between">
                    <span>
                      {it.quantity}x {it.product.name}
                    </span>
                    <span className="font-bold">
                      {formatCurrency(it.quantity * it.unitPrice)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-stone-300 pt-2 flex justify-between font-bold text-sm text-stone-900">
                <span>TOTAL FACTURA:</span>
                <span className="text-emerald-800">{formatCurrency(generatedInvoice.total)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setGeneratedInvoice(null);
                  onClose();
                }}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-semibold transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Factura</span>
              </button>
              <button
                onClick={handleDownloadInvoicePdf}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors cursor-pointer shadow-xs"
              >
                <FileDown className="w-4 h-4" />
                <span>Descargar Factura en PDF</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitSale} className="p-6 space-y-4 text-xs text-stone-700 max-h-[75vh] overflow-y-auto">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Customer Details Box */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <span className="font-bold text-stone-900 text-xs uppercase tracking-wide">
                  Datos del Agricultor / Finca Compradora
                </span>
                <span className="font-mono text-[11px] text-stone-500 font-bold">
                  {invoiceNumber}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-stone-600 mb-1 font-semibold">
                    Nombre o Razón Social
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ej. Hacienda Las Palmas / Juan Pérez"
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-900 font-semibold focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 mb-1 font-semibold">
                    NIT / C.C.
                  </label>
                  <input
                    type="text"
                    required
                    value={customerNit}
                    onChange={(e) => setCustomerNit(e.target.value)}
                    placeholder="Ej. 900.123.456-7"
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-900 font-mono focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-semibold">
                    Ubicación / Finca / Vereda
                  </label>
                  <input
                    type="text"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="Ej. Vereda San Isidro - Finca La Esperanza"
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-900 focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 mb-1 font-semibold">
                    Condición de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg text-stone-900 font-medium focus:ring-1 focus:ring-emerald-700"
                  >
                    <option value="CONTADO">Contado / Efectivo</option>
                    <option value="TRANSFERENCIA">Transferencia Bancaria (Bancolombia/Davivienda)</option>
                    <option value="CREDITO_30_DIAS">Crédito Agrícola 30 días</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Insumos en la Factura */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-900 text-xs">
                  Insumos a Despachar y Facturar
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Insumo</span>
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-stone-50 border border-stone-200 rounded-lg flex flex-col sm:flex-row items-center gap-3"
                  >
                    {/* Product select */}
                    <div className="flex-1 w-full">
                      <select
                        value={item.product.id}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        className="w-full p-1.5 bg-white border border-stone-300 rounded text-stone-900 font-medium text-xs focus:ring-1 focus:ring-emerald-700"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} [{p.sku}] · Stock: {p.currentStock} {p.presentation}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="w-full sm:w-28 flex items-center gap-1.5">
                      <span className="text-stone-500 text-[10px]">Cant:</span>
                      <input
                        type="number"
                        min="1"
                        max={item.product.currentStock}
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value) || 1)}
                        className="w-full p-1 bg-white border border-stone-300 rounded text-center text-stone-900 font-bold tabular-nums"
                      />
                    </div>

                    {/* Price and Subtotal */}
                    <div className="w-full sm:w-40 text-right">
                      <div className="font-bold text-stone-900 tabular-nums">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </div>
                      <div className="text-[10px] text-stone-500 tabular-nums">
                        {formatCurrency(item.unitPrice)} c/u
                      </div>
                    </div>

                    {/* Delete item */}
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Quitar de la factura"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-800 font-semibold block">
                  Responsable de Venta
                </span>
                <span className="font-bold text-stone-900 text-xs">
                  {currentUser.name} · {currentUser.roleTitle}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-stone-600 block">Total a Facturar:</span>
                <span className="text-xl font-black text-emerald-950 tabular-nums">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
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
                className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Receipt className="w-4 h-4" />
                <span>Emitir Factura y Despachar Venta</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
