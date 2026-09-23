import React, { useState } from 'react';
import {
  X,
  FileDown,
  Printer,
  FileText,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { Product, StockMovement, CATEGORIES_CONFIG } from '../types/inventory';
import { UserProfile } from '../types/auth';
import { generateMonthlyReportPdf } from '../utils/pdfReportGenerator';
import { formatCurrency, formatDate } from '../utils/barcodeUtils';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: string;
  products: Product[];
  movements: StockMovement[];
  currentUser: UserProfile;
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  products,
  movements,
  currentUser,
}) => {
  const [authorName, setAuthorName] = useState(currentUser.name);
  const [authorRole, setAuthorRole] = useState(currentUser.roleTitle);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const [year, month] = selectedMonth.split('-');
  const monthsEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const monthName = `${monthsEs[parseInt(month, 10) - 1]} ${year}`;

  const monthMovements = movements.filter((m) => m.date.startsWith(selectedMonth));

  const totalExits = monthMovements
    .filter((m) => m.type === 'SALIDA')
    .reduce((acc, m) => acc + m.quantity, 0);

  const totalEntries = monthMovements
    .filter((m) => m.type === 'ENTRADA')
    .reduce((acc, m) => acc + m.quantity, 0);

  const totalValuation = products.reduce((acc, p) => acc + p.currentStock * p.unitCost, 0);

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    try {
      const doc = generateMonthlyReportPdf({
        monthStr: selectedMonth,
        products,
        monthMovements,
        authorName,
        authorRole,
      });

      const fileName = `reporte_mensual_${selectedMonth}_distribuidora_garcia.pdf`;
      doc.save(fileName);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-emerald-950 text-white border-b border-emerald-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-800 text-emerald-200 rounded-lg">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Exportar Reporte Mensual a PDF</h3>
              <p className="text-xs text-emerald-300/80">
                Distribuidora García · Resumen profesional de movimientos y niveles de stock
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-850"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-stone-700 max-h-[75vh] overflow-y-auto">
          {/* Document Summary Card */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="font-bold text-stone-900 text-xs uppercase tracking-wide">
                Configuración del Documento Oficial
              </span>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                Formato A4 PDF
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-600 mb-1 font-semibold">
                  Responsable que Firma el Informe
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-300 rounded text-stone-900 font-medium text-xs focus:ring-1 focus:ring-emerald-700"
                  />
                  <User className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-semibold">
                  Cargo / Rol Operativo
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-stone-300 rounded text-stone-900 font-medium text-xs focus:ring-1 focus:ring-emerald-700"
                  />
                  <ShieldCheck className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics to be Included in PDF */}
          <div>
            <h4 className="font-bold text-stone-900 text-xs mb-2">
              Datos Compilados para el Informe ({monthName}):
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-white p-3 rounded-lg border border-stone-200 text-center">
                <span className="text-[10px] text-stone-500 uppercase block font-semibold">Salidas</span>
                <span className="text-base font-extrabold text-amber-700 tabular-nums">
                  {totalExits} uds
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-stone-200 text-center">
                <span className="text-[10px] text-stone-500 uppercase block font-semibold">Entradas</span>
                <span className="text-base font-extrabold text-emerald-800 tabular-nums">
                  +{totalEntries} uds
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-stone-200 text-center">
                <span className="text-[10px] text-stone-500 uppercase block font-semibold">Valoración Total</span>
                <span className="text-sm font-extrabold text-stone-900 tabular-nums">
                  {formatCurrency(totalValuation)}
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-stone-200 text-center">
                <span className="text-[10px] text-stone-500 uppercase block font-semibold">Movimientos</span>
                <span className="text-base font-extrabold text-stone-800 tabular-nums">
                  {monthMovements.length} ops
                </span>
              </div>
            </div>
          </div>

          {/* Features contained in PDF */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg text-emerald-950 space-y-1.5">
            <span className="font-bold text-xs flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-700" />
              <span>Contenido incluido en el resumen ejecutivo PDF:</span>
            </span>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-900 pl-1">
              <li>Membrete oficial con NIT, razón social y datos de contacto de Distribuidora García.</li>
              <li>Resumen de operaciones del periodo mensual con KPIs financieros y unidades.</li>
              <li>Consumo discriminado por categorías agrícolas (fertilizantes, semillas, plaguicidas, etc.).</li>
              <li>Top 5 de insumos con mayor rotación en el periodo.</li>
              <li>Auditoría de existencias físicas con identificación de insumos en alerta de stock bajo.</li>
              <li>Firmas de autorización para Administrador y Supervisor de Bodega.</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Vista Previa</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>
                {isGenerating
                  ? 'Generando PDF...'
                  : downloadSuccess
                  ? '¡PDF Descargado!'
                  : 'Descargar Reporte en PDF'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
