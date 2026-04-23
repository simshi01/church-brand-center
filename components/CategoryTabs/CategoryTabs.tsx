'use client';

import { CATEGORIES } from '@/lib/constants';
import styles from './CategoryTabs.module.css';

interface CategoryTabsProps {
  active: string;
  onChange: (category: string) => void;
}

export default function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <nav className={styles.tabs}>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          className={`${styles.tab} ${active === cat.key ? styles.active : ''}`}
          onClick={() => onChange(cat.key)}
        >
          {cat.label}
        </button>
      ))}
    </nav>
  );
}
