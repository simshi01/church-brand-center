'use client';

import { FieldConfig } from '@/lib/types';
import FieldInput from '@/components/FieldInput/FieldInput';
import ImageUploader, { CutoutStatus } from '@/components/ImageUploader/ImageUploader';
import ColorPicker from '@/components/ColorPicker/ColorPicker';
import SelectInput from '@/components/SelectInput/SelectInput';
import ToggleInput from '@/components/ToggleInput/ToggleInput';
import styles from './EditorSidebar.module.css';

interface EditorSidebarProps {
  fields: FieldConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  autoColorKeys: Set<string>;
  onResetAutoColor: (key: string) => void;
  cutoutFieldKey?: string;
  cutoutEnabled?: boolean;
  onCutoutToggle?: (enabled: boolean) => void;
  cutoutStatus?: CutoutStatus;
}

export default function EditorSidebar({
  fields,
  values,
  onChange,
  autoColorKeys,
  onResetAutoColor,
  cutoutFieldKey,
  cutoutEnabled,
  onCutoutToggle,
  cutoutStatus,
}: EditorSidebarProps) {
  const visibleFields = fields.filter((f) => !f.hidden);
  const textFields = visibleFields.filter((f) => f.type === 'text' || f.type === 'textarea');
  const imageFields = visibleFields.filter((f) => f.type === 'image');
  const settingFields = visibleFields.filter((f) => f.type === 'select' || f.type === 'toggle');
  const colorFields = visibleFields.filter((f) => f.type === 'color');

  return (
    <aside className={styles.sidebar}>
      {textFields.length > 0 && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Содержание</h4>
          <div className={styles.fields}>
            {textFields.map((f) => (
              <FieldInput
                key={f.key}
                label={f.label}
                value={values[f.key] || ''}
                onChange={(val) => onChange(f.key, val)}
                multiline={f.type === 'textarea'}
                placeholder={f.default}
              />
            ))}
          </div>
        </section>
      )}

      {imageFields.length > 0 && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Фон</h4>
          <div className={styles.fields}>
            {imageFields.map((f) => (
              <ImageUploader
                key={f.key}
                label={f.label}
                value={values[f.key] || ''}
                onChange={(val) => onChange(f.key, val)}
                showCutoutToggle={f.key === cutoutFieldKey}
                cutoutEnabled={f.key === cutoutFieldKey ? cutoutEnabled : undefined}
                onCutoutToggle={f.key === cutoutFieldKey ? onCutoutToggle : undefined}
                cutoutStatus={f.key === cutoutFieldKey ? cutoutStatus : undefined}
              />
            ))}
          </div>
        </section>
      )}

      {settingFields.length > 0 && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Настройки</h4>
          <div className={styles.fields}>
            {settingFields.map((f) =>
              f.type === 'select' ? (
                <SelectInput
                  key={f.key}
                  label={f.label}
                  value={values[f.key] || f.default || ''}
                  options={f.options || []}
                  onChange={(val) => onChange(f.key, val)}
                />
              ) : (
                <ToggleInput
                  key={f.key}
                  label={f.label}
                  value={values[f.key] || f.default || 'false'}
                  onChange={(val) => onChange(f.key, val)}
                />
              )
            )}
          </div>
        </section>
      )}

      {colorFields.length > 0 && (
        <section className={styles.section}>
          <h4 className={styles.sectionTitle}>Стиль</h4>
          <div className={styles.fields}>
            {colorFields.map((f) => (
              <ColorPicker
                key={f.key}
                label={f.label}
                value={values[f.key] || f.default || '#000000'}
                onChange={(val) => onChange(f.key, val)}
                isAuto={autoColorKeys.has(f.key)}
                onResetAuto={f.smartColorTarget ? () => onResetAutoColor(f.key) : undefined}
              />
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
