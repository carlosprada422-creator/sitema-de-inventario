export type ProductCategory =
  | 'fertilizantes'
  | 'semillas'
  | 'plaguicidas'
  | 'herramientas'
  | 'riego'
  | 'nutricion_enmienda'
  | 'epp';

export interface CategoryInfo {
  id: ProductCategory;
  label: string;
  description: string;
  color: string;
}

export const CATEGORIES_CONFIG: Record<ProductCategory, CategoryInfo> = {
  fertilizantes: {
    id: 'fertilizantes',
    label: 'Fertilizantes y Granulados',
    description: 'Urea, NPK, fosfatos, abonos edáficos y foliares',
    color: 'emerald',
  },
  semillas: {
    id: 'semillas',
    label: 'Semillas Certificadas',
    description: 'Maíz, hortalizas, pastos forrajeros y café',
    color: 'amber',
  },
  plaguicidas: {
    id: 'plaguicidas',
    label: 'Fitosanitarios y Plaguicidas',
    description: 'Herbicidas, fungicidas, insecticidas y acaricidas',
    color: 'red',
  },
  herramientas: {
    id: 'herramientas',
    label: 'Herramientas de Campo',
    description: 'Fumigadoras, machetes, palas, podadoras y aspersores',
    color: 'stone',
  },
  riego: {
    id: 'riego',
    label: 'Sistemas de Riego',
    description: 'Cintas de goteo, microaspersores, tuberías y acoples',
    color: 'sky',
  },
  nutricion_enmienda: {
    id: 'nutricion_enmienda',
    label: 'Enmiendas y Nutrición',
    description: 'Cal dolomítica, yeso agrícola, materia orgánica y quelatos',
    color: 'lime',
  },
  epp: {
    id: 'epp',
    label: 'Equipos de Protección (EPP)',
    description: 'Máscaras con filtro químico, trajes Tyvek, guantes y botas',
    color: 'violet',
  },
};

export type ToxicityBand = 'I' | 'II' | 'III' | 'IV' | 'NO_APLICA';

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: ProductCategory;
  description: string;
  presentation: string; // ej. Saco 50 kg, Garrafa 20 L, Galón 4 L, Paquete 1 kg, Unidad
  currentStock: number;
  minStock: number; // Punto de reorden
  safetyStock: number; // Stock de seguridad crítico
  maxStock: number; // Capacidad recomendada en bodega
  unitCost: number; // Precio de compra en COP o USD
  sellingPrice: number; // Precio al productor
  location: string; // ej. Bodega 1 - Pasillo B - Estante 04
  batchNumber: string; // Número de lote de fábrica
  expirationDate: string | null; // YYYY-MM-DD
  activeIngredient?: string; // ej. Nitrógeno 46%, Mancozeb 800 g/kg
  registrationNumber: string; // Registro ICA / SENASICA / SAG
  supplier: string; // ej. Yara, Syngenta, Bayer, Bellota
  toxicityBand: ToxicityBand;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

export type MovementReason =
  | 'COMPRA_PROVEEDOR'
  | 'VENTA_CLIENTE'
  | 'DEVOLUCION_PROVEEDOR'
  | 'DEVOLUCION_CLIENTE'
  | 'MERMA_DETERIORO'
  | 'CONSUMO_INTERNO'
  | 'AJUSTE_INVENTARIO'
  | 'TRASLADO_FINCA';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  category: ProductCategory;
  type: MovementType;
  reason: MovementReason;
  quantity: number;
  previousStock: number;
  newStock: number;
  unitCost: number;
  totalCost: number;
  date: string; // ISO string
  operator: string; // Responsable en bodega
  entity: string; // Proveedor (si es entrada) o Cliente/Finca (si es salida)
  batchNumber: string;
  referenceDocument?: string; // Factura o Remisión
  notes?: string;
}

export interface PurchaseOrderRecommendation {
  productId: string;
  productName: string;
  sku: string;
  category: ProductCategory;
  currentStock: number;
  minStock: number;
  maxStock: number;
  suggestedReorderQuantity: number;
  unitCost: number;
  estimatedTotalCost: number;
  supplier: string;
  urgency: 'CRITICA' | 'ALTA' | 'MODERADA';
}
