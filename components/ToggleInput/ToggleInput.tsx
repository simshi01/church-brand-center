'use client';

import styles from './ToggleInput.module.css';

interface ToggleInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export default function ToggleInput({ label, value, onChange }: ToggleInputProps) {
  const on = value === 'true';
  return (
    <button
      type="button"
      className={styles.row}
      onClick={() => onChange(on ? 'false' : 'true')}
    >
      <span className={styles.label}>{label}</span>
      <span className={`${styles.track} ${on ? styles.trackOn : ''}`}>
        <span className={`${styles.thumb} ${on ? styles.thumbOn : ''}`} />
      </span>
    </button>
  );
}
