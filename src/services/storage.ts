import {
  Product,
  StockMovement,
  PurchaseOrderRecommendation,
  MovementType,
  MovementReason,
} from '../types/inventory';
import { INITIAL_PRODUCTS, INITIAL_MOVEMENTS } from '../data/seedData';

const PRODUCTS_STORAGE_KEY = 'distribuidora_garcia_products_v1';
const MOVEMENTS_STORAGE_KEY = 'distribuidora_garcia_movements_v1';

export function getStoredProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading products from localStorage', e);
    return INITIAL_PRODUCTS;
  }
}

export function saveStoredProducts(products: Product[]): void {
  try {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  } catch (e) {
    console.error('Error saving products to localStorage', e);
  }
}

export function getStoredMovements(): StockMovement[] {
  try {
    const raw = localStorage.getItem(MOVEMENTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(INITIAL_MOVEMENTS));
      return INITIAL_MOVEMENTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading movements from localStorage', e);
    return INITIAL_MOVEMENTS;
  }
}

export function saveStoredMovements(movements: StockMovement[]): void {
  try {
    localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(movements));
  } catch (e) {
    console.error('Error saving movements to localStorage', e);
  }
}

export function deleteStoredProduct(productId: string): { success: boolean; message: string } {
  try {
    const products = getStoredProducts();
    const target = products.find((p) => p.id === productId);
    if (!target) {
      return { success: false, message: 'El producto no fue encontrado en inventario.' };
    }
    const filtered = products.filter((p) => p.id !== productId);
    saveStoredProducts(filtered);
    return {
      success: true,
      message: `El insumo "${target.name}" ha sido eliminado exitosamente del catálogo.`,
    };
  } catch (e) {
    return { success: false, message: 'Ocurrió un error al eliminar el producto.' };
  }
}

export function resetToSeedData(): { products: Product[]; movements: StockMovement[] } {
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem(MOVEMENTS_STORAGE_KEY, JSON.stringify(INITIAL_MOVEMENTS));
  return { products: INITIAL_PRODUCTS, movements: INITIAL_MOVEMENTS };
}

export function exportDatabaseBackup(): string {
  const data = {
    distributor: 'Distribuidora García',
    exportedAt: new Date().toISOString(),
    version: '1.0',
    products: getStoredProducts(),
    movements: getStoredMovements(),
  };
  return JSON.stringify(data, null, 2);
}

export function importDatabaseBackup(jsonString: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.products || !Array.isArray(parsed.products)) {
      return { success: false, message: 'El archivo JSON no contiene una lista válida de productos.' };
    }
    saveStoredProducts(parsed.products);
    if (parsed.movements && Array.isArray(parsed.movements)) {
      saveStoredMovements(parsed.movements);
    }
    return { success: true, message: 'Base de datos restaurada con éxito.' };
  } catch (e) {
    return { success: false, message: 'Error procesando el archivo JSON.' };
  }
}

export function executeMovement(
  productId: string,
  type: MovementType,
  reason: MovementReason,
  quantity: number,
  operator: string,
  entity: string,
  batchNumber?: string,
  referenceDocument?: string,
  notes?: string
): { success: boolean; message: string; updatedProduct?: Product } {
  const products = getStoredProducts();
  const productIndex = products.findIndex((p) => p.id === productId);

  if (productIndex === -1) {
    return { success: false, message: 'Producto no encontrado en inventario.' };
  }

  const product = products[productIndex];
  const prevStock = product.currentStock;
  let newStock = prevStock;

  if (type === 'ENTRADA') {
    newStock = prevStock + quantity;
  } else if (type === 'SALIDA') {
    if (prevStock < quantity) {
      return {
        success: false,
        message: `Stock insuficiente. Stock actual: ${prevStock} ${product.presentation}, cantidad solicitada: ${quantity}`,
      };
    }
    newStock = prevStock - quantity;
  } else if (type === 'AJUSTE') {
    newStock = quantity;
  }

  const updatedProduct: Product = {
    ...product,
    currentStock: newStock,
    batchNumber: batchNumber || product.batchNumber,
    updatedAt: new Date().toISOString(),
  };

  products[productIndex] = updatedProduct;
  saveStoredProducts(products);

  const newMovement: StockMovement = {
    id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    category: product.category,
    type,
    reason,
    quantity,
    previousStock: prevStock,
    newStock,
    unitCost: product.unitCost,
    totalCost: product.unitCost * quantity,
    date: new Date().toISOString(),
    operator: operator.trim() || 'Operario de Bodega',
    entity: entity.trim() || (type === 'ENTRADA' ? product.supplier : 'Cliente General'),
    batchNumber: batchNumber || product.batchNumber,
    referenceDocument: referenceDocument?.trim(),
    notes: notes?.trim(),
  };

  const movements = getStoredMovements();
  movements.unshift(newMovement);
  saveStoredMovements(movements);

  return {
    success: true,
    message: `Movimiento de ${type === 'ENTRADA' ? 'Entrada' : 'Salida'} registrado exitosamente. Nuevo stock: ${newStock}`,
    updatedProduct,
  };
}

export function getLowStockAlerts(products: Product[]): {
  critical: Product[];
  low: Product[];
  expiringSoon: Product[];
  expired: Product[];
} {
  const critical: Product[] = [];
  const low: Product[] = [];
  const expiringSoon: Product[] = [];
  const expired: Product[] = [];

  const now = new Date();
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(now.getDate() + 60);

  for (const p of products) {
    if (p.currentStock <= p.safetyStock) {
      critical.push(p);
    } else if (p.currentStock <= p.minStock) {
      low.push(p);
    }

    if (p.expirationDate) {
      const exp = new Date(p.expirationDate);
      if (exp < now) {
        expired.push(p);
      } else if (exp <= sixtyDaysFromNow) {
        expiringSoon.push(p);
      }
    }
  }

  return { critical, low, expiringSoon, expired };
}

export function generatePurchaseRecommendations(products: Product[]): PurchaseOrderRecommendation[] {
  const recommendations: PurchaseOrderRecommendation[] = [];

  for (const p of products) {
    if (p.currentStock <= p.minStock) {
      const deficit = Math.max(0, p.maxStock - p.currentStock);
      if (deficit > 0) {
        const urgency =
          p.currentStock === 0
            ? 'CRITICA'
            : p.currentStock <= p.safetyStock
            ? 'ALTA'
            : 'MODERADA';

        recommendations.push({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          category: p.category,
          currentStock: p.currentStock,
          minStock: p.minStock,
          maxStock: p.maxStock,
          suggestedReorderQuantity: deficit,
          unitCost: p.unitCost,
          estimatedTotalCost: deficit * p.unitCost,
          supplier: p.supplier,
          urgency,
        });
      }
    }
  }

  // Sort by urgency: CRITICA -> ALTA -> MODERADA
  const order: Record<string, number> = { CRITICA: 1, ALTA: 2, MODERADA: 3 };
  return recommendations.sort((a, b) => (order[a.urgency] || 99) - (order[b.urgency] || 99));
}
