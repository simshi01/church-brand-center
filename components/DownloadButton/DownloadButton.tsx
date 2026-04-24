'use client';

import { useState, useCallback } from 'react';
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
    setLoading(true);
    showToast('Генерирую файл...', 'info');

    try {
      // Try server-side Puppeteer render first
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
        setLoading(false);
        return;
      }

      // No Puppeteer — capture the actual preview .screen element directly.
      // html-to-image renders it at the element's real DOM size (full pixels),
      // ignoring the parent's CSS transform: scale().
      // Make sure fonts are ready before capture (important on mobile).
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
        setLoading(false);
        return;
      }

      // iOS Safari quirk: html-to-image uses <foreignObject> in SVG. Large
      // data-URI JPEGs inside foreignObject sometimes render as a white
      // rectangle on iOS. Pre-baking each img through a canvas (decode → PNG)
      // sidesteps it — the replacement data URI is a clean PNG that iOS
      // reliably rasterises.
      await prepareImagesForCapture(screenEl);

      const dataUrl = await toPng(screenEl, {
        width,
        height,
        pixelRatio: 1,
        skipAutoScale: true,
        includeQueryParams: true,
        // Fallback for images that fail to load
        imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualzQAAAABJRU5ErkJggg==',
      });

      // Convert data URL to blob and download
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      downloadBlob(blob, `${templateId}-${variantCode}.png`);
      notifySuccess();
      setLoading(false);
    } catch (err) {
      console.error('Export error:', err);
      showToast('Ошибка генерации', 'error');
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

async function decodeImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return;
  try {
    await img.decode();
  } catch {
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
      setTimeout(done, 3000);
    });
  }
}

async function prepareImagesForCapture(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  await Promise.all(
    imgs.map(async (img) => {
      await decodeImage(img);
      const src = img.getAttribute('src') || '';
      if (!src.startsWith('data:')) return;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (!w || !h) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const baked = canvas.toDataURL('image/png');
        if (baked && baked !== src) img.setAttribute('src', baked);
        await decodeImage(img);
      } catch {
        /* if baking fails, fall through with original src */
      }
    })
  );
}
