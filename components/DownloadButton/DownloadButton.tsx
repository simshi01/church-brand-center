'use client';

import { useState, useCallback, useRef } from 'react';
import { Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useToast } from '@/lib/toastContext';
import { debugLog } from '@/lib/debugLog';
import styles from './DownloadButton.module.css';

type DownloadVariant = 'full' | 'icon' | 'block';

interface DownloadButtonProps {
  templateId: string;
  variantCode: string;
  format: 'png' | 'pdf';
  fields: Record<string, string>;
  getScreenElement: () => HTMLElement | null;
  width: number;
  height: number;
  variant?: DownloadVariant;
}

const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualzQAAAABJRU5ErkJggg==';

const MIN_EXPECTED_PNG_BYTES = 40 * 1024;

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

function srcPreview(src: string): string {
  if (!src) return '<empty>';
  if (!src.startsWith('data:')) return src;
  const [head, rest] = src.split(',');
  return `${head}, ${rest ? rest.length : 0}B`;
}

export default function DownloadButton({
  templateId,
  variantCode,
  format,
  fields,
  getScreenElement,
  width,
  height,
  variant = 'full',
}: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const inFlightRef = useRef(false);
  const { showToast } = useToast();

  const notifySuccess = useCallback(() => {
    if (isIOS() && format === 'png') {
      showToast(
        'Готово! Удерживай изображение и выбери «Сохранить в Фото»',
        'success',
        4500
      );
    } else {
      showToast('Готово!', 'success');
    }
  }, [format, showToast]);

  const handleDownload = useCallback(async () => {
    if (inFlightRef.current) {
      debugLog.warn('download', 'blocked: already in flight');
      return;
    }
    inFlightRef.current = true;
    setLoading(true);
    showToast('Генерирую файл...', 'info');

    debugLog.info('download', 'start', {
      templateId,
      variantCode,
      format,
      ua: navigator.userAgent,
      iOS: isIOS(),
      dpr: window.devicePixelRatio,
      vp: `${window.innerWidth}x${window.innerHeight}`,
    });

    try {
      const t0 = performance.now();
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, variantCode, format, fields }),
      });
      debugLog.info('download', `/api/render -> ${res.status} in ${Math.round(performance.now() - t0)}ms`);

      const contentType = res.headers.get('Content-Type') || '';
      debugLog.info('download', `content-type: ${contentType}`);

      if (contentType.includes('image/') || contentType.includes('application/pdf')) {
        const blob = await res.blob();
        debugLog.info('download', `server blob size=${blob.size}`);
        downloadBlob(blob, `${templateId}-${variantCode}.${format}`);
        notifySuccess();
        return;
      }

      debugLog.info('download', 'falling back to client render');

      if (typeof document !== 'undefined' && 'fonts' in document) {
        try {
          const tf = performance.now();
          await document.fonts.ready;
          debugLog.info('fonts', `fonts.ready in ${Math.round(performance.now() - tf)}ms`);
        } catch (err) {
          debugLog.warn('fonts', `fonts.ready threw: ${String(err)}`);
        }
      }

      const screenEl = getScreenElement();
      if (!screenEl) {
        debugLog.error('download', 'screen element not found');
        showToast('Ошибка: элемент не найден', 'error');
        return;
      }

      const rect = screenEl.getBoundingClientRect();
      debugLog.info('download', `screenEl rect=${Math.round(rect.width)}x${Math.round(rect.height)} target=${width}x${height}`);

      const blob = await captureScreenToPng(screenEl, width, height);
      if (!blob) {
        debugLog.error('download', 'captureScreenToPng returned null');
        showToast('Ошибка генерации', 'error');
        return;
      }

      debugLog.info('download', `final blob size=${blob.size} type=${blob.type}`);
      downloadBlob(blob, `${templateId}-${variantCode}.png`);
      notifySuccess();
    } catch (err) {
      debugLog.error('download', `exception: ${String(err)}`);
      console.error('Export error:', err);
      showToast('Ошибка генерации', 'error');
    } finally {
      inFlightRef.current = false;
      setLoading(false);
      debugLog.info('download', 'done');
    }
  }, [templateId, variantCode, format, fields, getScreenElement, width, height, showToast, notifySuccess]);

  const className = `${styles.btn} ${
    variant === 'icon' ? styles.btnIcon : variant === 'block' ? styles.btnBlock : styles.btnFull
  }`;

  return (
    <button
      className={className}
      onClick={handleDownload}
      disabled={loading}
      aria-label="Скачать"
    >
      <Download size={variant === 'block' ? 18 : 16} strokeWidth={1.5} />
      {variant !== 'icon' && (
        <span>{loading ? 'Генерирую...' : 'Скачать'}</span>
      )}
    </button>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function captureScreenToPng(
  screenEl: HTMLElement,
  width: number,
  height: number
): Promise<Blob | null> {
  const runOnce = async (attempt: number): Promise<Blob | null> => {
    debugLog.info('capture', `attempt ${attempt}: prepare start`);
    await prepareImagesForCapture(screenEl);
    debugLog.info('capture', `attempt ${attempt}: prepare done; double rAF`);
    await doubleRaf();
    const tpng = performance.now();
    let dataUrl: string | null = null;
    try {
      dataUrl = await toPng(screenEl, {
        width,
        height,
        pixelRatio: 1,
        skipAutoScale: true,
        skipFonts: true,
        includeQueryParams: true,
        imagePlaceholder: TRANSPARENT_PIXEL,
      });
    } catch (err) {
      debugLog.error('capture', `toPng threw: ${String(err)}`);
      return null;
    }
    debugLog.info('capture', `attempt ${attempt}: toPng done in ${Math.round(performance.now() - tpng)}ms, dataUrl len=${dataUrl ? dataUrl.length : 0}`);
    if (!dataUrl) return null;
    const resp = await fetch(dataUrl);
    const blob = await resp.blob();
    debugLog.info('capture', `attempt ${attempt}: blob ${blob.size}B type=${blob.type}`);
    return blob;
  };

  let blob = await runOnce(1);
  if (blob && blob.size < MIN_EXPECTED_PNG_BYTES) {
    debugLog.warn('capture', `blob ${blob.size} < threshold ${MIN_EXPECTED_PNG_BYTES}; retrying`);
    await new Promise((r) => setTimeout(r, 300));
    const second = await runOnce(2);
    if (second && second.size > blob.size) {
      debugLog.info('capture', `retry improved: ${blob.size} -> ${second.size}`);
      blob = second;
    } else {
      debugLog.warn('capture', `retry did not improve (${second ? second.size : 'null'})`);
    }
  }
  return blob;
}

function doubleRaf(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

async function decodeFreshImage(src: string): Promise<HTMLImageElement | null> {
  if (!src || src === TRANSPARENT_PIXEL) return null;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  try {
    await img.decode();
  } catch {
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
      setTimeout(done, 5000);
    });
  }
  if (!img.naturalWidth || !img.naturalHeight) return null;
  return img;
}

