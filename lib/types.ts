export interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  fields: FieldConfig[];
  variants: VariantConfig[];
}

export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'color' | 'image' | 'slider' | 'select' | 'toggle';
  default?: string;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  smartTextFit?: boolean;
  smartColor?: boolean;
  smartColorTarget?: boolean;
  smartCutout?: boolean;
  smartCutoutTarget?: boolean;
  hidden?: boolean;
}

export interface VariantConfig {
  code: string;
  label: string;
  width: number;
  height: number;
  template: string;
  exportFormat: 'png' | 'pdf';
  exportDPI?: number;
  fieldOverrides?: Record<string, Partial<FieldConfig> & {
    maxFontSize?: number;
    minFontSize?: number;
  }>;
  extraFields?: FieldConfig[];
}

export interface SmartColorResult {
  cardColor: string;
  textColor: string;
  palette: string[];
  confidence: number;
}
