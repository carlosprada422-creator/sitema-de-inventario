import { jsPDF } from 'jspdf';
import { Product, StockMovement, CATEGORIES_CONFIG } from '../types/inventory';
import { formatCurrency, formatDate } from './barcodeUtils';

interface GeneratePdfOptions {
  monthStr: string; // '2026-09'
  products: Product[];
  monthMovements: StockMovement[];
  authorName: string;
  authorRole: string;
}

export function generateMonthlyReportPdf({
  monthStr,
  products,
  monthMovements,
  authorName,
  authorRole,
}: GeneratePdfOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const [year, month] = monthStr.split('-');
  const monthsEs = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const monthName = `${monthsEs[parseInt(month, 10) - 1]} de ${year}`;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  let y = 14;

  // --- HEADER BANNER ---
  doc.setFillColor(10, 42, 28); // Deep agricultural forest green #0a2a1c
  doc.rect(margin, y, pageWidth - margin * 2, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DISTRIBUIDORA GARCÍA S.A.S.', margin + 6, y + 8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('NIT: 900.482.102-3 · Sede Central y Bodegas de Distribución Agrícola', margin + 6, y + 13);
  doc.text('Sistema de Gestión, Trazabilidad y Control de Insumos', margin + 6, y + 18);

  // Right-aligned report tag
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE OFICIAL DE MOVIMIENTOS', pageWidth - margin - 6, y + 9, { align: 'right' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Periodo: ${monthName}`, pageWidth - margin - 6, y + 15, { align: 'right' });
  doc.text(`Emisión: ${new Date().toLocaleDateString('es-CO')}`, pageWidth - margin - 6, y + 19, { align: 'right' });

  y += 30;

  // --- CALCULATION OF METRICS ---
  let totalSalidasUnits = 0;
  let totalSalidasVal = 0;
  let totalEntradasUnits = 0;
  let totalEntradasVal = 0;

  const categoryTotals: Record<string, { units: number; val: number }> = {};
  const productTotals: Record<string, { name: string; sku: string; units: number; val: number }> = {};

  monthMovements.forEach((m) => {
    if (m.type === 'SALIDA') {
      totalSalidasUnits += m.quantity;
      const v = m.totalCost || m.quantity * m.unitCost;
      totalSalidasVal += v;

      if (!categoryTotals[m.category]) {
        categoryTotals[m.category] = { units: 0, val: 0 };
      }
      categoryTotals[m.category].units += m.quantity;
      categoryTotals[m.category].val += v;

      if (!productTotals[m.productId]) {
        productTotals[m.productId] = { name: m.productName, sku: m.sku, units: 0, val: 0 };
      }
      productTotals[m.productId].units += m.quantity;
      productTotals[m.productId].val += v;
    } else if (m.type === 'ENTRADA') {
      totalEntradasUnits += m.quantity;
      totalEntradasVal += m.totalCost || m.quantity * m.unitCost;
    }
  });

  const totalCurrentStockUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
  const totalValuation = products.reduce((acc, p) => acc + p.currentStock * p.unitCost, 0);
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStock).length;

  // --- KPI SUMMARY BOXES ---
  doc.setTextColor(20, 30, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Resumen Ejecutivo de Operaciones del Periodo', margin, y);
  y += 4;

  const boxWidth = (pageWidth - margin * 2 - 9) / 4;
  const boxHeight = 16;

  const kpis = [
    { title: 'TOTAL SALIDAS', val: `${totalSalidasUnits} uds`, sub: formatCurrency(totalSalidasVal), color: [245, 158, 11] },
    { title: 'TOTAL ENTRADAS', val: `+${totalEntradasUnits} uds`, sub: formatCurrency(totalEntradasVal), color: [16, 149, 106] },
    { title: 'VALORACIÓN STOCK', val: formatCurrency(totalValuation), sub: `${totalCurrentStockUnits} uds en bodega`, color: [14, 116, 144] },
    { title: 'ALERTAS DE STOCK', val: `${lowStockCount} insumos`, sub: 'Bajo stock mínimo', color: [220, 38, 38] },
  ];

  kpis.forEach((kpi, idx) => {
    const bx = margin + idx * (boxWidth + 3);
    doc.setFillColor(248, 250, 248);
    doc.setDrawColor(220, 225, 220);
    doc.roundedRect(bx, y, boxWidth, boxHeight, 1.5, 1.5, 'FD');

    // Colored left indicator strip
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.rect(bx, y, 2.5, boxHeight, 'F');

    doc.setTextColor(100, 110, 100);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.title, bx + 5, y + 4.5);

    doc.setTextColor(20, 30, 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(kpi.val, bx + 5, y + 9.5);

    doc.setTextColor(110, 120, 110);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.sub, bx + 5, y + 13.5);
  });

  y += boxHeight + 8;

  // --- SECTION: CONSUMPTION BY AGRICULTURAL CATEGORY ---
  doc.setTextColor(20, 30, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Desglose de Consumo por Categoría Agrícola', margin, y);
  y += 4;

  // Table header
  doc.setFillColor(235, 242, 237);
  doc.rect(margin, y, pageWidth - margin * 2, 5.5, 'F');
  doc.setTextColor(40, 60, 45);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('CATEGORÍA DE INSUMO', margin + 3, y + 3.8);
  doc.text('UNIDADES DESPACHADAS', margin + 95, y + 3.8, { align: 'right' });
  doc.text('PARTICIPACIÓN %', margin + 135, y + 3.8, { align: 'right' });
  doc.text('TOTAL FACTURADO (COP)', pageWidth - margin - 3, y + 3.8, { align: 'right' });
  y += 5.5;

  Object.entries(CATEGORIES_CONFIG).forEach(([key, cfg]) => {
    const data = categoryTotals[key] || { units: 0, val: 0 };
    const pct = totalSalidasUnits > 0 ? ((data.units / totalSalidasUnits) * 100).toFixed(1) : '0.0';

    doc.setFillColor(255, 255, 255);
    doc.rect(margin, y, pageWidth - margin * 2, 5, 'F');
    doc.setDrawColor(240, 240, 240);
    doc.line(margin, y + 5, pageWidth - margin, y + 5);

    doc.setTextColor(30, 35, 30);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(cfg.label, margin + 3, y + 3.5);
    doc.text(`${data.units} uds`, margin + 95, y + 3.5, { align: 'right' });
    doc.text(`${pct}%`, margin + 135, y + 3.5, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(data.val), pageWidth - margin - 3, y + 3.5, { align: 'right' });

    y += 5;
  });

  y += 7;

  // --- SECTION: TOP PRODUCTS CONSUMED ---
  doc.setTextColor(20, 30, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Insumos con Mayor Rotación en el Mes (Top 5)', margin, y);
  y += 4;

  const topList = Object.values(productTotals)
    .sort((a, b) => b.units - a.units)
    .slice(0, 5);

  doc.setFillColor(235, 242, 237);
  doc.rect(margin, y, pageWidth - margin * 2, 5.5, 'F');
  doc.setTextColor(40, 60, 45);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('#', margin + 3, y + 3.8);
  doc.text('INSUMO AGRÍCOLA', margin + 10, y + 3.8);
  doc.text('SKU', margin + 90, y + 3.8);
  doc.text('CANTIDAD', margin + 125, y + 3.8, { align: 'right' });
  doc.text('VALOR TOTAL', pageWidth - margin - 3, y + 3.8, { align: 'right' });
  y += 5.5;

  if (topList.length === 0) {
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(7);
    doc.text('No se registraron salidas de producto en este periodo mensual.', margin + 3, y + 4);
    y += 6;
  } else {
    topList.forEach((it, idx) => {
      doc.setFillColor(idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252, idx % 2 === 0 ? 255 : 250);
      doc.rect(margin, y, pageWidth - margin * 2, 5, 'F');
      doc.setDrawColor(240, 240, 240);
      doc.line(margin, y + 5, pageWidth - margin, y + 5);

      doc.setTextColor(30, 35, 30);
      doc.setFontSize(7);
      doc.text(`${idx + 1}`, margin + 3, y + 3.5);
      doc.setFont('helvetica', 'bold');
      doc.text(it.name.substring(0, 45), margin + 10, y + 3.5);
      doc.setFont('helvetica', 'normal');
      doc.text(it.sku, margin + 90, y + 3.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`${it.units} uds`, margin + 125, y + 3.5, { align: 'right' });
      doc.text(formatCurrency(it.val), pageWidth - margin - 3, y + 3.5, { align: 'right' });
      y += 5;
    });
  }

  y += 7;

  // --- SECTION: CURRENT INVENTORY LEVELS & LOW STOCK ALERTS ---
  doc.setTextColor(20, 30, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Niveles de Stock Actuales y Puntos de Reorden (Auditoría de Bodega)', margin, y);
  y += 4;

  doc.setFillColor(235, 242, 237);
  doc.rect(margin, y, pageWidth - margin * 2, 5.5, 'F');
  doc.setTextColor(40, 60, 45);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('PRODUCTO', margin + 3, y + 3.8);
  doc.text('UBICACIÓN', margin + 70, y + 3.8);
  doc.text('STOCK ACTUAL', margin + 115, y + 3.8, { align: 'right' });
  doc.text('MÍNIMO', margin + 135, y + 3.8, { align: 'right' });
  doc.text('ESTADO', margin + 155, y + 3.8);
  doc.text('VALOR INVENTARIO', pageWidth - margin - 3, y + 3.8, { align: 'right' });
  y += 5.5;

  // Sample or full low-stock / critical products first
  const sortedForReport = [...products].sort((a, b) => {
    const aLow = a.currentStock <= a.minStock ? 1 : 0;
    const bLow = b.currentStock <= b.minStock ? 1 : 0;
    return bLow - aLow;
  });

  const displayProducts = sortedForReport.slice(0, 10); // First 10 items for first page balance

  displayProducts.forEach((p, idx) => {
    const isCritical = p.currentStock <= p.safetyStock;
    const isLow = p.currentStock <= p.minStock;
    const statusText = isCritical ? 'CRÍTICO' : isLow ? 'BAJO STOCK' : 'ÓPTIMO';

    doc.setFillColor(idx % 2 === 0 ? 255 : 252, idx % 2 === 0 ? 255 : 252, idx % 2 === 0 ? 255 : 252);
    doc.rect(margin, y, pageWidth - margin * 2, 4.8, 'F');
    doc.setDrawColor(240, 240, 240);
    doc.line(margin, y + 4.8, pageWidth - margin, y + 4.8);

    doc.setTextColor(30, 35, 30);
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.text(p.name.substring(0, 38), margin + 3, y + 3.3);
    doc.setFont('helvetica', 'normal');
    doc.text(p.location.substring(0, 24), margin + 70, y + 3.3);

    // Stock count
    if (isCritical) {
      doc.setTextColor(200, 30, 30);
      doc.setFont('helvetica', 'bold');
    } else if (isLow) {
      doc.setTextColor(180, 100, 0);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(30, 35, 30);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(`${p.currentStock}`, margin + 115, y + 3.3, { align: 'right' });

    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`${p.minStock}`, margin + 135, y + 3.3, { align: 'right' });

    // Status label
    if (isCritical) {
      doc.setTextColor(200, 30, 30);
      doc.setFont('helvetica', 'bold');
    } else if (isLow) {
      doc.setTextColor(180, 100, 0);
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setTextColor(20, 130, 60);
      doc.setFont('helvetica', 'normal');
    }
    doc.text(statusText, margin + 155, y + 3.3);

    doc.setTextColor(30, 35, 30);
    doc.setFont('helvetica', 'normal');
    doc.text(formatCurrency(p.currentStock * p.unitCost), pageWidth - margin - 3, y + 3.3, { align: 'right' });

    y += 4.8;
  });

  // --- FOOTER SIGNATURES & OFFICIAL SEALS ---
  y = pageHeight - 34;

  doc.setDrawColor(180, 190, 180);
  doc.line(margin + 15, y, margin + 75, y);
  doc.line(pageWidth - margin - 75, y, pageWidth - margin - 15, y);

  doc.setTextColor(40, 50, 40);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(authorName || 'Ing. Carlos García', margin + 45, y + 4, { align: 'center' });
  doc.text('Supervisión de Auditoría y Logística', pageWidth - margin - 45, y + 4, { align: 'center' });

  doc.setTextColor(120, 130, 120);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(authorRole || 'Administrador General · Distribuidora García', margin + 45, y + 7.5, { align: 'center' });
  doc.text('Control Interno de Existencias', pageWidth - margin - 45, y + 7.5, { align: 'center' });

  // Page numbering
  doc.setFontSize(6.5);
  doc.setTextColor(140, 140, 140);
  doc.text(
    `Documento Oficial generado automáticamente por Distribuidora García · Página 1 de 1 · Fecha: ${new Date().toLocaleString('es-CO')}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  return doc;
}
