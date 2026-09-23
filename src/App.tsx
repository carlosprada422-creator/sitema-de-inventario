import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Scan,
  AlertTriangle,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  Info,
  Receipt,
} from 'lucide-react';
import { Product, StockMovement, MovementType, MovementReason } from './types/inventory';
import { UserRole, UserProfile, USER_ROLES_PROFILES } from './types/auth';
import {
  getStoredProducts,
  saveStoredProducts,
  getStoredMovements,
  saveStoredMovements,
  executeMovement,
  getLowStockAlerts,
  resetToSeedData,
  exportDatabaseBackup,
  importDatabaseBackup,
  deleteStoredProduct,
} from './services/storage';
import { Navbar, NavTab } from './components/Navbar';
import { ProductCatalog } from './components/ProductCatalog';
import { MovementsView } from './components/MovementsView';
import { AlertsView } from './components/AlertsView';
import { MonthlyReportsView } from './components/MonthlyReportsView';
import { LabelsView } from './components/LabelsView';
import { ScannerModal } from './components/ScannerModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { MovementModal } from './components/MovementModal';
import { BarcodeGeneratorModal } from './components/BarcodeGeneratorModal';
import { ProductFormModal } from './components/ProductFormModal';
import { PdfExportModal } from './components/PdfExportModal';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { InvoiceSaleModal } from './components/InvoiceSaleModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';

