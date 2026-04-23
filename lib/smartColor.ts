export interface SmartColorResult {
  cardColor: string;
  textColor: string;
  confidence: number;
}

export async function extractColors(dataURI: string): Promise<SmartColorResult> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 100;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;

      // Compute average color
      let totalR = 0, totalG = 0, totalB = 0;
      let count = 0;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalR += r;
        totalG += g;
        totalB += b;
        count++;
      }

      const avgR = totalR / count;
      const avgG = totalG / count;
      const avgB = totalB / count;

      // Convert to HSL
      const [h, s, l] = rgbToHsl(avgR, avgG, avgB);

      // Compute color variance for confidence
      let variance = 0;
      for (let i = 0; i < data.length; i += 16) { // sample every 4th pixel
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        variance += Math.abs(r - avgR) + Math.abs(g - avgG) + Math.abs(b - avgB);
      }
      variance /= (count / 4);
      const confidence = Math.min(variance / 100, 1);

      // Card color: same hue, light pastel
      const cardS = Math.max(15, Math.min(s * 100, 40));
      const cardL = 84;
      const cardColor = hslToHex(h * 360, cardS, cardL);

      // Text color: same hue, dark
      const textS = Math.max(10, Math.min(s * 100, 30));
      const textL = 20;
      let textColor = hslToHex(h * 360, textS, textL);

      // Check WCAG contrast
      const cardRgb = hexToRgb(cardColor);
      let textRgb = hexToRgb(textColor);
      let contrast = getContrastRatio(cardRgb, textRgb);

      // Darken text if contrast is insufficient
      let adjustedL = textL;
      while (contrast < 4.5 && adjustedL > 5) {
        adjustedL -= 2;
        textColor = hslToHex(h * 360, textS, adjustedL);
        textRgb = hexToRgb(textColor);
        contrast = getContrastRatio(cardRgb, textRgb);
      }

      resolve({
        cardColor,
        textColor,
        confidence,
      });
    };
    img.src = dataURI;
  });
}

// --- Color math utilities ---

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const srgb = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

function getContrastRatio(
  rgb1: [number, number, number],
  rgb2: [number, number, number]
): number {
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
