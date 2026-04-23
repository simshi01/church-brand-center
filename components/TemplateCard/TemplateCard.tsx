'use client';

import Link from 'next/link';
import { TemplateConfig } from '@/lib/types';
import { VARIANT_LABELS } from '@/lib/constants';
import styles from './TemplateCard.module.css';

interface TemplateCardProps {
  template: TemplateConfig;
}

export default function TemplateCard({ template }: TemplateCardProps) {
  return (
    <Link href={`/editor/${template.id}`} className={styles.card}>
      <div className={styles.preview}>
        <div className={styles.previewPlaceholder}>
          {template.name}
        </div>
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>{template.name}</h3>
        <p className={styles.meta}>{template.description}</p>
        <div className={styles.badges}>
          {template.variants.map((v) => (
            <span key={v.code} className={styles.badge}>
              {VARIANT_LABELS[v.code] || v.code}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
