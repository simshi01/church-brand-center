'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { VariantConfig } from '@/lib/types';
import { ChevronDown, Check, X } from 'lucide-react';
import { MOBILE_QUERY, useMediaQuery } from '@/lib/useMediaQuery';
import styles from './SizeSelector.module.css';

interface SizeSelectorProps {
  variants: VariantConfig[];
  current: string;
  onChange: (code: string) => void;
}

export default function SizeSelector({ variants, current, onChange }: SizeSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentVariant = variants.find((v) => v.code === current);
  const isMobile = useMediaQuery(MOBILE_QUERY);

  useEffect(() => {
    if (isMobile) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMobile]);

  // Close modal on escape
  useEffect(() => {
    if (!open || !isMobile) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, isMobile]);

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={styles.label}>{currentVariant?.label}</span>
        <span className={styles.dims}>
          {currentVariant?.width}×{currentVariant?.height}
        </span>
        <ChevronDown size={16} strokeWidth={1.5} />
      </button>

      {open && !isMobile && (
        <div className={styles.dropdown} role="listbox">
          {variants.map((v) => (
            <button
              type="button"
              key={v.code}
              role="option"
              aria-selected={v.code === current}
              className={`${styles.option} ${v.code === current ? styles.active : ''}`}
              onClick={() => {
                onChange(v.code);
                setOpen(false);
              }}
            >
              <span>{v.label}</span>
              <span className={styles.optionDims}>
                {v.width}×{v.height}
              </span>
            </button>
          ))}
        </div>
      )}

      {open && isMobile && typeof document !== 'undefined' &&
        createPortal(
          <div className={styles.modalRoot} role="dialog" aria-modal="true">
            <div
              className={styles.modalBackdrop}
              onClick={() => setOpen(false)}
            />
            <div className={styles.modalSheet}>
              <header className={styles.modalHeader}>
                <span className={styles.modalTitle}>Размер</span>
                <button
                  type="button"
                  className={styles.modalClose}
                  onClick={() => setOpen(false)}
                  aria-label="Закрыть"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </header>
              <div className={styles.modalList} role="listbox">
                {variants.map((v) => {
                  const active = v.code === current;
                  return (
                    <button
                      type="button"
                      key={v.code}
                      role="option"
                      aria-selected={active}
                      className={`${styles.modalOption} ${active ? styles.modalOptionActive : ''}`}
                      onClick={() => {
                        onChange(v.code);
                        setOpen(false);
                      }}
                    >
                      <div className={styles.modalOptionText}>
                        <span className={styles.modalOptionLabel}>{v.label}</span>
                        <span className={styles.modalOptionDims}>
                          {v.width}×{v.height}
                        </span>
                      </div>
                      {active && (
                        <Check size={18} strokeWidth={1.5} aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
