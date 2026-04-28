'use client';

import { useState, useMemo, useCallback, useRef, CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { TemplateConfig } from '@/lib/types';
import { getTemplateHtml } from '@/templates/registry';
import { extractColors } from '@/lib/smartColor';
import { removeBackgroundFromDataURI } from '@/lib/bgRemoval';
import { useToast } from '@/lib/toastContext';
import { MOBILE_QUERY, useMediaQuery } from '@/lib/useMediaQuery';
import EditorSidebar from '@/components/EditorSidebar/EditorSidebar';
import EditorPreview, { EditorPreviewHandle } from '@/components/EditorPreview/EditorPreview';
import SizeSelector from '@/components/SizeSelector/SizeSelector';
import DownloadButton from '@/components/DownloadButton/DownloadButton';
import BottomSheet, { getSnapHeight, SnapPoint } from '@/components/BottomSheet/BottomSheet';
import type { CutoutStatus } from '@/components/ImageUploader/ImageUploader';
import styles from './Editor.module.css';

interface EditorProps {
  config: TemplateConfig;
}

export default function Editor({ config }: EditorProps) {
  const isMobile = useMediaQuery(MOBILE_QUERY);
  const [sheetSnap, setSheetSnap] = useState<SnapPoint>('half');

  const [variantCode, setVariantCode] = useState(config.variants[0].code);
  const variant = config.variants.find((v) => v.code === variantCode) || config.variants[0];
  const titleOverrides = variant.fieldOverrides?.title;
  const fitConfig = {
    maxFontSize: titleOverrides?.maxFontSize ?? 200,
    minFontSize: titleOverrides?.minFontSize ?? 80,
  };

  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const values: Record<string, string> = {};
    for (const f of config.fields) {
      values[f.key] = f.default || '';
    }
    return values;
  });

  const { showToast } = useToast();
  const previewRef = useRef<EditorPreviewHandle>(null);

  const titleSizeRef = useRef(fitConfig.maxFontSize);
  const handleTitleSizeComputed = useCallback((size: number) => {
    titleSizeRef.current = size;
  }, []);

  // Smart Color
  const [autoColorKeys, setAutoColorKeys] = useState<Set<string>>(new Set());
  const autoColorsRef = useRef<Record<string, string>>({});

  const smartColorTargetKeys = useMemo(
    () => config.fields.filter((f) => f.smartColorTarget).map((f) => f.key),
    [config.fields]
  );

  const smartColorImageField = useMemo(
    () => config.fields.find((f) => f.type === 'image' && f.smartColor),
    [config.fields]
  );

  // Smart Cutout
  const smartCutoutField = useMemo(
    () => config.fields.find((f) => f.type === 'image' && f.smartCutout),
    [config.fields]
  );
  const smartCutoutTargetField = useMemo(
    () => config.fields.find((f) => f.smartCutoutTarget),
    [config.fields]
  );

  const [cutoutEnabled, setCutoutEnabled] = useState(() => !!smartCutoutField);
  const [cutoutStatus, setCutoutStatus] = useState<CutoutStatus>({ kind: 'idle' });
  const cutoutRunIdRef = useRef(0);

  const runCutout = useCallback(async (sourceDataURI: string) => {
    if (!smartCutoutTargetField || !sourceDataURI) return;
    const runId = ++cutoutRunIdRef.current;
    setCutoutStatus({ kind: 'processing' });
    try {
      const result = await removeBackgroundFromDataURI(sourceDataURI, (p) => {
        if (cutoutRunIdRef.current !== runId) return;
        if (p.stage === 'downloading') {
          setCutoutStatus({ kind: 'downloading', pct: p.pct });
        } else {
          setCutoutStatus({ kind: 'processing' });
        }
      });
      if (cutoutRunIdRef.current !== runId) return;
      setFieldValues((prev) => ({ ...prev, [smartCutoutTargetField.key]: result }));
      setCutoutStatus({ kind: 'ready' });
    } catch (err) {
      if (cutoutRunIdRef.current !== runId) return;
      console.error('Cutout failed:', err);
      setCutoutStatus({ kind: 'error' });
      setCutoutEnabled(false);
      setFieldValues((prev) => ({ ...prev, [smartCutoutTargetField.key]: '' }));
      showToast('Не удалось вырезать фон', 'error');
    }
  }, [smartCutoutTargetField, showToast]);

  const handleCutoutToggle = useCallback((enabled: boolean) => {
    setCutoutEnabled(enabled);
    if (!enabled) {
      cutoutRunIdRef.current++;
      setCutoutStatus({ kind: 'idle' });
      if (smartCutoutTargetField) {
        setFieldValues((prev) => ({ ...prev, [smartCutoutTargetField.key]: '' }));
      }
      return;
    }
    const source = smartCutoutField ? fieldValues[smartCutoutField.key] : '';
    if (source) {
      runCutout(source);
    }
  }, [fieldValues, runCutout, smartCutoutField, smartCutoutTargetField]);

  const handleFieldChange = useCallback(async (key: string, value: string) => {
    setFieldValues((prev) => {
      const next = { ...prev, [key]: value };
      if (
        smartCutoutField &&
        key === smartCutoutField.key &&
        cutoutEnabled &&
        value &&
        smartCutoutTargetField
      ) {
        next[smartCutoutTargetField.key] = '';
      }
      return next;
    });

    if (smartColorImageField && key === smartColorImageField.key && value) {
      try {
        const result = await extractColors(value);
        if (result.confidence >= 0.1) {
          const colorMap: Record<string, string> = {};
          for (const targetKey of smartColorTargetKeys) {
            if (targetKey.toLowerCase().includes('card') || targetKey.toLowerCase().includes('bg')) {
              colorMap[targetKey] = result.cardColor;
            } else {
              colorMap[targetKey] = result.textColor;
            }
          }
          autoColorsRef.current = colorMap;
          setFieldValues((prev) => ({ ...prev, ...colorMap }));
          setAutoColorKeys(new Set(Object.keys(colorMap)));
        }
      } catch {
        // keep existing colors
      }
    }

    if (smartColorTargetKeys.includes(key) && key !== smartColorImageField?.key) {
      setAutoColorKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }

    if (smartCutoutField && key === smartCutoutField.key && cutoutEnabled && value) {
      runCutout(value);
    }
  }, [smartColorImageField, smartColorTargetKeys, smartCutoutField, smartCutoutTargetField, cutoutEnabled, runCutout]);

  const handleResetAutoColor = useCallback((key: string) => {
    const autoValue = autoColorsRef.current[key];
    if (autoValue) {
      setFieldValues((prev) => ({ ...prev, [key]: autoValue }));
      setAutoColorKeys((prev) => new Set(prev).add(key));
    }
  }, []);

  const templateHtml = useMemo(
    () => getTemplateHtml(config.id, variantCode) || '',
    [config.id, variantCode]
  );

  const cutoutActive =
    cutoutEnabled &&
    smartCutoutTargetField &&
    !!fieldValues[smartCutoutTargetField.key]
      ? 'true'
      : 'false';

  const previewValues = useMemo(
    () => ({
      ...fieldValues,
      titleSize: String(fitConfig.maxFontSize),
      cutoutActive,
    }),
    [fieldValues, fitConfig.maxFontSize, cutoutActive]
  );

  const sidebarEl = (
    <EditorSidebar
      fields={config.fields}
      values={fieldValues}
      onChange={handleFieldChange}
      autoColorKeys={autoColorKeys}
      onResetAutoColor={handleResetAutoColor}
      cutoutFieldKey={smartCutoutField?.key}
      cutoutEnabled={cutoutEnabled}
      onCutoutToggle={handleCutoutToggle}
      cutoutStatus={cutoutStatus}
    />
  );

  const downloadFullButton = (
    <DownloadButton
      templateId={config.id}
      variantCode={variantCode}
      format={variant.exportFormat}
      fields={fieldValues}
      getScreenElement={() => previewRef.current?.getScreenElement() || null}
      width={variant.width}
      height={variant.height}
      variant="full"
    />
  );

  const downloadIconButton = (
    <DownloadButton
      templateId={config.id}
      variantCode={variantCode}
      format={variant.exportFormat}
      fields={fieldValues}
      getScreenElement={() => previewRef.current?.getScreenElement() || null}
      width={variant.width}
      height={variant.height}
      variant="icon"
    />
  );

  const downloadBlockButton = (
    <DownloadButton
      templateId={config.id}
      variantCode={variantCode}
      format={variant.exportFormat}
      fields={fieldValues}
      getScreenElement={() => previewRef.current?.getScreenElement() || null}
      width={variant.width}
      height={variant.height}
      variant="block"
    />
  );

  // Reserve space at the bottom of preview equal to current sheet height
  // so the scale calculation sees the actually-available area.
  const reservedBottom = isMobile ? getSnapHeight(sheetSnap) : 0;
  const previewStyle: CSSProperties = isMobile
    ? ({ ['--reserved-bottom' as string]: `${reservedBottom}px` } as CSSProperties)
    : {};

  return (
    <div className={styles.editor}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/" className={styles.backBtn} aria-label="Назад к галерее">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </Link>
          <span className={styles.templateName}>{config.name}</span>
        </div>
        <div className={styles.headerRight}>
          <SizeSelector
            variants={config.variants}
            current={variantCode}
            onChange={setVariantCode}
          />
          {isMobile ? downloadIconButton : downloadFullButton}
        </div>
      </header>
      <div className={styles.body} style={previewStyle}>
        {!isMobile && <div className={styles.sidebarWrap}>{sidebarEl}</div>}
        <EditorPreview
          ref={previewRef}
          templateHtml={templateHtml}
          values={previewValues}
          variant={variant}
          maxFontSize={fitConfig.maxFontSize}
          minFontSize={fitConfig.minFontSize}
          onTitleSizeComputed={handleTitleSizeComputed}
          cutoutProcessing={cutoutStatus.kind === 'downloading' || cutoutStatus.kind === 'processing'}
        />
      </div>

      {isMobile && (
        <BottomSheet
          open
          snap={sheetSnap}
          onSnapChange={setSheetSnap}
          snapPoints={['collapsed', 'half', 'full']}
          peekHeight={72}
          title="Редактировать"
          ariaLabel="Панель редактирования шаблона"
          footer={downloadBlockButton}
        >
          {sidebarEl}
        </BottomSheet>
      )}
    </div>
  );
}
