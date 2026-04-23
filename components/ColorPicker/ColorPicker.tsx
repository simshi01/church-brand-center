'use client';

import { useRef } from 'react';
import styles from './ColorPicker.module.css';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isAuto?: boolean;
  onResetAuto?: () => void;
}

export default function ColorPicker({
  label,
  value,
  onChange,
  isAuto,
  onResetAuto,
}: ColorPickerProps) {
  const colorRef = useRef<HTMLInputElement>(null);

  const handleHexChange = (hex: string) => {
    const clean = hex.startsWith('#') ? hex : '#' + hex;
    if (/^#[0-9a-fA-F]{6}$/.test(clean)) {
      onChange(clean);
    }
  };

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label}>{label}</label>
        {isAuto && (
          <span className={styles.autoBadge}>Авто</span>
        )}
        {!isAuto && onResetAuto && (
          <button className={styles.resetBtn} onClick={onResetAuto}>
            Сбросить к авто
          </button>
        )}
      </div>
      <div className={styles.row}>
        <button
          className={styles.swatch}
          style={{ background: value }}
          onClick={() => colorRef.current?.click()}
        />
        <input
          ref={colorRef}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={styles.nativeInput}
        />
        <input
          className={styles.hexInput}
          type="text"
          value={value}
          onChange={(e) => handleHexChange(e.target.value)}
          maxLength={7}
        />
      </div>
    </div>
  );
}
