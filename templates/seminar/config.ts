import { TemplateConfig } from '@/lib/types';

export const config: TemplateConfig = {
  id: 'seminar',
  name: 'Анонс/Заставка на экран',
  description: 'Анонс события с фоновым изображением и карточкой',
  category: 'events',
  tags: ['семинар', 'обучение', 'событие'],

  fields: [
    {
      key: 'title',
      label: 'Заголовок',
      type: 'textarea',
      default: 'История церкви',
      smartTextFit: true,
    },
    {
      key: 'subtitle',
      label: 'Подзаголовок',
      type: 'text',
      default: 'Семинар',
    },
    {
      key: 'bgImage',
      label: 'Фоновое изображение',
      type: 'image',
      smartColor: true,
    },
    {
      key: 'cardColor',
      label: 'Цвет карточки',
      type: 'color',
      default: '#e6d4bb',
      smartColorTarget: true,
    },
    {
      key: 'textColor',
      label: 'Цвет текста',
      type: 'color',
      default: '#483419',
      smartColorTarget: true,
    },
  ],

  variants: [
    {
      code: 'screen',
      label: 'Экран (широкий)',
      width: 2970,
      height: 1080,
      template: 'screen',
      exportFormat: 'png',
      fieldOverrides: {
        title: { maxFontSize: 200, minFontSize: 80 },
        subtitle: { maxFontSize: 60 },
      },
    },
    {
      code: 'screen-16-9',
      label: 'Экран (16:9)',
      width: 1920,
      height: 1080,
      template: 'screen-16-9',
      exportFormat: 'png',
      fieldOverrides: {
        title: { maxFontSize: 200, minFontSize: 80 },
        subtitle: { maxFontSize: 60 },
      },
    },
    {
      code: 'screen-4-3',
      label: 'Экран (4:3)',
      width: 1440,
      height: 1080,
      template: 'screen-4-3',
      exportFormat: 'png',
      fieldOverrides: {
        title: { maxFontSize: 200, minFontSize: 80 },
        subtitle: { maxFontSize: 60 },
      },
    },
    {
      code: 'post',
      label: 'Пост (1200×1600)',
      width: 1200,
      height: 1600,
      template: 'post',
      exportFormat: 'png',
      fieldOverrides: {
        title: { maxFontSize: 120, minFontSize: 44 },
        subtitle: { maxFontSize: 36 },
      },
    },
    {
      code: 'story',
      label: 'Сторис (1080×1920)',
      width: 1080,
      height: 1920,
      template: 'story',
      exportFormat: 'png',
      fieldOverrides: {
        title: { maxFontSize: 120, minFontSize: 50 },
        subtitle: { maxFontSize: 40 },
      },
    },
    {
      code: 'print-a4',
      label: 'Печать A4',
      width: 2480,
      height: 3508,
      template: 'print-a4',
      exportFormat: 'pdf',
      exportDPI: 300,
      fieldOverrides: {
        title: { maxFontSize: 180, minFontSize: 60 },
        subtitle: { maxFontSize: 50 },
      },
    },
  ],
};
