'use client';

import { useRef, useState, useEffect, useCallback, useLayoutEffect, forwardRef, useImperativeHandle } from 'react';
import { Loader2 } from 'lucide-react';
import { VariantConfig } from '@/lib/types';
import { fitTitleInCard } from '@/lib/fitTitle';
import { applyBindings, Binding, collectBindings } from '@/lib/templateBinder';
import styles from './EditorPreview.module.css';

interface EditorPreviewProps {
  /** Raw template HTML with {{key}} placeholders intact. Mounted once per
   *  variant; subsequent value changes patch the DOM in place. */
  templateHtml: string;
  /** All values fed to bindings (fieldValues + titleSize + cutoutActive etc.) */
  values: Record<string, string>;
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
  templateHtml,
  values,
  variant,
  maxFontSize,
  minFontSize,
  onTitleSizeComputed,
  cutoutProcessing,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const bindingsRef = useRef<Binding[]>([]);
  const [scale, setScale] = useState(0.3);

  useImperativeHandle(ref, () => ({
    getScreenElement: () => {
      if (!contentRef.current) return null;
      return contentRef.current.querySelector('.screen') as HTMLElement;
    },
  }));

  // Scale — reads padding via computed style; ResizeObserver picks up layout
  // changes (bottom-sheet snap on mobile, keyboard, rotation) that `window
  // resize` would miss.
  const updateScale = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padR = parseFloat(cs.paddingRight) || 0;
    const padT = parseFloat(cs.paddingTop) || 0;
    const padB = parseFloat(cs.paddingBottom) || 0;
    const availW = Math.max(0, rect.width - padL - padR);
    const availH = Math.max(0, rect.height - padT - padB);
    if (availW === 0 || availH === 0) return;
    setScale(Math.min(availW / variant.width, availH / variant.height, 1));
  }, [variant.width, variant.height]);

  useEffect(() => {
    updateScale();
    const el = containerRef.current;
    window.addEventListener('resize', updateScale);
    let ro: ResizeObserver | null = null;
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateScale);
      ro.observe(el);
    }
    return () => {
      window.removeEventListener('resize', updateScale);
      ro?.disconnect();
    };
  }, [updateScale]);

  // Structural mount: only when template string itself changes (e.g. variant
  // switch). Keeps imgs alive across field-value changes, which is critical on
  // iOS Safari — rapid innerHTML resets drop image decodes and the preview
  // flashes white.
  useLayoutEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.innerHTML = templateHtml;
    bindingsRef.current = collectBindings(contentRef.current);
    applyBindings(bindingsRef.current, values);
    const size = fitTitleInCard(contentRef.current, maxFontSize, minFontSize);
    onTitleSizeComputed?.(size);

    // Font-race guard for Smart Title Fit: the preview template declares its
    // own @font-face for TT Hoves Pro Expanded; if it hasn't loaded yet, the
    // first measurement uses a sans-serif fallback (narrower glyphs) and
    // returns maxFontSize, so the title overflows once the real font swaps.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateHtml, maxFontSize, minFontSize]);

  // Value update: patch bound attributes / text nodes without touching
  // innerHTML. No img elements are destroyed, so no re-decode on iOS.
  useLayoutEffect(() => {
    if (!contentRef.current) return;
    if (!bindingsRef.current.length) return;
    applyBindings(bindingsRef.current, values);
    // Re-fit in case the title text changed.
    const size = fitTitleInCard(contentRef.current, maxFontSize, minFontSize);
    onTitleSizeComputed?.(size);
  }, [values, maxFontSize, minFontSize, onTitleSizeComputed]);

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
