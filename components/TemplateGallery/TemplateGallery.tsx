'use client';

import { TemplateConfig } from '@/lib/types';
import TemplateCard from '@/components/TemplateCard/TemplateCard';
import styles from './TemplateGallery.module.css';

interface TemplateGalleryProps {
  templates: TemplateConfig[];
}

export default function TemplateGallery({ templates }: TemplateGalleryProps) {
  if (templates.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Нет шаблонов в этой категории</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {templates.map((t) => (
        <TemplateCard key={t.id} template={t} />
      ))}
    </div>
  );
}
