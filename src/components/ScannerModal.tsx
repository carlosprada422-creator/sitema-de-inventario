import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Search,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  Info,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Product } from '../types/inventory';
import { CATEGORIES_CONFIG } from '../types/inventory';
import { formatCurrency, formatDate } from '../utils/barcodeUtils';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onQuickMovement: (product: Product, type: 'ENTRADA' | 'SALIDA') => void;
  onViewDetails: (product: Product) => void;
  onPrintLabel: (product: Product) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onQuickMovement,
  onViewDetails,
  onPrintLabel,
}) => {
  const [activeMode, setActiveMode] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [matchedProduct, setMatchedProduct] = useState<Product | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Stop camera helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsScanning(false);
  };

  // Start camera helper
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La cámara no está soportada en este navegador o entorno.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
        startBarcodeDetection();
      }
    } catch (err: unknown) {
      console.warn('Camera access unavailable:', err);
      const msg = err instanceof Error ? err.message : 'No se pudo acceder a la cámara.';
      setCameraError(
        msg.includes('Permission')
          ? 'Permiso de cámara denegado. Puedes usar la búsqueda manual o los códigos de prueba rápidos abajo.'
          : 'Cámara no disponible en este dispositivo. Puedes buscar por código de barras o SKU manualmente.'
      );
      setActiveMode('manual');
    }
  };

  const startBarcodeDetection = () => {
    // Check if window.BarcodeDetector is natively supported
    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'ean_13', 'ean_8', 'code_39', 'upc_a'],
        });

        const detectFrame = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            animationFrameRef.current = requestAnimationFrame(detectFrame);
            return;
          }
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const detectedValue = barcodes[0].rawValue;
              handleCodeIdentified(detectedValue);
              return;
            }
          } catch (e) {
            // non fatal frame error
          }
          animationFrameRef.current = requestAnimationFrame(detectFrame);
        };

        animationFrameRef.current = requestAnimationFrame(detectFrame);
      } catch (e) {
        console.warn('Native BarcodeDetector not initialized', e);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeMode === 'camera') {
        startCamera();
      }
    } else {
      stopCamera();
      setMatchedProduct(null);
      setManualCode('');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeMode]);

  const handleCodeIdentified = (code: string) => {
    const cleaned = code.trim().toLowerCase();
    const found = products.find(
      (p) =>
        p.barcode.toLowerCase() === cleaned ||
        p.sku.toLowerCase() === cleaned ||
        p.id.toLowerCase() === cleaned ||
        cleaned.includes(p.barcode.toLowerCase()) ||
        cleaned.includes(p.sku.toLowerCase())
    );

    if (found) {
      setMatchedProduct(found);
      stopCamera();
    } else {
      setMatchedProduct(null);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeIdentified(manualCode);
  };

  // Preset quick scans for testing immediately
  const sampleScanItems = [
    { label: 'Urea 46% N (Fertilizante)', code: '7701001002341' },
    { label: 'Semilla Maíz Dekalb DK-7088', code: '7701002001015' },
    { label: 'Glifosato 480 SL (Plaguicida)', code: '7701003003018' },
    { label: 'Fumigadora Royal Cóndor 20L', code: '7701004004014' },
    { label: 'Cinta de Goteo Rivulis', code: '7701005005010' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-950 text-white border-b border-emerald-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-800/80 rounded-lg text-emerald-300">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Lector de Códigos QR y Barras</h3>
              <p className="text-xs text-emerald-300/80">Consulta y registro inmediato de insumos agrícolas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Mode Switcher */}
          <div className="flex items-center justify-center">
            <div className="flex p-1 bg-stone-100 rounded-lg border border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setActiveMode('camera');
                  setMatchedProduct(null);
                }}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeMode === 'camera'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Cámara en Tiempo Real
              </button>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setActiveMode('manual');
                }}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeMode === 'manual'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Búsqueda Manual / Lector USB
              </button>
            </div>
          </div>

          {/* Camera Viewport */}
          {activeMode === 'camera' && !matchedProduct && (
            <div className="relative rounded-lg overflow-hidden bg-stone-900 aspect-video flex items-center justify-center border border-stone-800">
              {cameraError ? (
                <div className="p-6 text-center text-stone-300 max-w-sm">
                  <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs text-stone-300 mb-3">{cameraError}</p>
                  <button
                    onClick={() => setActiveMode('manual')}
                    className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-500 font-medium"
                  >
                    Usar Búsqueda por Código
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder Target */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="relative w-64 h-48 border-2 border-emerald-400/80 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-300" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-300" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-300" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-300" />
                      {/* Laser animated bar */}
                      <div className="w-full h-0.5 bg-emerald-400 absolute top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_8px_#34d399]" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 text-center text-xs text-stone-200 bg-stone-900/80 px-3 py-1 rounded-full">
                    Apunta la cámara al código QR o código de barras
                  </div>
                </>
              )}
            </div>
          )}

          {/* Manual Input Form */}
          {activeMode === 'manual' && !matchedProduct && (
            <form onSubmit={handleManualSearch} className="space-y-3">
              <label className="block text-xs font-semibold text-stone-700">
                Código de Barras (EAN-13 / Code-128) o Código SKU del Insumo
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => {
                    setManualCode(e.target.value);
                    if (e.target.value.length >= 8) {
                      handleCodeIdentified(e.target.value);
                    }
                  }}
                  placeholder="Ej. 7701001002341 o FERT-URE-01..."
                  autoFocus
                  className="w-full pl-10 pr-24 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent font-mono"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 px-3 py-1.5 bg-emerald-800 text-white rounded text-xs font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Consultar
                </button>
              </div>
              <p className="text-[11px] text-stone-500">
                Compatible con pistolas lectoras USB conectadas al equipo o digitación manual rápida.
              </p>
            </form>
          )}

          {/* Quick Demo Simulator Buttons */}
          {!matchedProduct && (
            <div className="pt-3 border-t border-stone-200">
              <span className="text-xs font-semibold text-stone-600 block mb-2">
                Simulación Rápida de Escaneo de Insumos:
              </span>
              <div className="flex flex-wrap gap-2">
                {sampleScanItems.map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setManualCode(item.code);
                      handleCodeIdentified(item.code);
                    }}
                    className="px-2.5 py-1 text-xs bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-stone-700 border border-stone-200 rounded-md transition-colors cursor-pointer"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Match Found: Product Card & Quick Actions */}
          {matchedProduct && (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-800 tracking-wide uppercase">
                      Insumo Encontrado en Base de Datos
                    </span>
                    <h4 className="text-base font-bold text-stone-900 mt-0.5">{matchedProduct.name}</h4>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-stone-600 mt-1">
                      <span>SKU: <strong className="font-mono text-stone-800">{matchedProduct.sku}</strong></span>
                      <span>·</span>
                      <span>Código: <strong className="font-mono text-stone-800">{matchedProduct.barcode}</strong></span>
                      <span>·</span>
                      <span>{CATEGORIES_CONFIG[matchedProduct.category].label}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setMatchedProduct(null);
                    setManualCode('');
                    if (activeMode === 'camera') startCamera();
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 p-1"
                  title="Escanear otro insumo"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Escanear otro</span>
                </button>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-emerald-100 text-xs">
                <div>
                  <span className="text-stone-500 block">Stock Actual</span>
                  <span
                    className={`font-bold text-sm tabular-nums ${
                      matchedProduct.currentStock <= matchedProduct.minStock
                        ? 'text-red-700'
                        : 'text-stone-900'
                    }`}
                  >
                    {matchedProduct.currentStock} {matchedProduct.presentation}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">Punto Reorden</span>
                  <span className="font-semibold text-stone-800 tabular-nums">
                    {matchedProduct.minStock} unidades
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">Ubicación Bodega</span>
                  <span className="font-semibold text-stone-800 truncate block" title={matchedProduct.location}>
                    {matchedProduct.location}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">Lote / Vencimiento</span>
                  <span className="font-semibold text-stone-800 tabular-nums">
                    {formatDate(matchedProduct.expirationDate)}
                  </span>
                </div>
              </div>

              {/* Operational Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onQuickMovement(matchedProduct, 'ENTRADA');
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <ArrowDownLeft className="w-4 h-4 text-emerald-200" />
                  <span>Registrar Entrada (+)</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onQuickMovement(matchedProduct, 'SALIDA');
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <ArrowUpRight className="w-4 h-4 text-amber-200" />
                  <span>Registrar Salida (-)</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onViewDetails(matchedProduct);
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-stone-300"
                >
                  <Info className="w-4 h-4 text-stone-600" />
                  <span>Ficha Agronómica</span>
                </button>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    onClose();
                    onPrintLabel(matchedProduct);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 font-medium"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Generar etiqueta adhesiva QR</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
