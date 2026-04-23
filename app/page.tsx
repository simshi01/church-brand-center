'use client';

import { useState } from 'react';
import { getTemplatesByCategory } from '@/templates/registry';
import CategoryTabs from '@/components/CategoryTabs/CategoryTabs';
import TemplateGallery from '@/components/TemplateGallery/TemplateGallery';
import styles from './page.module.css';

export default function Home() {
  const [category, setCategory] = useState('all');
  const templates = getTemplatesByCategory(category);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.logo}>Jem Church</h1>
        <CategoryTabs active={category} onChange={setCategory} />
      </header>
      <main className={styles.main}>
        <TemplateGallery templates={templates} />
      </main>
    </div>
  );
}
