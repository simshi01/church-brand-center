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

async function prepareImagesForCapture(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  debugLog.info('bake', `found ${imgs.length} <img> in screen`);

  await Promise.all(
    imgs.map(async (img, idx) => {
      const src = img.getAttribute('src') || '';
      const cls = img.className || '(no class)';
      debugLog.info(`img${idx}`, `class=${cls} src=${srcPreview(src)} liveNatural=${img.naturalWidth}x${img.naturalHeight}`);

      if (!src.startsWith('data:')) {
        debugLog.info(`img${idx}`, 'src is not data URI — skipping bake');
        return;
      }

      const t0 = performance.now();
      const fresh = await decodeFreshImage(src);
      if (!fresh) {
        debugLog.warn(`img${idx}`, `decodeFreshImage returned null (decode failed or naturalW=0)`);
        return;
      }
      debugLog.info(`img${idx}`, `fresh decoded ${fresh.naturalWidth}x${fresh.naturalHeight} in ${Math.round(performance.now() - t0)}ms`);

      const w = fresh.naturalWidth;
      const h = fresh.naturalHeight;

      try {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          debugLog.error(`img${idx}`, 'getContext("2d") returned null');
          return;
        }

        const computedFilter = getComputedStyle(img).filter;
        if (computedFilter && computedFilter !== 'none') {
          debugLog.info(`img${idx}`, `baking CSS filter: ${computedFilter}`);
          ctx.filter = computedFilter;
        }

        ctx.drawImage(fresh, 0, 0);
        ctx.filter = 'none';

        const hasPixels = canvasHasPixels(ctx, w, h);
        if (!hasPixels) {
          debugLog.warn(`img${idx}`, 'canvas centre pixel is transparent — drawImage likely failed silently, skipping');
          return;
        }

        const baked = canvas.toDataURL('image/png');
        debugLog.info(`img${idx}`, `baked PNG len=${baked.length}`);

        if (!baked || baked === src) {
          debugLog.warn(`img${idx}`, 'baked data URL empty or equal to original — skipping');
          return;
        }

        img.setAttribute('src', baked);
        img.style.filter = 'none';
        debugLog.info(`img${idx}`, 'new src set + inline filter:none');

        if (!(img.complete && img.naturalWidth > 0)) {
          try {
            await img.decode();
            debugLog.info(`img${idx}`, `live img re-decoded ${img.naturalWidth}x${img.naturalHeight}`);
          } catch (err) {
            debugLog.warn(`img${idx}`, `live img re-decode threw: ${String(err)}`);
          }
        }
      } catch (err) {
        debugLog.error(`img${idx}`, `bake exception: ${String(err)}`);
      }
    })
  );
  debugLog.info('bake', 'prepareImagesForCapture done');
}
