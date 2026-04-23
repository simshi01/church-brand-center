'use client';

import { useState, useRef, useEffect } from 'react';
import { VariantConfig } from '@/lib/types';
import { ChevronDown } from 'lucide-react';
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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className={styles.wrapper} ref={ref}>
      <button className={styles.trigger} onClick={() => setOpen(!open)}>
        <span className={styles.label}>
          {currentVariant?.label}
        </span>
        <span className={styles.dims}>
          {currentVariant?.width}×{currentVariant?.height}
        </span>
        <ChevronDown size={16} strokeWidth={1.5} />
      </button>
      {open && (
        <div className={styles.dropdown}>
          {variants.map((v) => (
            <button
              key={v.code}
              className={`${styles.option} ${v.code === current ? styles.active : ''}`}
              onClick={() => {
                onChange(v.code);
                setOpen(false);
              }}
            >
              <span>{v.label}</span>
              <span className={styles.optionDims}>{v.width}×{v.height}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
