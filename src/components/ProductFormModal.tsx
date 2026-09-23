import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Plus,
  Save,
  Barcode,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Product, ProductCategory, ToxicityBand, CATEGORIES_CONFIG } from '../types/inventory';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSave: (productData: Partial<Product>) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: 'fertilizantes',
    sku: '',
    barcode: '',
    presentation: 'Saco 50 kg',
    currentStock: 10,
    minStock: 15,
    safetyStock: 5,
    maxStock: 50,
    unitCost: 50000,
    sellingPrice: 65000,
    location: 'Bodega 1 - Pasillo A - Estante 01',
    batchNumber: `LT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    expirationDate: '2028-12-31',
    activeIngredient: '',
    registrationNumber: 'ICA-0000-AGRO',
    supplier: 'Distribuidor Autorizado',
    toxicityBand: 'NO_APLICA',
    description: '',
    notes: '',
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData(productToEdit);
    } else {
      // Default new product template
      const randomCode = `770100${Math.floor(1000000 + Math.random() * 9000000)}`;
      setFormData({
        name: '',
        category: 'fertilizantes',
        sku: `AGRO-${Math.floor(100 + Math.random() * 900)}`,
        barcode: randomCode,
        presentation: 'Saco 50 kg',
        currentStock: 20,
        minStock: 15,
        safetyStock: 5,
        maxStock: 60,
        unitCost: 60000,
        sellingPrice: 78000,
        location: 'Bodega Central - Pasillo 1',
        batchNumber: `LT-2026-${Math.floor(100 + Math.random() * 900)}`,
        expirationDate: '2028-06-30',
        activeIngredient: '',
        registrationNumber: 'ICA-AGRO-2026',
        supplier: 'Yara / Syngenta / Nacional',
        toxicityBand: 'NO_APLICA',
        description: '',
        notes: '',
      });
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;
    onSave(formData);
    onClose();
  };

  const generateBarcodeRandom = () => {
    const code = `770100${Math.floor(1000000 + Math.random() * 9000000)}`;
    setFormData((prev) => ({ ...prev, barcode: code }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-5 bg-emerald-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-800 text-emerald-200 rounded-lg">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {productToEdit ? 'Editar Insumo Agrícola' : 'Registrar Nuevo Insumo Agrícola'}
              </h3>
              <p className="text-xs text-emerald-300/80">Distribuidora García · Base de Datos Central</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-850"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-stone-700 max-h-[75vh] overflow-y-auto">
          {/* Category & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Categoría</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: e.target.value as ProductCategory,
                  }))
                }
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-medium focus:ring-2 focus:ring-emerald-700"
              >
                {Object.values(CATEGORIES_CONFIG).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-stone-700 mb-1">Nombre Comercial del Insumo</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ej. Fertilizante NPK 15-15-15 o Semilla Maíz Dekalb"
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-bold focus:ring-2 focus:ring-emerald-700"
              />
            </div>
          </div>

          {/* SKU, Barcode, Presentation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Código SKU</label>
              <input
                type="text"
                required
                value={formData.sku || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                placeholder="Ej. FERT-NPK-15"
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-mono font-semibold"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-stone-700">Código de Barras</label>
                <button
                  type="button"
                  onClick={generateBarcodeRandom}
                  className="text-[10px] text-emerald-800 hover:underline"
                >
                  Generar
                </button>
              </div>
              <input
                type="text"
                required
                value={formData.barcode || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, barcode: e.target.value }))}
                placeholder="7701..."
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Presentación / Envase</label>
              <input
                type="text"
                required
                value={formData.presentation || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, presentation: e.target.value }))}
                placeholder="Ej. Saco 50 kg, Garrafa 20 L"
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900"
              />
            </div>
          </div>

          {/* Stocks row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-3 rounded-lg border border-stone-200">
            <div>
              <label className="block text-stone-600 mb-1 font-semibold">Stock Actual</label>
              <input
                type="number"
                min="0"
                value={formData.currentStock || 0}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, currentStock: parseInt(e.target.value) || 0 }))
                }
                className="w-full p-1.5 bg-white border border-stone-300 rounded text-stone-900 font-bold tabular-nums"
              />
            </div>
            <div>
              <label className="block text-stone-600 mb-1 font-semibold">Punto Reorden (Mín)</label>
              <input
                type="number"
                min="1"
                value={formData.minStock || 0}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, minStock: parseInt(e.target.value) || 1 }))
                }
                className="w-full p-1.5 bg-white border border-stone-300 rounded text-stone-900 font-bold tabular-nums"
              />
            </div>
            <div>
              <label className="block text-stone-600 mb-1 font-semibold">Stock Seguridad</label>
              <input
                type="number"
                min="0"
                value={formData.safetyStock || 0}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, safetyStock: parseInt(e.target.value) || 0 }))
                }
                className="w-full p-1.5 bg-white border border-stone-300 rounded text-stone-900 font-bold tabular-nums"
              />
            </div>
            <div>
              <label className="block text-stone-600 mb-1 font-semibold">Capacidad Máx.</label>
              <input
                type="number"
                min="1"
                value={formData.maxStock || 0}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, maxStock: parseInt(e.target.value) || 1 }))
                }
                className="w-full p-1.5 bg-white border border-stone-300 rounded text-stone-900 font-bold tabular-nums"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Costo Unitario Compra ($ COP)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.unitCost || 0}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))
                }
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-bold tabular-nums"
              />
            </div>
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Precio Venta al Agricultor ($ COP)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.sellingPrice || 0}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))
                }
                className="w-full p-2 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-950 font-extrabold tabular-nums"
              />
            </div>
          </div>

          {/* Batch, Expiration, Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Número de Lote (Batch)</label>
              <input
                type="text"
                value={formData.batchNumber || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, batchNumber: e.target.value }))}
                placeholder="Ej. LT-2026-X01"
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Fecha de Vencimiento</label>
              <input
                type="date"
                value={formData.expirationDate || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, expirationDate: e.target.value }))}
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Ubicación en Bodega</label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Ej. Bodega 1 - Pasillo C - Racks"
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900"
              />
            </div>
          </div>

          {/* Agronomic Technical Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Ingrediente Activo / Composición</label>
              <input
                type="text"
                value={formData.activeIngredient || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, activeIngredient: e.target.value }))}
                placeholder="Ej. Glifosato 480 g/L"
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Registro ICA / SAG / Oficial</label>
              <input
                type="text"
                value={formData.registrationNumber || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, registrationNumber: e.target.value }))}
                placeholder="Ej. ICA-0452-FERT"
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Banda Toxicológica</label>
              <select
                value={formData.toxicityBand || 'NO_APLICA'}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, toxicityBand: e.target.value as ToxicityBand }))
                }
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 font-medium"
              >
                <option value="NO_APLICA">No Aplica / Fertilizante / Herramienta</option>
                <option value="IV">Categoría IV - Ligeramente Tóxico (Verde)</option>
                <option value="III">Categoría III - Moderadamente Tóxico (Azul)</option>
                <option value="II">Categoría II - Altamente Tóxico (Amarillo)</option>
                <option value="I">Categoría I - Extremadamente Tóxico (Rojo)</option>
              </select>
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Proveedor / Fabricante</label>
            <input
              type="text"
              value={formData.supplier || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, supplier: e.target.value }))}
              placeholder="Ej. Yara International, Corteva, Bayer, Bellota"
              className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900"
            />
          </div>

          {/* Description & Notes */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Descripción y Dosis Recomendada</label>
            <textarea
              rows={2}
              value={formData.description || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Características generales, época de aplicación, cultivos recomendados..."
              className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900"
            />
          </div>

          {/* Actions */}
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
              <Save className="w-4 h-4" />
              <span>{productToEdit ? 'Guardar Cambios' : 'Registrar Insumo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
