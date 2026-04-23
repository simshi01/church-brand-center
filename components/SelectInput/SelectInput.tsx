'use client';

import { ChevronDown } from 'lucide-react';
import styles from './SelectInput.module.css';

interface SelectInputProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

export default function SelectInput({ label, value, options, onChange }: SelectInputProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div className={styles.wrapper}>
        <select
          className={styles.select}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={14} strokeWidth={1.5} className={styles.chevron} />
      </div>
    </div>
  );
}
