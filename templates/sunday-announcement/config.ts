import { TemplateConfig } from '@/lib/types';

export const config: TemplateConfig = {
  id: 'sunday-announcement',
  name: 'Анонс воскресного',
  description: 'Вертикальный пост со служениями, фото с лестничным вырезом',
  category: 'post',
  tags: ['воскресное', 'анонс', 'пост'],

  fields: [
    {
      key: 'speaker',
      label: 'Имя проповедника',
      type: 'text',
      default: 'Вадим Шаров',
    },
    {
      key: 'service1Time',
      label: 'Время — 1-е служение',
      type: 'text',
      default: '09:30',
    },
    {
      key: 'service1Address',
      label: 'Адрес — 1-е служение',
      type: 'text',
      default: '50-летия Победы, 18',
    },
    {
      key: 'service2Time',
      label: 'Время — 2-е служение',
      type: 'text',
      default: '12:00',
    },
    {
      key: 'service2Address',
      label: 'Адрес — 2-е служение',
      type: 'text',
      default: '50-летия Победы, 18',
    },
    {
      key: 'bgImage',
      label: 'Фото проповедника',
      type: 'image',
      smartCutout: true,
    },
    {
      key: 'bgImageCutout',
      type: 'image',
      label: '',
      smartCutoutTarget: true,
      hidden: true,
    },
    {
      key: 'serviceCount',
      label: 'Количество служений',
      type: 'select',
      default: '2',
      options: [
        { label: 'Одно', value: '1' },
        { label: 'Два', value: '2' },
      ],
    },
    {
      key: 'service1Online',
      label: 'Онлайн — 1-е служение',
      type: 'toggle',
      default: 'false',
    },
    {
      key: 'service2Online',
      label: 'Онлайн — 2-е служение',
      type: 'toggle',
      default: 'true',
    },
  ],

  variants: [
    {
      code: 'post-sunday',
      label: 'Анонс (1200×1500)',
      width: 1200,
      height: 1500,
      template: 'post-sunday',
      exportFormat: 'png',
    },
  ],
};
