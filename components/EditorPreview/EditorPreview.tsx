'use client';

import { useRef, useState, useEffect, useCallback, useLayoutEffect, forwardRef, useImperativeHandle } from 'react';
import { Loader2 } from 'lucide-react';
import { VariantConfig } from '@/lib/types';
import { fitTitleInCard } from '@/lib/fitTitle';
import styles from './EditorPreview.module.css';

interface EditorPreviewProps {
  html: string;
  variant: VariantConfig;
  maxFontSize: number;
  minFontSize: number;
  onTitleSizeComputed?: (size: number) => void;
  cutoutProcessing?: boolean;
}

export interface EditorPreviewHandle {
  getScreenElement: () => HTMLElement | null;
}

const EditorPreview = forwardRef<EditorPreviewHandle, EditorPreviewProps>(({
  html,
  variant,
  maxFontSize,
  minFontSize,
  onTitleSizeComputed,
  cutoutProcessing,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  // Expose getScreenElement to parent (for export capture)
  useImperativeHandle(ref, () => ({
    getScreenElement: () => {
      if (!contentRef.current) return null;
      return contentRef.current.querySelector('.screen') as HTMLElement;
    },
  }));

  // Scale calculation
  const updateScale = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const padding = 48;
    const availW = rect.width - padding * 2;
    const availH = rect.height - padding * 2;
    setScale(Math.min(availW / variant.width, availH / variant.height, 1));
  }, [variant.width, variant.height]);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [updateScale]);

  // Render HTML + fit title — all synchronous BEFORE paint (no flicker)
  useLayoutEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.innerHTML = html;
    const size = fitTitleInCard(contentRef.current, maxFontSize, minFontSize);
    onTitleSizeComputed?.(size);

    // Font-race safety net: .screen__title uses TT Hoves Pro Expanded, which
    // exists only inside the injected preview HTML. If it isn't loaded yet,
    // the sync fit above measures with sans-serif fallback (narrower glyphs)
    // and returns maxFontSize, causing the title to overflow once the real
    // font swaps in. Re-fit on the same DOM after the face actually loads.
    if (typeof document === 'undefined' || !('fonts' in document)) return;
    if (document.fonts.check("600 16px 'TT Hoves Pro Expanded'")) return;

    let cancelled = false;
    document.fonts.load("600 200px 'TT Hoves Pro Expanded'").then(() => {
      if (cancelled || !contentRef.current) return;
      const size2 = fitTitleInCard(contentRef.current, maxFontSize, minFontSize);
      if (size2 !== size) onTitleSizeComputed?.(size2);
    });
    return () => {
      cancelled = true;
    };
  }, [html, maxFontSize, minFontSize, onTitleSizeComputed]);

  return (
    <div className={styles.container} ref={containerRef}>
      <div
        className={styles.frame}
        style={{
          width: variant.width,
          height: variant.height,
          transform: `scale(${scale})`,
        }}
      >
        <div ref={contentRef} />
      </div>
      {cutoutProcessing && (
        <div className={styles.processingOverlay}>
          <Loader2 size={24} strokeWidth={1.5} className={styles.spin} />
          <span>Вырезаю фон…</span>
        </div>
      )}
    </div>
  );
});

EditorPreview.displayName = 'EditorPreview';
export default EditorPreview;