// Generated image asset
import agroWarehouseImg from './assets/images/agro_warehouse_supplies_1790181212182.jpg';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [activeTab, setActiveTab] = useState<NavTab>('catalog');

  // User Roles and Permissions State
  const [currentUser, setCurrentUser] = useState<UserProfile>(USER_ROLES_PROFILES['admin']);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [labelProduct, setLabelProduct] = useState<Product | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementTargetProduct, setMovementTargetProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<MovementType>('ENTRADA');

  // Product Create & Edit & Delete
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Invoice & Sales POS Modal
  const [isInvoiceSaleOpen, setIsInvoiceSaleOpen] = useState(false);
  const [saleInitialProduct, setSaleInitialProduct] = useState<Product | null>(null);

  // PDF Export Modal State
  const [isPdfExportOpen, setIsPdfExportOpen] = useState(false);
  const [pdfSelectedMonth, setPdfSelectedMonth] = useState('2026-09');

  // User feedback toast
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  // Initialize data from local storage
  useEffect(() => {
    const loadedProducts = getStoredProducts();
    const loadedMovements = getStoredMovements();
    setProducts(loadedProducts);
    setMovements(loadedMovements);
  }, []);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Critical alerts count for badge in navbar
  const alerts = useMemo(() => getLowStockAlerts(products), [products]);
  const totalAlertCount = alerts.critical.length + alerts.low.length;

  // Handler: Registering movement (Entrada / Salida)
  const handleConfirmMovement = (
    productId: string,
    type: MovementType,
    reason: MovementReason,
    quantity: number,
    operator: string,
    entity: string,
    batchNumber?: string,
    referenceDocument?: string,
    notes?: string
  ) => {
    const result = executeMovement(
      productId,
      type,
      reason,
      quantity,
      operator,
      entity,
      batchNumber,
      referenceDocument,
      notes
    );

    if (result.success) {
      setProducts(getStoredProducts());
      setMovements(getStoredMovements());
      showToast(result.message, 'success');
    }
    return result;
  };

  // Quick movement trigger (from product row, card or scanner)
  const handleOpenQuickMovement = (product: Product, type: MovementType) => {
    // If employee and trying to register an ENTRADA, redirect to sale/factura or restrict
    if (currentUser.role === 'empleado' && type === 'ENTRADA') {
      showToast(
        'Acceso restringido: Los empleados solo tienen permitido generar facturas y realizar ventas.',
        'error'
      );
      setIsRoleSwitcherOpen(true);
      return;
    }
    setMovementTargetProduct(product);
    setMovementType(type);
    setIsMovementModalOpen(true);
  };

  // Handler: Create or Edit product
  const handleSaveProduct = (productData: Partial<Product>) => {
    // Check permission
    if (productToEdit && !currentUser.permissions.canEditProduct) {
      showToast('Permiso denegado: Solo el Administrador puede editar insumos.', 'error');
      return;
    }
    if (!productToEdit && !currentUser.permissions.canCreateProduct) {
      showToast('Permiso denegado: Solo el Administrador puede agregar nuevos insumos.', 'error');
      return;
    }

    const currentList = [...products];

    if (productToEdit) {
      // Update existing
      const index = currentList.findIndex((p) => p.id === productToEdit.id);
      if (index !== -1) {
        currentList[index] = {
          ...currentList[index],
          ...productData,
          updatedAt: new Date().toISOString(),
        } as Product;
        saveStoredProducts(currentList);
        setProducts(currentList);
        showToast(`Insumo "${productData.name}" editado y actualizado con éxito.`);
      }
    } else {
      // Create new
      const newProduct: Product = {
        id: `prod-${Date.now()}`,
        sku: productData.sku || `SKU-${Date.now().toString().slice(-4)}`,
        barcode: productData.barcode || `770100${Math.floor(1000000 + Math.random() * 9000000)}`,
        name: productData.name || 'Nuevo Insumo Agrícola',
        category: productData.category || 'fertilizantes',
        description: productData.description || '',
        presentation: productData.presentation || 'Saco 50 kg',
        currentStock: Number(productData.currentStock) || 0,
        minStock: Number(productData.minStock) || 10,
        safetyStock: Number(productData.safetyStock) || 5,
        maxStock: Number(productData.maxStock) || 50,
        unitCost: Number(productData.unitCost) || 0,
        sellingPrice: Number(productData.sellingPrice) || 0,
        location: productData.location || 'Bodega Principal',
        batchNumber: productData.batchNumber || `LT-${new Date().getFullYear()}`,
        expirationDate: productData.expirationDate || null,
        activeIngredient: productData.activeIngredient || '',
        registrationNumber: productData.registrationNumber || 'ICA-0000',
        supplier: productData.supplier || 'Distribuidor Oficial',
        toxicityBand: productData.toxicityBand || 'NO_APLICA',
        notes: productData.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      currentList.unshift(newProduct);
      saveStoredProducts(currentList);
      setProducts(currentList);
      showToast(`Insumo "${newProduct.name}" registrado en la base de datos de Distribuidora García.`);
    }
  };

  // Handler: Delete product
  const handleDeleteProduct = (productId: string) => {
    if (!currentUser.permissions.canDeleteProduct) {
      showToast('Permiso denegado: Solo el Administrador puede eliminar insumos.', 'error');
      return;
    }
    const res = deleteStoredProduct(productId);
    if (res.success) {
      setProducts(getStoredProducts());
      showToast(res.message, 'success');
      if (detailProduct?.id === productId) {
        setDetailProduct(null);
      }
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handler: Confirm Sale & Generate Invoice (Accessible by both Empleado & Admin)
  const handleConfirmSale = (
    items: { productId: string; quantity: number; unitPrice: number }[],
    customerName: string,
    customerNit: string,
    farmName: string,
    paymentMethod: string,
    invoiceNumber: string,
    sellerName: string
  ): { success: boolean; message: string } => {
    try {
      for (const item of items) {
        const prod = products.find((p) => p.id === item.productId);
        const res = executeMovement(
          item.productId,
          'SALIDA',
          'VENTA_CLIENTE',
          item.quantity,
          sellerName,
          `${customerName} (${customerNit}) - ${farmName || 'Despacho'}`,
          prod?.batchNumber,
          invoiceNumber,
          `Venta en mostrador / Pago: ${paymentMethod}`
        );
        if (!res.success) {
          return { success: false, message: res.message };
        }
      }

      setProducts(getStoredProducts());
      setMovements(getStoredMovements());
      showToast(`Factura ${invoiceNumber} generada y venta registrada exitosamente.`, 'success');
      return { success: true, message: 'Venta registrada con éxito.' };
    } catch (e) {
      return { success: false, message: 'Error procesando la venta.' };
    }
  };

  // 1-Click Automated Restock from Alerts View (Admin only)
  const handleAutoRestockAll = (recommendations: any[]) => {
    if (!currentUser.permissions.canAutoRestock) {
      showToast('Acceso restringido: Solo el Administrador puede autorizar compras de reposición.', 'error');
      return;
    }

    let successCount = 0;
    recommendations.forEach((rec) => {
      const res = executeMovement(
        rec.productId,
        'ENTRADA',
        'COMPRA_PROVEEDOR',
        rec.suggestedReorderQuantity,
        `${currentUser.name} (Distribuidora García)`,
        rec.supplier,
        `LT-REORD-${new Date().getFullYear()}`,
        `Orden Reposición #${Date.now().toString().slice(-5)}`,
        'Reabastecimiento automático generado por alerta de stock bajo.'
      );
      if (res.success) successCount++;
    });

    setProducts(getStoredProducts());
    setMovements(getStoredMovements());
    showToast(
      `Se reabastecieron automáticamente ${successCount} insumos agrícolas a sus niveles óptimos.`,
      'success'
    );
  };

  // Reset to initial authentic demo data (Admin only)
  const handleResetData = () => {
    if (!currentUser.permissions.canResetDatabase) {
      showToast('Acceso restringido: Solo el Administrador puede restablecer la base de datos.', 'error');
      return;
    }

    if (
      window.confirm(
        '¿Deseas restablecer el inventario al catálogo inicial con 20 insumos agrícolas y registros de prueba de Distribuidora García?'
      )
    ) {
      const { products: p, movements: m } = resetToSeedData();
      setProducts(p);
      setMovements(m);
      showToast('Base de datos restablecida al estado inicial.', 'info');
    }
  };

  // Export JSON backup
  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `distribuidora_garcia_inventario_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Copia de seguridad del inventario descargada con éxito.');
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col text-stone-900 font-sans">
      {/* Top Navbar Contract */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenNewProduct={() => {
          if (!currentUser.permissions.canCreateProduct) {
            showToast('Solo el Administrador tiene permiso para agregar nuevos insumos.', 'error');
            setIsRoleSwitcherOpen(true);
            return;
          }
          setProductToEdit(null);
          setIsProductFormOpen(true);
        }}
        onOpenInvoiceSale={() => {
          setSaleInitialProduct(null);
          setIsInvoiceSaleOpen(true);
        }}
        criticalAlertCount={totalAlertCount}
        currentUser={currentUser}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toastMessage.type === 'error'
                ? 'bg-red-900 text-white border-red-700'
                : 'bg-stone-900 text-white border-stone-700'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Agricultural Warehouse Header Banner */}
        <div className="mb-6 rounded-2xl overflow-hidden border border-emerald-900/20 shadow-sm relative bg-emerald-950 text-white">
          <div className="relative h-44 sm:h-52 w-full overflow-hidden">
            <img
              src={agroWarehouseImg}
              alt="Almacén Distribuidora García"
              className="w-full h-full object-cover opacity-35"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-950/85 to-transparent" />
            <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-center max-w-2xl">
              <span className="text-emerald-400 text-xs font-extrabold uppercase tracking-widest">
                Distribuidora García · Centro Logístico Agrícola
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white text-balance">
                Gestión de Inventario, Trazabilidad y Despacho en Tiempo Real
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200/90 mt-2 line-clamp-2">
                Monitoreo de existencias de fertilizantes, semillas certificadas, agroquímicos,
                herramientas y riego con integración de códigos QR y códigos de barras.
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        {activeTab === 'catalog' && (
          <ProductCatalog
            products={products}
            onOpenQuickMovement={handleOpenQuickMovement}
            onOpenProductDetails={(p) => setDetailProduct(p)}
            onOpenPrintLabel={(p) => setLabelProduct(p)}
            onEditProduct={(p) => {
              if (!currentUser.permissions.canEditProduct) {
                showToast('Solo el Administrador puede editar los insumos.', 'error');
                setIsRoleSwitcherOpen(true);
                return;
              }
              setProductToEdit(p);
              setIsProductFormOpen(true);
            }}
            onDeleteProduct={(p) => {
              if (!currentUser.permissions.canDeleteProduct) {
                showToast('Solo el Administrador puede eliminar insumos.', 'error');
                setIsRoleSwitcherOpen(true);
                return;
              }
              setProductToDelete(p);
            }}
            onOpenNewProduct={() => {
              if (!currentUser.permissions.canCreateProduct) {
                showToast('Solo el Administrador puede agregar nuevos insumos.', 'error');
                setIsRoleSwitcherOpen(true);
                return;
              }
              setProductToEdit(null);
              setIsProductFormOpen(true);
            }}
            onOpenScanner={() => setIsScannerOpen(true)}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'movements' && (
          <MovementsView
            movements={movements}
            onOpenNewMovement={() => {
              setMovementTargetProduct(products[0] || null);
              setMovementType(currentUser.role === 'empleado' ? 'SALIDA' : 'ENTRADA');
              setIsMovementModalOpen(true);
            }}
            onOpenInvoiceSale={() => {
              setSaleInitialProduct(null);
              setIsInvoiceSaleOpen(true);
            }}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            products={products}
            onQuickRestock={(p) => handleOpenQuickMovement(p, 'ENTRADA')}
            onAutoRestockAll={handleAutoRestockAll}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'reports' && (
          <MonthlyReportsView
            products={products}
            movements={movements}
            currentUser={currentUser}
            onOpenPdfExport={(month) => {
              setPdfSelectedMonth(month);
              setIsPdfExportOpen(true);
            }}
          />
        )}

        {activeTab === 'labels' && (
          <LabelsView
            products={products}
            onOpenLabelDetail={(p) => setLabelProduct(p)}
          />
        )}
      </main>

      {/* Global Modals */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        onQuickMovement={handleOpenQuickMovement}
        onViewDetails={(p) => setDetailProduct(p)}
        onPrintLabel={(p) => setLabelProduct(p)}
      />

      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onOpenMovement={handleOpenQuickMovement}
        onPrintLabel={(p) => setLabelProduct(p)}
        onEditProduct={(p) => {
          if (!currentUser.permissions.canEditProduct) {
            showToast('Solo el Administrador puede editar los insumos.', 'error');
            setIsRoleSwitcherOpen(true);
            return;
          }
          setProductToEdit(p);
          setIsProductFormOpen(true);
        }}
        onDeleteProduct={(p) => {
          if (!currentUser.permissions.canDeleteProduct) {
            showToast('Solo el Administrador puede eliminar insumos.', 'error');
            setIsRoleSwitcherOpen(true);
            return;
          }
          setProductToDelete(p);
        }}
        currentUser={currentUser}
      />

      <MovementModal
        isOpen={isMovementModalOpen}
        onClose={() => {
          setIsMovementModalOpen(false);
          setMovementTargetProduct(null);
        }}
        products={products}
        initialProduct={movementTargetProduct}
        initialType={movementType}
        currentUserName={currentUser.name}
        currentUser={currentUser}
        onConfirmMovement={handleConfirmMovement}
      />

      <BarcodeGeneratorModal
        isOpen={!!labelProduct}
        onClose={() => setLabelProduct(null)}
        product={labelProduct}
        allProducts={products}
        onSelectProduct={(p) => setLabelProduct(p)}
      />

      {/* Product Form Modal (Crear y Editar Insumo) */}
      <ProductFormModal
        isOpen={isProductFormOpen}
        onClose={() => {
          setIsProductFormOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
        onSave={handleSaveProduct}
      />

      {/* Delete Product Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        product={productToDelete}
        onConfirmDelete={handleDeleteProduct}
      />

      {/* Sales Invoicing POS Modal (Venta y Factura) */}
      <InvoiceSaleModal
        isOpen={isInvoiceSaleOpen}
        onClose={() => {
          setIsInvoiceSaleOpen(false);
          setSaleInitialProduct(null);
        }}
        products={products}
        currentUser={currentUser}
        initialProduct={saleInitialProduct}
        onConfirmSale={handleConfirmSale}
      />

      {/* PDF Export Modal */}
      <PdfExportModal
        isOpen={isPdfExportOpen}
        onClose={() => setIsPdfExportOpen(false)}
        products={products}
        movements={movements}
        selectedMonth={pdfSelectedMonth}
        currentUser={currentUser}
      />

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
        currentUser={currentUser}
        onSelectRole={(role) => {
          const profile = USER_ROLES_PROFILES[role];
          setCurrentUser(profile);
          showToast(`Perfil cambiado a: ${profile.name} (${profile.roleTitle})`, 'info');
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 mt-12 py-6 text-stone-500 text-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-stone-800">Distribuidora García</span>
            <span className="mx-2">·</span>
            <span>Sistema Integral de Inventario de Insumos Agrícolas</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleDownloadBackup}
              className="hover:text-stone-900 transition-colors flex items-center gap-1 cursor-pointer"
              title="Descargar copia de seguridad en JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Copia de Seguridad JSON</span>
            </button>
            <span>·</span>
            <button
              onClick={handleResetData}
              className="hover:text-stone-900 transition-colors flex items-center gap-1 cursor-pointer text-stone-400 hover:text-stone-600"
              title="Restablecer base de datos inicial"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer Datos Demo</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
