import QRCode from 'qrcode';

/**
 * Generate a QR Code as Data URL string
 */
export async function generateQrDataUrl(text: string, width = 180): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width,
      margin: 1,
      color: {
        dark: '#14281d', // Deep agro forest green
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
}

/**
 * Generates an SVG vector Barcode (Code-128 inspired) cleanly without heavy external runtime
 */
export function generateBarcodeSvg(code: string, width = 240, height = 60): string {
  // Deterministic pattern generator for clean visual barcode representation
  let pattern = '11010010000'; // Start code
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    const charCode = code.charCodeAt(i);
    hash = (hash * 31 + charCode) % 1000000;
    // Map charCode into 6-bit bar pattern
    const bits = (charCode * 7 + i * 13) % 64;
    const binStr = bits.toString(2).padStart(6, '0');
    // Convert 0/1 to varying widths
    for (const bit of binStr) {
      pattern += bit === '1' ? '11' : '0';
    }
    pattern += '0';
  }
  pattern += '1100011101011'; // Stop code

  const barWidth = width / pattern.length;
  let rects = '';
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') {
      const x = (i * barWidth).toFixed(2);
      rects += `<rect x="${x}" y="0" width="${barWidth.toFixed(2)}" height="${height}" fill="#111827" />`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${rects}</svg>`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    return `${d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} ${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return isoStr;
  }
}
