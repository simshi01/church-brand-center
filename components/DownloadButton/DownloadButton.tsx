'use client';

import { useState, useCallback } from 'react';
import { Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useToast } from '@/lib/toastContext';
import styles from './DownloadButton.module.css';

interface DownloadButtonProps {
  templateId: string;
  variantCode: string;
  format: 'png' | 'pdf';
  fields: Record<string, string>;
  getExportHtml: () => string;
  getScreenElement: () => HTMLElement | null;
  width: number;
  height: number;
}

export default function DownloadButton({
  templateId,
  variantCode,
  format,
  fields,
  getExportHtml,
  getScreenElement,
  width,
  height,
}: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

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
        showToast('Готово!', 'success');
        setLoading(false);
        return;
      }

      // No Puppeteer — capture the actual preview .screen element directly
      // html-to-image renders it at the element's real DOM size (full pixels),
      // ignoring the parent's CSS transform: scale()
      const screenEl = getScreenElement();
      if (!screenEl) {
        showToast('Ошибка: элемент не найден', 'error');
        setLoading(false);
        return;
      }

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
      showToast('Готово!', 'success');
      setLoading(false);
    } catch (err) {
      console.error('Export error:', err);
      showToast('Ошибка генерации', 'error');
      setLoading(false);
    }
  }, [templateId, variantCode, format, fields, getScreenElement, width, height, showToast]);

  return (
    <button
      className={styles.btn}
      onClick={handleDownload}
      disabled={loading}
    >
      <Download size={16} strokeWidth={1.5} />
      {loading ? 'Генерирую...' : 'Скачать'}
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
