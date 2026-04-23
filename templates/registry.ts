import { TemplateConfig } from '@/lib/types';
import { config as seminarConfig } from './seminar/config';
import { templateMap as seminarTemplates } from './seminar/templates';
import { config as previewConfig } from './preview/config';
import { templateMap as previewTemplates } from './preview/templates';
import { config as sundayConfig } from './sunday-announcement/config';
import { templateMap as sundayTemplates } from './sunday-announcement/templates';

interface TemplateEntry {
  config: TemplateConfig;
  templates: Record<string, string>;
}

const registry: Record<string, TemplateEntry> = {
  seminar: {
    config: seminarConfig,
    templates: seminarTemplates,
  },
  preview: {
    config: previewConfig,
    templates: previewTemplates,
  },
  'sunday-announcement': {
    config: sundayConfig,
    templates: sundayTemplates,
  },
};

export function getTemplate(id: string): TemplateEntry | undefined {
  return registry[id];
}

export function getAllTemplates(): TemplateConfig[] {
  return Object.values(registry).map((entry) => entry.config);
}

export function getTemplatesByCategory(category: string): TemplateConfig[] {
  const all = getAllTemplates();
  if (category === 'all') return all;

  return all.filter((t) =>
    t.variants.some((v) => {
      if (category === 'screen') return v.code.startsWith('screen');
      if (category === 'post') return v.code === 'story' || v.code.startsWith('post');
      if (category === 'print') return v.code.startsWith('print');
      return false;
    })
  );
}

export function getTemplateHtml(templateId: string, variantCode: string): string | undefined {
  const entry = registry[templateId];
  if (!entry) return undefined;
  return entry.templates[variantCode];
}
