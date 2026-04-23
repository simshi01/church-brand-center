'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, Scissors, Loader2 } from 'lucide-react';
import { fileToDataURI, resizeImage } from '@/lib/imageUtils';
import styles from './ImageUploader.module.css';

export type CutoutStatus =
  | { kind: 'idle' }
  | { kind: 'downloading'; pct: number }
  | { kind: 'processing' }
  | { kind: 'ready' }
  | { kind: 'error' };

interface ImageUploaderProps {
  label: string;
  value: string;
  onChange: (dataURI: string) => void;
  showCutoutToggle?: boolean;
  cutoutEnabled?: boolean;
  onCutoutToggle?: (enabled: boolean) => void;
  cutoutStatus?: CutoutStatus;
}

export default function ImageUploader({
  label,
  value,
  onChange,
  showCutoutToggle,
  cutoutEnabled,
  onCutoutToggle,
  cutoutStatus,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const dataURI = await fileToDataURI(file);
    const resized = await resizeImage(dataURI);
    onChange(resized);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <div
        className={`${styles.zone} ${dragOver ? styles.dragOver : ''} ${value ? styles.hasImage : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {value ? (
          <>
            <img src={value} alt="Загруженное изображение" className={styles.preview} />
            <div className={styles.overlay}>Заменить</div>
          </>
        ) : (
          <div className={styles.placeholder}>
            <Upload size={20} strokeWidth={1.5} />
            <span>Загрузить изображение</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          className={styles.input}
        />
      </div>

      {showCutoutToggle && (
        <div className={styles.cutoutRow}>
          <button
            type="button"
            className={`${styles.cutoutToggle} ${cutoutEnabled ? styles.cutoutOn : ''}`}
            onClick={() => onCutoutToggle?.(!cutoutEnabled)}
          >
            <Scissors size={14} strokeWidth={1.5} />
            <span>Вырезать фон</span>
            <span className={`${styles.cutoutDot} ${cutoutEnabled ? styles.cutoutDotOn : ''}`} />
          </button>
          {cutoutEnabled && cutoutStatus && cutoutStatus.kind !== 'idle' && (
            <span className={styles.cutoutStatus}>
              {cutoutStatus.kind === 'downloading' && (
                <>
                  <Loader2 size={12} strokeWidth={1.5} className={styles.spin} />
                  Загружаю модель {cutoutStatus.pct}%
                </>
              )}
              {cutoutStatus.kind === 'processing' && (
                <>
                  <Loader2 size={12} strokeWidth={1.5} className={styles.spin} />
                  Вырезаю фон…
                </>
              )}
              {cutoutStatus.kind === 'ready' && 'Готово'}
              {cutoutStatus.kind === 'error' && 'Ошибка — попробуй другое фото'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
