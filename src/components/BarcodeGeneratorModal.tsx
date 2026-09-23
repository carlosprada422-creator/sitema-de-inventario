import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  QrCode,
  Barcode,
  Layers,
  CheckCircle,
  Copy,
  Tag,
} from 'lucide-react';
import { Product, CATEGORIES_CONFIG } from '../types/inventory';
import { generateQrDataUrl, generateBarcodeSvg, formatCurrency, formatDate } from '../utils/barcodeUtils';

interface BarcodeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  allProducts: Product[];
  onSelectProduct: (p: Product) => void;
}

export const BarcodeGeneratorModal: React.FC<BarcodeGeneratorModalProps> = ({
  isOpen,
  onClose,
  product,
  allProducts,
  onSelectProduct,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [labelSize, setLabelSize] = useState<'standard' | 'shelf' | 'compact'>('standard');

  useEffect(() => {
    if (product) {
      // Build structured payload for QR (can be read by any standard scanner or our app)
      const qrData = JSON.stringify({
        distribuidor: 'Distribuidora García',
        sku: product.sku,
        barcode: product.barcode,
        nombre: product.name,
        lote: product.batchNumber,
        vence: product.expirationDate,
        ica: product.registrationNumber,
      });

      generateQrDataUrl(qrData, 220).then(setQrUrl);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const barcodeSvgHtml = generateBarcodeSvg(product.barcode, 260, 54);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(product.barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-emerald-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-800 text-emerald-200 rounded-lg">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Generador de Etiquetas QR y Código de Barras</h3>
              <p className="text-xs text-emerald-300/80">Etiquetas técnicas para sacos, canecas y estanterías</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-850"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-stone-700">
          {/* Product selector in case user wants to switch */}
          <div>
            <label className="block text-stone-700 font-semibold mb-1">
              Seleccionar Insumo para Etiquetado
            </label>
            <select
              value={product.id}
              onChange={(e) => {
                const found = allProducts.find((p) => p.id === e.target.value);
                if (found) onSelectProduct(found);
              }}
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-medium focus:ring-2 focus:ring-emerald-700 focus:bg-white"
            >
              {allProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} [{p.sku}] - Lote: {p.batchNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Label preview formatted as a thermal warehouse sticker */}
          <div className="border border-stone-300 bg-stone-100/60 p-4 rounded-xl flex flex-col items-center">
            <span className="text-[11px] font-semibold text-stone-500 mb-2 uppercase tracking-wide">
              Vista Previa de Etiqueta Adhesiva
            </span>

            {/* Printable Label Box */}
            <div
              id="printable-label"
              className="printable-area bg-white border-2 border-stone-800 rounded-lg p-4 w-full max-w-sm shadow-md text-stone-900 space-y-3 font-sans"
            >
              {/* Distributor Brand Top */}
              <div className="flex items-center justify-between border-b border-stone-300 pb-2">
                <div>
                  <div className="text-xs font-black uppercase tracking-tight text-emerald-950">
                    Distribuidora García
                  </div>
                  <div className="text-[9px] text-stone-500 font-medium">
                    Control Oficial de Insumos Agrícolas
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] bg-emerald-950 text-white px-1.5 py-0.5 rounded font-bold uppercase">
                    {product.category}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div>
                <h4 className="font-extrabold text-sm leading-tight text-stone-900">
                  {product.name}
                </h4>
                <div className="text-[11px] text-stone-600 mt-0.5 font-medium">
                  {product.presentation} · Reg: {product.registrationNumber}
                </div>
              </div>

              {/* QR and Barcode Visuals */}
              <div className="flex items-center justify-between gap-3 py-1">
                {qrUrl && (
                  <div className="flex flex-col items-center">
                    <img
                      src={qrUrl}
                      alt="Código QR"
                      className="w-24 h-24 border border-stone-200 rounded"
                    />
                    <span className="text-[8px] text-stone-500 font-mono mt-0.5">SCAN QR</span>
                  </div>
                )}

                <div className="flex-1 flex flex-col items-center justify-center space-y-1">
                  <div
                    className="overflow-hidden flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: barcodeSvgHtml }}
                  />
                  <div className="font-mono text-xs font-bold tracking-widest text-stone-800">
                    {product.barcode}
                  </div>
                  <div className="text-[10px] text-stone-500 font-semibold">
                    SKU: {product.sku}
                  </div>
                </div>
              </div>

              {/* Logistics & Batch footer */}
              <div className="border-t border-stone-300 pt-2 grid grid-cols-2 text-[10px] text-stone-600 gap-1">
                <div>
                  <span>Lote:</span>{' '}
                  <strong className="text-stone-900 font-mono">{product.batchNumber}</strong>
                </div>
                <div className="text-right">
                  <span>Vence:</span>{' '}
                  <strong className="text-stone-900 tabular-nums">
                    {formatDate(product.expirationDate)}
                  </strong>
                </div>
                <div className="col-span-2 text-stone-500 truncate">
                  Ubicación: <strong className="text-stone-800">{product.location}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Quick copy code and metadata */}
          <div className="flex items-center justify-between bg-stone-50 p-3 rounded-lg border border-stone-200">
            <div className="space-y-0.5">
              <span className="text-[11px] text-stone-500 block">Código EAN-13 / Barra</span>
              <span className="font-mono font-bold text-xs text-stone-900">{product.barcode}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded font-medium transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-500" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex items-center justify-between">
          <span className="text-xs text-stone-500">
            Compatible con impresoras térmicas Zebra, Xprinter y formatos estándar.
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Etiqueta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
