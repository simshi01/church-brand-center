export const BRAND = {
  fonts: {
    primary: "'TT Hoves Pro', sans-serif",
    expanded: "'TT Hoves Pro Expanded', sans-serif",
  },
  colors: {
    bg: '#FFFFFF',
    bgSecondary: '#F5F5F7',
    textPrimary: '#1D1D1F',
    textSecondary: '#6E6E73',
    accent: '#1D1D1F',
  },
} as const;

export const VARIANT_LABELS: Record<string, string> = {
  screen: 'Экран',
  'screen-16-9': 'Экран 16:9',
  'screen-4-3': 'Экран 4:3',
  post: 'Пост',
  'post-vertical': 'Пост верт.',
  story: 'Сторис',
  'print-a4': 'A4',
  'print-a3': 'A3',
  'screen-youtube': 'YouTube',
  'podcast-square': 'Подкаст',
  'post-sunday': 'Воскресный',
};

export const CATEGORIES = [
  { key: 'all', label: 'Все' },
  { key: 'screen', label: 'Экран' },
  { key: 'post', label: 'Пост' },
  { key: 'print', label: 'Печать' },
] as const;
