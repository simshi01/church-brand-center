'use client';

import {
  PointerEvent as ReactPointerEvent,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { X } from 'lucide-react';
import styles from './BottomSheet.module.css';

export type SnapPoint = 'collapsed' | 'half' | 'full';

interface BottomSheetProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  snap: SnapPoint;
  onSnapChange: (snap: SnapPoint) => void;
  snapPoints?: SnapPoint[];
  peekHeight?: number;
  children: ReactNode;
  footer?: ReactNode;
  title?: string;
  ariaLabel?: string;
}

const SNAP_RATIO: Record<SnapPoint, number> = {
  collapsed: 0,
  half: 0.55,
  full: 0.88,
};

const VELOCITY_THRESHOLD = 0.5;

function getViewportHeight(): number {
  if (typeof window === 'undefined') return 800;
  return window.visualViewport?.height ?? window.innerHeight;
}

export function getSnapHeight(snap: SnapPoint, peekHeight = 72): number {
  if (snap === 'collapsed') return peekHeight;
  return Math.round(getViewportHeight() * SNAP_RATIO[snap]);
}

export default function BottomSheet({
  open,
  onOpenChange,
  snap,
  onSnapChange,
  snapPoints = ['collapsed', 'half', 'full'],
  peekHeight = 72,
  children,
  footer,
  title,
  ariaLabel,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [vh, setVh] = useState<number>(() =>
    typeof window === 'undefined' ? 800 : getViewportHeight()
  );

  const pointerState = useRef({
    startY: 0,
    startT: 0,
    lastY: 0,
    lastT: 0,
    pointerId: -1,
  });

  // Reflect visualViewport height changes (iOS keyboard, orientation)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setVh(getViewportHeight());
    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  const getHeight = useCallback(
    (s: SnapPoint): number => {
      if (s === 'collapsed') return peekHeight;
      return Math.round(vh * SNAP_RATIO[s]);
    },
    [vh, peekHeight]
  );

  const targetHeight = getHeight(snap);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const t = performance.now();
      pointerState.current = {
        startY: e.clientY,
        startT: t,
        lastY: e.clientY,
        lastT: t,
        pointerId: e.pointerId,
      };
      setIsDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    []
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging || e.pointerId !== pointerState.current.pointerId) return;
      const delta = e.clientY - pointerState.current.startY;
      setDragY(delta);
      pointerState.current.lastY = e.clientY;
      pointerState.current.lastT = performance.now();
    },
    [isDragging]
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging || e.pointerId !== pointerState.current.pointerId) return;
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }

      const deltaY = e.clientY - pointerState.current.startY;
      const deltaT = Math.max(
        performance.now() - pointerState.current.lastT + 1,
        1
      );
      const vy =
        (e.clientY - pointerState.current.lastY) / deltaT; // px/ms, last frame

      const effectiveHeight = Math.max(targetHeight - deltaY, peekHeight);

      let next: SnapPoint = snap;

      if (Math.abs(vy) > VELOCITY_THRESHOLD) {
        // Fast flick — move one step in swipe direction
        const order: SnapPoint[] = ['collapsed', 'half', 'full'];
        const available = order.filter((p) => snapPoints.includes(p));
        const idx = available.indexOf(snap);
        if (vy < 0 && idx < available.length - 1) {
          next = available[idx + 1];
        } else if (vy > 0 && idx > 0) {
          next = available[idx - 1];
        }
      } else {
        // Snap to nearest
        let best: SnapPoint = snap;
        let bestDist = Infinity;
        for (const p of snapPoints) {
          const h = getHeight(p);
          const d = Math.abs(h - effectiveHeight);
          if (d < bestDist) {
            bestDist = d;
            best = p;
          }
        }
        next = best;
      }

      setDragY(0);
      if (next !== snap) onSnapChange(next);
      if (next === 'collapsed' && onOpenChange) {
        // stays open as peek — no close
      }
    },
    [
      isDragging,
      snap,
      snapPoints,
      targetHeight,
      peekHeight,
      getHeight,
      onSnapChange,
      onOpenChange,
    ]
  );

  // Prevent body scroll when sheet covers viewport (full)
  useLayoutEffect(() => {
    if (typeof document === 'undefined') return;
    if (!open) return;
    const prev = document.body.style.overscrollBehavior;
    document.body.style.overscrollBehavior = 'contain';
    return () => {
      document.body.style.overscrollBehavior = prev;
    };
  }, [open]);

  if (!open) return null;

  const currentHeight = Math.max(targetHeight - dragY, 0);
  const showBackdrop = snap !== 'collapsed' || dragY < 0;
  const backdropOpacity = Math.min(
    0.4,
    Math.max(0, (currentHeight - peekHeight) / (vh * 0.5)) * 0.4
  );

  return (
    <div className={styles.root} aria-hidden={!open}>
      <div
        className={styles.backdrop}
        style={{
          opacity: showBackdrop ? backdropOpacity : 0,
          pointerEvents: snap === 'collapsed' ? 'none' : 'auto',
        }}
        onClick={() => onSnapChange('collapsed')}
      />
      <div
        ref={sheetRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title ?? 'Панель редактирования'}
        style={{
          height: currentHeight,
          transition: isDragging
            ? 'none'
            : 'height 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div
          className={styles.handleRow}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className={styles.handle} aria-hidden="true" />
          {title && <span className={styles.title}>{title}</span>}
          {snap !== 'collapsed' && (
            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => onSnapChange('collapsed')}
              aria-label="Свернуть"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          )}
        </div>
        <div className={styles.scrollArea}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