function canvasHasPixels(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  try {
    const cx = Math.floor(w / 2);
    const cy = Math.floor(h / 2);
    const { data } = ctx.getImageData(cx, cy, 1, 1);
    return data[3] !== 0;
  } catch (err) {
    debugLog.warn('bake', `getImageData threw: ${String(err)} — assuming ok`);
    return true;
  }
}

function parsePercent(token: string): number {
  if (!token) return 0.5;
  if (token.endsWith('%')) return parseFloat(token) / 100;
  if (token === 'left' || token === 'top') return 0;
  if (token === 'right' || token === 'bottom') return 1;
  if (token === 'center') return 0.5;
  const n = parseFloat(token);
  return Number.isFinite(n) ? n / 100 : 0.5;
}

/**
 * Emulate object-fit: cover with object-position by computing the draw rect
 * for ctx.drawImage. Lets us bake the visual crop into the canvas pixels so
 * we can output at the displayed (smaller) size and as JPEG.
 */
function drawWithCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
  objectPosition: string
): void {
  const naturalW = img.naturalWidth;
  const naturalH = img.naturalHeight;
  const naturalAspect = naturalW / naturalH;
  const targetAspect = targetW / targetH;

  const tokens = (objectPosition || '50% 50%').split(/\s+/);
  const posX = parsePercent(tokens[0] || '50%');
  const posY = parsePercent(tokens[1] || '50%');

  let drawW: number;
  let drawH: number;
  let drawX: number;
  let drawY: number;

  if (naturalAspect > targetAspect) {
    // Source wider — fit height, crop sides
    drawH = targetH;
    drawW = drawH * naturalAspect;
    drawX = (targetW - drawW) * posX;
    drawY = 0;
  } else {
    // Source taller — fit width, crop top/bottom
    drawW = targetW;
    drawH = drawW / naturalAspect;
    drawX = 0;
    drawY = (targetH - drawH) * posY;
  }

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

/**
 * For each <img>: bake the visible CSS filter + object-fit cover into canvas
 * pixels at the displayed size (typically 1200×1500 for our templates), then
 * output as JPEG when no transparency is needed (filter applied or source
 * was JPEG) — drastically smaller than re-encoding photos as PNG, which is
 * what was bloating the foreignObject and crashing the iOS export.
 */
async function prepareImagesForCapture(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  debugLog.info('bake', `found ${imgs.length} <img> in screen`);

  await Promise.all(
    imgs.map(async (img, idx) => {
      const src = img.getAttribute('src') || '';
      const cls = img.className || '(no class)';
      debugLog.info(`img${idx}`, `class=${cls} src=${srcPreview(src)} liveNatural=${img.naturalWidth}x${img.naturalHeight}`);

      if (!src.startsWith('data:')) {
        debugLog.info(`img${idx}`, 'src is not data URI — skipping');
        return;
      }

      const cs = getComputedStyle(img);
      const filter = cs.filter;
      const hasFilter = !!filter && filter !== 'none';
      const objectFit = cs.objectFit || 'fill';
      const objectPosition = cs.objectPosition || '50% 50%';

      // Use the layout (CSS pixel) size of the element — that's what toPng
      // will draw at, and matches the variant export resolution because the
      // template's .screen has explicit width/height in px.
      const targetW = img.clientWidth || img.naturalWidth;
      const targetH = img.clientHeight || img.naturalHeight;

      if (!targetW || !targetH) {
        debugLog.warn(`img${idx}`, `bad target size ${targetW}x${targetH} — skipping`);
        return;
      }

      const t0 = performance.now();
      const fresh = await decodeFreshImage(src);
      if (!fresh) {
        debugLog.warn(`img${idx}`, `decodeFreshImage returned null`);
        return;
      }
      debugLog.info(`img${idx}`, `fresh decoded ${fresh.naturalWidth}x${fresh.naturalHeight} in ${Math.round(performance.now() - t0)}ms; target=${targetW}x${targetH} fit=${objectFit} pos=${objectPosition}`);

      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          debugLog.error(`img${idx}`, 'getContext("2d") returned null');
          return;
        }

        if (hasFilter) {
          debugLog.info(`img${idx}`, `baking CSS filter: ${filter}`);
          ctx.filter = filter;
        }

        if (objectFit === 'cover' || objectFit === 'fill') {
          drawWithCover(ctx, fresh, targetW, targetH, objectPosition);
        } else {
          // Fallback — stretch to fit (matches default 'fill')
          ctx.drawImage(fresh, 0, 0, targetW, targetH);
        }

        ctx.filter = 'none';

        if (!canvasHasPixels(ctx, targetW, targetH)) {
          debugLog.warn(`img${idx}`, 'canvas centre pixel is transparent — drawImage failed silently, skipping');
          return;
        }

        // Choose output format. JPEG is ~5x smaller than PNG for photos and
        // is what iOS Safari foreignObject digests reliably. PNG only when
        // the source was PNG and there's no filter overriding it (likely a
        // cutout that needs alpha).
        const isPng = src.startsWith('data:image/png');
        const useJpeg = hasFilter || !isPng;
        const baked = useJpeg
          ? canvas.toDataURL('image/jpeg', 0.85)
          : canvas.toDataURL('image/png');

        debugLog.info(`img${idx}`, `baked ${useJpeg ? 'jpeg' : 'png'} len=${baked.length} (src was ${src.length})`);

        if (!baked) {
          debugLog.warn(`img${idx}`, 'toDataURL returned empty');
          return;
        }
        if (baked === src) {
          debugLog.info(`img${idx}`, 'baked equals original — leaving original src');
          return;
        }

        img.setAttribute('src', baked);
        img.style.filter = 'none';
        // The visual crop is now baked into the bitmap; tell the browser to
        // stretch the new image to the box without re-cropping.
        img.style.objectFit = 'fill';
        img.style.objectPosition = '0 0';
        debugLog.info(`img${idx}`, 'replaced src + filter/object-fit reset');

        if (!(img.complete && img.naturalWidth > 0)) {
          try {
            await img.decode();
            debugLog.info(`img${idx}`, `live re-decoded ${img.naturalWidth}x${img.naturalHeight}`);
          } catch (err) {
            debugLog.warn(`img${idx}`, `live re-decode threw: ${String(err)}`);
          }
        }
      } catch (err) {
        debugLog.error(`img${idx}`, `bake exception: ${String(err)}`);
      }
    })
  );
  debugLog.info('bake', 'prepareImagesForCapture done');
}
