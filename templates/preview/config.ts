import { TemplateConfig } from '@/lib/types';

export const config: TemplateConfig = {
  id: 'preview',
  name: 'Превью',
  description: 'Превью проповеди: YouTube или обложка подкаста',
  category: 'preview',
  tags: ['youtube', 'подкаст', 'превью', 'проповедь'],

  fields: [
    {
      key: 'title',
      label: 'Название проповеди',
      type: 'textarea',
      default: 'Радость — это дар',
      smartTextFit: true,
    },
    {
      key: 'subtitle',
      label: 'Имя проповедника',
      type: 'textarea',
      default: 'Вадим\nШаров',
    },
    {
      key: 'bgImage',
      label: 'Фото проповедника',
      type: 'image',
    },
  ],

  variants: [
    {
      code: 'screen-youtube',
      label: 'YouTube (1920×1080)',
      width: 1920,
      height: 1080,
      template: 'screen-youtube',
      exportFormat: 'png',
      fieldOverrides: {
        title: { maxFontSize: 140, minFontSize: 60 },
      },
    },
    {
      code: 'podcast-square',
      label: 'Подкаст (1400×1400)',
      width: 1400,
      height: 1400,
      template: 'podcast-square',
      exportFormat: 'png',
      fieldOverrides: {
        title: { maxFontSize: 200, minFontSize: 80 },
      },
    },
  ],
};
