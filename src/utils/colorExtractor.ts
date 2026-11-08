export interface ExtractedColorTheme {
  palette: [string, string, string];
  extractedHue: number;
  extractedSat: number;
  mattingBg: string;
  mattingBgDark: string;
  accentBtn: string;
  accentBtnDark: string;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const safeH = (((Number.isFinite(h) ? h : 0) % 360) + 360) % 360;
  const safeS = Math.max(0, Math.min(100, Number.isFinite(s) ? s : 0)) / 100;
  const safeL = Math.max(0, Math.min(100, Number.isFinite(l) ? l : 0)) / 100;
  const a = safeS * Math.min(safeL, 1 - safeL);
  const f = (n: number) => {
    const k = (n + safeH / 30) % 12;
    const color = safeL - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    const byte = Math.max(0, Math.min(255, Math.round(255 * color)));
    return byte.toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Normalize any CSS color string (#RGB, #RRGGBB, #RRGGBBAA, rgb(), rgba(), hsl(), hsla())
 * into a guaranteed-valid `rgba(r, g, b, alpha)` string so CSS radial-gradient stops never fail.
 */
export function withColorAlpha(color: string | undefined, alpha: number, fallbackHex: string = '#7C8F6E'): string {
  const clampedAlpha = Math.max(0, Math.min(1, Number.isFinite(alpha) ? alpha : 1));
  const parseRgb = (input: string): [number, number, number] | null => {
    const str = (input || '').trim();
    if (!str) return null;

    if (str.startsWith('#')) {
      const hex = str.slice(1).trim();
      if (/^[0-9a-fA-F]{3}$/.test(hex)) {
        const r = parseInt(hex[0] + hex[0], 16);
        const g = parseInt(hex[1] + hex[1], 16);
        const b = parseInt(hex[2] + hex[2], 16);
        return [r, g, b];
      }
      if (/^[0-9a-fA-F]{6}$/.test(hex) || /^[0-9a-fA-F]{8}$/.test(hex)) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return [r, g, b];
      }
      return null;
    }

    const rgbMatch = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
    if (rgbMatch) {
      const r = Math.max(0, Math.min(255, Math.round(Number(rgbMatch[1]))));
      const g = Math.max(0, Math.min(255, Math.round(Number(rgbMatch[2]))));
      const b = Math.max(0, Math.min(255, Math.round(Number(rgbMatch[3]))));
      return [r, g, b];
    }

    const hslMatch = str.match(/^hsla?\(\s*([-\d.]+)(?:deg)?\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/i);
    if (hslMatch) {
      const hex = hslToHex(Number(hslMatch[1]), Number(hslMatch[2]), Number(hslMatch[3]));
      return parseRgb(hex);
    }

    return null;
  };

  const rgb = parseRgb(color || '') || parseRgb(fallbackHex) || [124, 143, 110];
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${Number(clampedAlpha.toFixed(3))})`;
}

/**
 * Intelligent Dynamic Album Color Extractor
 * Uses a Vibrant/Chromatic weighting algorithm to sample album art canvas pixels,
 * prioritize chromatic accents over dull background studio greys,
 * and synthesize a cohesive 3-tone ambient light palette + Morandi matting.
 */
export async function extractDominantPalette(imageUrl: string): Promise<ExtractedColorTheme> {
  return new Promise((resolve) => {
    const fallbackTheme: ExtractedColorTheme = {
      palette: ['#7C8F6E', '#C4AC82', '#A69880'],
      extractedHue: 110,
      extractedSat: 25,
      mattingBg: 'hsl(110, 10%, 92%)',
      mattingBgDark: 'hsl(110, 12%, 14%)',
      accentBtn: 'hsl(110, 20%, 35%)',
      accentBtnDark: 'hsl(110, 25%, 45%)'
    };

    if (!imageUrl) {
      resolve(fallbackTheme);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(fallbackTheme);
          return;
        }

        const size = 64;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        
        // Color cluster buckets by quantized HSL
        interface ColorBucket {
          h: number;
          s: number;
          l: number;
          r: number;
          g: number;
          b: number;
          score: number;
          count: number;
        }

        const buckets: ColorBucket[] = [];

        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];

          const [h, s, l] = rgbToHsl(r, g, b);

          // Skip extreme shadows (< 10% lightness) and blown-out whites (> 94% lightness)
          if (l < 10 || l > 94) continue;

          // Vibrancy Scoring:
          // Reward saturated chromatic pixels over flat desaturated studio greys
          const satFactor = s > 15 ? Math.pow(s / 100, 1.4) : 0.04;
          const lumFactor = 1 - Math.abs(l - 50) / 60;
          const pixelScore = Math.max(0.05, satFactor * Math.max(0.2, lumFactor));

          // Quantize Hue into 15-degree buckets and Lightness into 15% buckets
          const qH = Math.round(h / 18) * 18;
          const qL = Math.round(l / 15) * 15;

          const existing = buckets.find(
            bkt => Math.abs(bkt.h - qH) < 18 && Math.abs(bkt.l - qL) < 20
          );

          if (existing) {
            existing.count += 1;
            existing.score += pixelScore;
            // Running weighted average
            existing.r = Math.round((existing.r + r) / 2);
            existing.g = Math.round((existing.g + g) / 2);
            existing.b = Math.round((existing.b + b) / 2);
            existing.s = Math.round((existing.s + s) / 2);
          } else {
            buckets.push({
              h: qH,
              s,
              l: qL,
              r,
              g,
              b,
              score: pixelScore,
              count: 1
            });
          }
        }

        if (buckets.length === 0) {
          resolve(fallbackTheme);
          return;
        }

        // Sort buckets by vibrancy score
        buckets.sort((a, b) => b.score - a.score);

        // 1. Primary tone (Most vibrant significant color)
        const primary = buckets[0];
        const primaryHue = primary.h;
        const primarySat = Math.max(22, Math.min(65, primary.s));

        // 2. Secondary tone (Find harmonized or contrasting distinct hue/saturation)
        let secondary = buckets.find(
          bkt => Math.abs(bkt.h - primaryHue) > 30 && bkt.s > 15
        ) || buckets[1] || primary;

        // 3. Tertiary tone (Warm/Cool atmospheric balance)
        let tertiary = buckets.find(
          bkt => bkt !== primary && bkt !== secondary && (Math.abs(bkt.h - primaryHue) > 20 || Math.abs(bkt.l - primary.l) > 20)
        ) || buckets[2] || buckets[1] || primary;

        // Synthesize calibrated luminous ambient glow colors
        // Ensure ambient glow has adequate chromatic depth (45-55% lightness, calibrated saturation)
        const glow1 = hslToHex(primary.h, Math.max(32, Math.min(58, primary.s + 8)), 50);
        const glow2 = hslToHex(
          secondary.h,
          Math.max(28, Math.min(52, secondary.s + 5)),
          Math.min(62, Math.max(42, secondary.l))
        );
        const glow3 = hslToHex(
          tertiary.h,
          Math.max(24, Math.min(48, tertiary.s)),
          Math.min(60, Math.max(38, tertiary.l))
        );

        // Calculate Morandi matting background & high-contrast accent button
        const dominantHue = primary.h;
        const dominantSat = primary.s;

        const mattingBg = `hsl(${dominantHue}, ${Math.min(14, Math.max(6, dominantSat))}%, 92%)`;
        const mattingBgDark = `hsl(${dominantHue}, ${Math.min(18, Math.max(8, dominantSat))}%, 14%)`;
        const accentBtn = `hsl(${dominantHue}, 24%, 34%)`;
        const accentBtnDark = `hsl(${dominantHue}, 28%, 46%)`;

        resolve({
          palette: [glow1, glow2, glow3],
          extractedHue: dominantHue,
          extractedSat: dominantSat,
          mattingBg,
          mattingBgDark,
          accentBtn,
          accentBtnDark
        });
      } catch (err) {
        console.warn('Canvas color extraction error, falling back:', err);
        resolve(fallbackTheme);
      }
    };

    img.onerror = () => {
      resolve(fallbackTheme);
    };
  });
}

/**
 * Injects RGB or HEX colors into CSS root variables
 */
export function applyAmbientGlowColors(colors: [string, string, string]) {
  const root = document.documentElement;
  if (colors?.[0]) root.style.setProperty('--ambient-glow-1', colors[0]);
  if (colors?.[1]) root.style.setProperty('--ambient-glow-2', colors[1]);
  if (colors?.[2]) root.style.setProperty('--ambient-glow-3', colors[2]);
}
