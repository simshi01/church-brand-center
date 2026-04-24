'use client';

import { useState, useCallback, useRef } from 'react';
import { Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useToast } from '@/lib/toastContext';
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

// PNG under this size for a 1200×1500 canvas with real content is suspicious
// (pure background + text sits around 15-25KB). If the render came back smaller
// than this we most likely lost the photo layer and should retry.
const MIN_EXPECTED_PNG_BYTES = 40 * 1024;

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
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
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    showToast('Генерирую файл...', 'info');

    try {
      // Server-side Puppeteer proxy — when RENDER_SERVER_URL is set the
      // route streams a real PNG/PDF back. Without it the route echoes HTML
      // and we fall through to the client-side path below.
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, variantCode, format, fields }),
      });

      const contentType = res.headers.get('Content-Type') || '';

      if (contentType.includes('image/') || contentType.includes('application/pdf')) {
        const blob = await res.blob();
        downloadBlob(blob, `${templateId}-${variantCode}.${format}`);
        notifySuccess();
        return;
      }

      if (typeof document !== 'undefined' && 'fonts' in document) {
        try {
          await document.fonts.ready;
        } catch {
          /* noop */
        }
      }

      const screenEl = getScreenElement();
      if (!screenEl) {
        showToast('Ошибка: элемент не найден', 'error');
        return;
      }

      const blob = await captureScreenToPng(screenEl, width, height);
      if (!blob) {
        showToast('Ошибка генерации', 'error');
        return;
      }

      downloadBlob(blob, `${templateId}-${variantCode}.png`);
      notifySuccess();
    } catch (err) {
      console.error('Export error:', err);
      showToast('Ошибка генерации', 'error');
    } finally {
      inFlightRef.current = false;
      setLoading(false);
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

/**
 * Render the preview DOM into a PNG Blob. Wraps html-to-image with iOS
 * Safari-friendly prep:
 *   1. pre-bake every <img> through a canvas with computed CSS filters
 *      applied, so foreignObject doesn't have to apply them itself;
 *   2. skipFonts so html-to-image doesn't re-embed @font-face rules whose
 *      relative url('/fonts/…') paths can't resolve from the SVG data URL;
 *   3. double requestAnimationFrame so Safari actually paints the baked
 *      img src before the capture;
 *   4. sanity-check output size and retry once if the first run came back
 *      suspiciously small (photo layer dropped).
 */
async function captureScreenToPng(
  screenEl: HTMLElement,
  width: number,
  height: number
): Promise<Blob | null> {
  const runOnce = async (): Promise<Blob | null> => {
    await prepareImagesForCapture(screenEl);
    await doubleRaf();
    const dataUrl = await toPng(screenEl, {
      width,
      height,
      pixelRatio: 1,
      skipAutoScale: true,
      skipFonts: true,
      includeQueryParams: true,
      imagePlaceholder: TRANSPARENT_PIXEL,
    });
    if (!dataUrl) return null;
    const resp = await fetch(dataUrl);
    return await resp.blob();
  };

  let blob = await runOnce();
  if (blob && blob.size < MIN_EXPECTED_PNG_BYTES) {
    // Suspicious — likely the photo layer dropped. Wait a tick and try again.
    await new Promise((r) => setTimeout(r, 300));
    const second = await runOnce();
    if (second && second.size > blob.size) blob = second;
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
  // Sample the middle pixel. For both bgImage (photo) and bgImageCutout
  // (cutout PNG with transparent bg around the subject) the centre should
  // contain non-transparent pixels.
  try {
    const cx = Math.floor(w / 2);
    const cy = Math.floor(h / 2);
    const { data } = ctx.getImageData(cx, cy, 1, 1);
    return data[3] !== 0;
  } catch {
    return true; // getImageData can throw on tainted canvas; treat as valid
  }
}

/**
 * For each <img> in the subtree: load a fresh off-DOM copy, draw it to a
 * canvas with the computed CSS filter baked in, set the resulting PNG data
 * URL as the img's new src, and remove the filter from inline styles so
 * foreignObject doesn't try to re-apply it. Strategy: treat every img as
 * if it might fail silently on iOS and guard each step.
 */
async function prepareImagesForCapture(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));

  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute('src') || '';
      if (!src.startsWith('data:')) return;

      const fresh = await decodeFreshImage(src);
      if (!fresh) return;

      const w = fresh.naturalWidth;
      const h = fresh.naturalHeight;

      try {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const computedFilter = getComputedStyle(img).filter;
        if (computedFilter && computedFilter !== 'none') {
          ctx.filter = computedFilter;
        }
        ctx.drawImage(fresh, 0, 0);
        ctx.filter = 'none';

        if (!canvasHasPixels(ctx, w, h)) return;

        const baked = canvas.toDataURL('image/png');
        if (!baked || baked === src) return;

        img.setAttribute('src', baked);
        // Filter baked into pixels — make absolutely sure foreignObject
        // doesn't stack another grayscale on top.
        img.style.filter = 'none';

        // Wait for the new src to decode on the live img element too, so
        // by the time toPng clones the DOM the img is fully ready.
        if (img.complete && img.naturalWidth > 0) return;
        try {
          await img.decode();
        } catch {
          /* noop */
        }
      } catch {
        /* bake failed — keep original src */
      }
    })
  );
}
