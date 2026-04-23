# CLAUDE.md — Jem Church Template Service

## Обзор проекта

Веб-сервис (Brand Center) для миссий церкви "Посольство Иисуса" (Jem Church) в других городах и регионах. Миссии выбирают подготовленный дизайн-шаблон из библиотеки, заполняют свои данные (город, дата, тема, фото), получают все нужные форматы (экран, пост, печать) и скачивают готовые файлы в бренд-стиле. Никаких дизайнерских навыков не требуется.

---

## UI/UX Skill

**Все интерфейсы проекта строятся по UI_SKILL.md** — это обязательный файл, описывающий дизайн-систему: шрифты (TT Hoves Pro), цвета, компоненты, лейауты, анимации, правила. Перед созданием любого компонента или страницы — прочитай UI_SKILL.md.

Ключевое: светлый Apple-минимализм, шрифт TT Hoves Pro (Medium, DemiBold, Expanded), никаких других шрифтов.

---

## Стек

- **Фронтенд:** Next.js 14+ (App Router), TypeScript, CSS Modules
- **Рендер/экспорт:** Puppeteer (серверный рендер HTML → PNG/PDF)
- **Деплой:** Vercel (фронт) + Railway (Puppeteer-сервер)
- **База данных:** нет на старте — шаблоны хранятся в коде
- **Шрифты:** TT Hoves Pro — файлы .woff2 в `/public/fonts/`, подключаются через @font-face (см. раздел "Шрифты")
- **Иконки:** Lucide Icons (outline only, stroke-width 1.5)

---

## Архитектура

```
/
├── app/
│   ├── page.tsx                         # Главная — библиотека шаблонов
│   ├── editor/[templateId]/
│   │   └── page.tsx                     # Редактор шаблона (все размеры внутри)
│   ├── api/
│   │   └── render/route.ts              # API: данные → PNG/PDF через Puppeteer
│   └── layout.tsx                       # Глобальный layout + @font-face
│
├── components/
│   ├── TemplateGallery.tsx              # Сетка карточек шаблонов
│   ├── TemplateCard.tsx                 # Карточка одного шаблона (превью + бейджи размеров)
│   ├── Editor.tsx                       # Основной layout редактора (sidebar + preview)
│   ├── EditorSidebar.tsx                # Панель полей слева
│   ├── EditorPreview.tsx                # Live-превью шаблона (scaled iframe)
│   ├── SizeSelector.tsx                 # Дропдаун выбора размера (Экран / Пост / A4)
│   ├── FieldInput.tsx                   # Текстовое поле
│   ├── ColorPicker.tsx                  # Выбор цвета (swatch + hex input)
│   ├── ImageUploader.tsx                # Drag & drop загрузка изображения
│   ├── SizeSlider.tsx                   # Ползунок размера
│   ├── DownloadButton.tsx               # Кнопка скачивания с выбором формата
│   ├── CategoryTabs.tsx                 # Фильтр категорий (Все / Экран / Пост / Печать)
│   └── Toast.tsx                        # Уведомления
│
├── templates/
│   ├── registry.ts                      # Реестр всех шаблонов
│   ├── seminar/                         # Пример: шаблон "Семинар"
│   │   ├── config.ts                    # Конфиг: все размеры, поля, дефолты
│   │   ├── screen.html                  # HTML для экрана (2970×1080)
│   │   ├── post.html                    # HTML для поста (1080×1080)
│   │   ├── post-story.html              # HTML для сторис (1080×1920)
│   │   ├── print-a4.html               # HTML для печати A4
│   │   └── preview.png                  # Превью для галереи
│   ├── worship-night/
│   │   ├── config.ts
│   │   ├── screen.html
│   │   ├── post.html
│   │   └── preview.png
│   └── ...
│
├── lib/
│   ├── renderTemplate.ts               # Подстановка переменных {{key}} → значение
│   ├── puppeteerRender.ts              # Puppeteer: HTML → PNG/PDF
│   ├── smartColor.ts                   # Извлечение палитры из изображения
│   ├── smartTextFit.ts                 # Авто-подгонка размера текста
│   ├── imageUtils.ts                   # Конвертация, ресайз, data:URI
│   └── constants.ts                    # Бренд-токены
│
├── public/
│   └── fonts/
│       ├── TTHovesPro-Medium.woff2
│       ├── TTHovesPro-DemiBold.woff2
│       └── TTHovesProExpanded-DemiBold.woff2
│
├── CLAUDE.md                            # ← этот файл
└── UI_SKILL.md                          # Дизайн-система интерфейса
```

---

## Концепция: Библиотека шаблонов с множественными размерами

### Ключевая идея

Один шаблон = один дизайн-концепт, но с несколькими размерами. Например, шаблон "Семинар" содержит варианты для экрана зала, для Instagram-поста, для сторис и для печатного флаера. Пользователь заходит в редактор, заполняет данные **один раз**, и переключает между размерами через дропдаун. Все введённые данные сохраняются при переключении.

### Размеры (варианты)

Каждый шаблон может содержать любой набор из этих вариантов:

| Вариант | Код | Размер (px) | Назначение |
|---|---|---|---|
| Экран (широкий) | `screen` | 2970 × 1080 | Проектор/экран в зале |
| Экран (16:9) | `screen-16-9` | 1920 × 1080 | Стандартный экран |
| Пост квадрат | `post` | 1080 × 1080 | Instagram, VK, Telegram |
| Пост вертикальный | `post-vertical` | 1080 × 1350 | Instagram пост |
| Сторис | `story` | 1080 × 1920 | Instagram/VK сторис |
| Печать A4 | `print-a4` | 2480 × 3508 | Флаер A4 (300 DPI) |
| Печать A3 | `print-a3` | 3508 × 4960 | Плакат A3 (300 DPI) |

Не каждый шаблон обязан иметь все варианты. Минимум — один вариант.

### Структура конфига шаблона

```typescript
// templates/seminar/config.ts

export const config: TemplateConfig = {
  id: 'seminar',
  name: 'Семинар',
  description: 'Анонс семинара с фоновым изображением',
  category: 'events',
  tags: ['семинар', 'обучение', 'событие'],
  
  // Общие поля — одинаковые для всех размеров
  fields: [
    {
      key: 'title',
      label: 'Заголовок',
      type: 'textarea',
      default: 'История церкви',
      smartTextFit: true,          // включить авто-подгонку размера
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
      smartColor: true,            // включить авто-извлечение цвета
    },
    {
      key: 'cardColor',
      label: 'Цвет карточки',
      type: 'color',
      default: '#e6d4bb',
      smartColorTarget: true,      // это поле обновляется smart color
    },
    {
      key: 'textColor',
      label: 'Цвет текста',
      type: 'color',
      default: '#483419',
      smartColorTarget: true,
    },
  ],
  
  // Варианты размеров
  variants: [
    {
      code: 'screen',
      label: 'Экран (широкий)',
      width: 2970,
      height: 1080,
      template: 'screen.html',
      exportFormat: 'png',
      // Переопределения полей для этого размера (опционально)
      fieldOverrides: {
        title: { default: 'История церкви', maxFontSize: 200, minFontSize: 80 },
        subtitle: { default: 'Семинар', maxFontSize: 60 },
      },
    },
    {
      code: 'post',
      label: 'Пост (1080×1080)',
      width: 1080,
      height: 1080,
      template: 'post.html',
      exportFormat: 'png',
      fieldOverrides: {
        title: { maxFontSize: 96, minFontSize: 40 },
        subtitle: { maxFontSize: 32 },
      },
    },
    {
      code: 'story',
      label: 'Сторис (1080×1920)',
      width: 1080,
      height: 1920,
      template: 'post-story.html',
      exportFormat: 'png',
    },
    {
      code: 'print-a4',
      label: 'Печать A4',
      width: 2480,
      height: 3508,
      template: 'print-a4.html',
      exportFormat: 'pdf',
      exportDPI: 300,
    },
  ],
};
```

### TypeScript типы

```typescript
interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  fields: FieldConfig[];
  variants: VariantConfig[];
}

interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'color' | 'image' | 'slider' | 'select';
  default?: string;
  options?: { label: string; value: string }[]; // для type: 'select'
  min?: number;   // для slider
  max?: number;   // для slider
  smartTextFit?: boolean;
  smartColor?: boolean;
  smartColorTarget?: boolean;
}

interface VariantConfig {
  code: string;
  label: string;
  width: number;
  height: number;
  template: string;    // имя HTML-файла
  exportFormat: 'png' | 'pdf';
  exportDPI?: number;  // для PDF, по умолчанию 72
  fieldOverrides?: Record<string, Partial<FieldConfig> & {
    maxFontSize?: number;
    minFontSize?: number;
  }>;
  extraFields?: FieldConfig[];  // доп. поля только для этого размера
}
```

---

## Шрифты — автоматическая загрузка

### Проблема

Шрифты TT Hoves Pro — коммерческие. Они не должны требовать установки на устройстве пользователя. При этом они нужны в двух местах: в интерфейсе сервиса и внутри HTML-шаблонов при серверном рендере.

### Решение

**1. Интерфейс сервиса (Next.js)**

Файлы .woff2 лежат в `/public/fonts/`. Подключаются глобально в `app/layout.tsx`:

```css
@font-face {
  font-family: 'TT Hoves Pro';
  font-weight: 500;
  font-style: normal;
  font-display: swap;
  src: url('/fonts/TTHovesPro-Medium.woff2') format('woff2');
}

@font-face {
  font-family: 'TT Hoves Pro';
  font-weight: 600;
  font-style: normal;
  font-display: swap;
  src: url('/fonts/TTHovesPro-DemiBold.woff2') format('woff2');
}

@font-face {
  font-family: 'TT Hoves Pro Expanded';
  font-weight: 600;
  font-style: normal;
  font-display: swap;
  src: url('/fonts/TTHovesProExpanded-DemiBold.woff2') format('woff2');
}
```

Шрифты загружаются из CDN Vercel — никому ничего устанавливать не нужно.

**2. HTML-шаблоны при серверном рендере (Puppeteer)**

При рендере через Puppeteer шаблон открывается как локальный HTML. Шрифты нужны Puppeteer-серверу. Два подхода (реализовать оба с фолбэком):

**Подход A — Base64 инлайн (надёжный):**
При подготовке HTML к рендеру, `renderTemplate.ts` конвертирует файлы шрифтов в base64 и вставляет прямо в CSS шаблона:

```typescript
// lib/renderTemplate.ts
import fs from 'fs';
import path from 'path';

function inlineFonts(html: string): string {
  const fontsDir = path.join(process.cwd(), 'public', 'fonts');
  
  const fontFiles = {
    'TTHovesPro-Medium.woff2': { family: 'TT Hoves Pro', weight: '500' },
    'TTHovesPro-DemiBold.woff2': { family: 'TT Hoves Pro', weight: '600' },
    'TTHovesProExpanded-DemiBold.woff2': { family: 'TT Hoves Pro Expanded', weight: '600' },
  };

  let fontFaceCSS = '';
  for (const [file, config] of Object.entries(fontFiles)) {
    const fontBuffer = fs.readFileSync(path.join(fontsDir, file));
    const base64 = fontBuffer.toString('base64');
    fontFaceCSS += `
      @font-face {
        font-family: '${config.family}';
        font-weight: ${config.weight};
        font-style: normal;
        src: url('data:font/woff2;base64,${base64}') format('woff2');
      }
    `;
  }

  // Вставить перед </head>
  return html.replace('</head>', `<style>${fontFaceCSS}</style></head>`);
}
```

**Подход B — Установка шрифтов на сервер (Railway):**
В Dockerfile Puppeteer-сервера копируем .ttf файлы в `/usr/local/share/fonts/` и запускаем `fc-cache`. Это позволяет Puppeteer использовать шрифты через `local()`.

```dockerfile
COPY fonts/*.ttf /usr/local/share/fonts/
RUN fc-cache -f -v
```

**Приоритет:** использовать подход A (base64 инлайн) как основной — он работает везде без конфигурации сервера. Подход B — как дополнительный для production.

**3. Live-превью в браузере пользователя**

В iframe редактора шаблон загружается как HTML blob. Шрифты уже загружены глобально в layout.tsx, поэтому iframe наследует их. Если не наследует (cross-origin) — инлайнить base64 прямо в HTML превью.

---

## Smart Color — автоматический подбор цветов из обложки

### Задача

Когда пользователь загружает фоновое изображение, система автоматически предлагает гармоничные цвета для карточки и текста. Пользователь может принять или отклонить предложение.

### Алгоритм (lib/smartColor.ts)

#### Шаг 1 — Извлечение палитры

```
Изображение → Canvas (уменьшенное до 100×100) → getImageData() → 
→ Квантование цветов (Modified Median Cut) → Топ-8 доминантных цветов
```

Реализация:
1. Загрузить изображение в `<canvas>` размером 100×100 (для скорости)
2. Получить все пиксели через `getImageData()`
3. Отфильтровать почти белые (L > 95) и почти чёрные (L < 5) пиксели
4. Применить алгоритм **Modified Median Cut** (рекурсивное деление цветового пространства пополам по оси с наибольшим разбросом) для получения 8 кластеров
5. Отсортировать кластеры по количеству пикселей (доминантность)

Библиотека: использовать **quantize** (npm) или реализовать свою — алгоритм простой.

#### Шаг 2 — Подбор пары card + text

Из палитры нужно выбрать два цвета: фон карточки и цвет текста. Правила:

```
1. cardColor — выбрать из палитры цвет с:
   - Lightness (HSL) между 75–92 (светлый, но не белый)
   - Saturation между 10–50 (не кислотный)
   - Если нет подходящего — взять самый светлый цвет из палитры и поднять Lightness до 85
   
2. textColor — выбрать тёмный контрастный:
   - Взять самый тёмный цвет из палитры (Lightness < 30)
   - Проверить контраст с cardColor по WCAG AA (≥ 4.5:1)
   - Если контраста не хватает — затемнить textColor до достижения 4.5:1
   - Если не удаётся найти хроматический тёмный — использовать нейтральный: 
     взять hue от cardColor, saturation 15%, lightness 20%

3. Финальная проверка:
   - Contrast ratio cardColor ↔ textColor ≥ 4.5:1 (WCAG AA)
   - cardColor не должен сливаться с белым фоном: Delta-E (cardColor, white) > 15
```

#### Шаг 3 — Применение

```typescript
interface SmartColorResult {
  cardColor: string;    // hex
  textColor: string;    // hex
  palette: string[];    // все 8 извлечённых цветов
  confidence: number;   // 0-1, насколько система уверена в результате
}
```

- Результат показывается как предложение: "Подобрали цвета из обложки" с preview
- Два режима: автоприменение (по умолчанию) или предложение
- Пользователь всегда может переопределить цвета вручную
- Если `confidence < 0.5` (однотонное изображение, мало вариации) — не предлагать, оставить дефолтные

#### Шаг 4 — UX в интерфейсе

При загрузке изображения:
1. Анимация анализа (пульсация color swatch, 500ms)
2. Color picker плавно меняет значение на предложенное (transition 300ms)
3. Маленький бейдж "Авто" рядом с color picker — если пользователь меняет цвет вручную, бейдж исчезает
4. Кнопка "Сбросить к авто" рядом — возвращает smart color

### Зависимости

- `quantize` (npm) — для Modified Median Cut. Или своя реализация.
- Никаких тяжёлых библиотек. Весь алгоритм < 200 строк.

---

## Smart Text Fit — автоматическая подгонка размера текста

### Задача

Текст заголовка не должен вылезать за пределы контейнера. При изменении текста (больше символов, длиннее слова) размер шрифта автоматически уменьшается. При коротком тексте — увеличивается до максимума.

### Алгоритм (lib/smartTextFit.ts)

#### Стратегия: бинарный поиск размера шрифта

```
Input:
  - text: string           (текст заголовка)
  - containerWidth: number (ширина контейнера в px)
  - containerHeight: number (высота контейнера в px, опционально)
  - maxFontSize: number    (максимальный размер из конфига)
  - minFontSize: number    (минимальный размер из конфига)
  - fontFamily: string
  - fontWeight: number
  - letterSpacing: number  (в px)
  - lineHeight: number     (множитель)

Output:
  - fontSize: number (px)
```

#### Реализация: два подхода в зависимости от контекста

**На клиенте (live-превью в браузере):**

Используем hidden DOM element для измерения:

```typescript
function fitText(params: FitTextParams): number {
  const {
    text, containerWidth, containerHeight,
    maxFontSize, minFontSize,
    fontFamily, fontWeight, letterSpacing, lineHeight
  } = params;

  // Создаём hidden измерительный элемент
  const measurer = document.createElement('div');
  measurer.style.cssText = `
    position: absolute;
    visibility: hidden;
    white-space: pre-wrap;
    word-break: break-word;
    width: ${containerWidth}px;
    font-family: ${fontFamily};
    font-weight: ${fontWeight};
    letter-spacing: ${letterSpacing}px;
    line-height: ${lineHeight};
  `;
  document.body.appendChild(measurer);

  // Бинарный поиск
  let low = minFontSize;
  let high = maxFontSize;
  let result = minFontSize;

  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    measurer.style.fontSize = `${mid}px`;
    measurer.textContent = text;

    const fits = containerHeight
      ? (measurer.scrollHeight <= containerHeight && measurer.scrollWidth <= containerWidth)
      : (measurer.scrollHeight <= mid * lineHeight * 3); // макс 3 строки

    if (fits) {
      result = mid;
      low = mid;
    } else {
      high = mid;
    }
  }

  document.body.removeChild(measurer);
  return result;
}
```

**На сервере (Puppeteer рендер):**

При серверном рендере шаблон содержит inline JS, который выполняется в Puppeteer:

```html
<script>
  // Smart Text Fit — выполняется при рендере
  (function() {
    const titleEl = document.querySelector('.template-title');
    const container = titleEl.parentElement;
    const maxSize = parseInt(titleEl.dataset.maxFontSize || '200');
    const minSize = parseInt(titleEl.dataset.minFontSize || '80');
    
    let size = maxSize;
    titleEl.style.fontSize = size + 'px';
    
    while (size > minSize && (
      titleEl.scrollWidth > container.clientWidth ||
      titleEl.scrollHeight > container.clientHeight
    )) {
      size -= 2;
      titleEl.style.fontSize = size + 'px';
    }
  })();
</script>
```

#### Правила подгонки

1. **Приоритет — сохранить читаемость.** Минимальный размер шрифта определяется в конфиге (обычно 40-50% от максимального)
2. **Шаг уменьшения** — 2px при бинарном поиске (достаточная точность)
3. **Многострочный текст** — учитываем и ширину и высоту контейнера
4. **Однострочный текст (subtitle)** — учитываем только ширину
5. **Кеширование** — результат кешируется для того же текста, чтобы не пересчитывать при каждом рендере
6. **Debounce на клиенте** — пересчёт через 100ms после последнего нажатия клавиши (не на каждый keystroke)
7. **Анимация изменения размера** — CSS transition на font-size: 150ms ease-out (только на клиенте, не в рендере)

#### Граничные случаи

- **Пустой текст** — использовать placeholder, размер = maxFontSize
- **Один символ** — ограничить maxFontSize * 0.8 (слишком большие одиночные буквы выглядят плохо)
- **Очень длинное слово без пробелов** — включить `overflow-wrap: break-word`, разрешить перенос
- **Текст на двух языках** — работает одинаково, но для кириллицы и латиницы метрики шрифта разные, поэтому всегда измеряем через DOM, не вычисляем

---

## Формат HTML-шаблонов

### Плейсхолдеры

```html
{{title}}          — основной заголовок
{{subtitle}}       — подзаголовок / тип события
{{city}}           — название города миссии
{{date}}           — дата события
{{time}}           — время
{{address}}        — адрес
{{bgImage}}        — URL фонового изображения (data:URI или путь)
{{cardColor}}      — цвет карточки (hex)
{{textColor}}      — цвет текста (hex)
{{titleSize}}      — размер заголовка в px (может быть вычислен smart text fit)
{{subtitleSize}}   — размер подзаголовка в px
```

### Обязательные data-атрибуты в HTML-шаблоне

Для работы smart text fit шаблон должен содержать:

```html
<p class="template-title"
   data-smart-text-fit="true"
   data-max-font-size="200"
   data-min-font-size="80"
   data-container-selector=".template-card">
  {{title}}
</p>
```

### Обязательная структура HTML-шаблона

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <style>
    /* @font-face будут инлайниться при рендере */
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    .screen {
      position: relative;
      width: {{WIDTH}}px;   /* из variant.width */
      height: {{HEIGHT}}px;  /* из variant.height */
      overflow: hidden;
    }
    
    /* ... стили шаблона ... */
  </style>
</head>
<body>
  <div class="screen">
    <!-- содержимое шаблона -->
  </div>
  
  <!-- Smart Text Fit скрипт (для серверного рендера) -->
  <script>
    (function() {
      document.querySelectorAll('[data-smart-text-fit]').forEach(el => {
        const max = parseInt(el.dataset.maxFontSize || '200');
        const min = parseInt(el.dataset.minFontSize || '40');
        const containerSel = el.dataset.containerSelector;
        const container = containerSel ? document.querySelector(containerSel) : el.parentElement;
        
        let size = max;
        el.style.fontSize = size + 'px';
        
        while (size > min && (
          el.scrollWidth > container.clientWidth * 0.95 ||
          el.scrollHeight > container.clientHeight * 0.9
        )) {
          size -= 2;
          el.style.fontSize = size + 'px';
        }
      });
    })();
  </script>
</body>
</html>
```

---

## API рендера

### POST /api/render

Принимает данные шаблона + вариант размера, рендерит через Puppeteer.

**Request:**
```json
{
  "templateId": "seminar",
  "variantCode": "screen",
  "format": "png",
  "fields": {
    "title": "История церкви",
    "subtitle": "Семинар",
    "bgImage": "data:image/jpeg;base64,...",
    "cardColor": "#e6d4bb",
    "textColor": "#483419"
  }
}
```

**Response:** бинарный файл (`image/png` или `application/pdf`)

### Логика рендера

1. Загрузить конфиг шаблона по `templateId`
2. Найти вариант по `variantCode`
3. Загрузить HTML-файл варианта
4. Инлайнить шрифты через base64 (`inlineFonts()`)
5. Заменить все `{{key}}` на значения из `fields`
6. Открыть HTML в Puppeteer с `viewport` = width × height из конфига варианта
7. Дождаться загрузки шрифтов: `await page.evaluateHandle('document.fonts.ready')`
8. Дождаться выполнения Smart Text Fit скрипта
9. Сделать скриншот (PNG) или PDF
10. Вернуть файл

### Puppeteer конфигурация

```typescript
// Для PNG (экраны и посты)
await page.screenshot({
  type: 'png',
  clip: { x: 0, y: 0, width: variant.width, height: variant.height },
  omitBackground: false,
});

// Для PDF (печать)
await page.pdf({
  width: `${variant.width / (variant.exportDPI / 72)}px`,
  height: `${variant.height / (variant.exportDPI / 72)}px`,
  printBackground: true,
  preferCSSPageSize: true,
});
```

---

## Фичи — MVP

1. **Библиотека шаблонов** — главная страница с карточками, фильтр по категориям
2. **Множественные размеры** — каждый шаблон содержит несколько вариантов, переключаются в редакторе
3. **Редактор** — sidebar с полями + live-превью, данные сохраняются при переключении размера
4. **Live-превью** — HTML рендерится в iframe, масштабируется через CSS transform
5. **Smart Color** — авто-подбор цветов карточки и текста из загруженного фонового изображения
6. **Smart Text Fit** — авто-подгонка размера заголовка чтобы не вылезал за пределы
7. **Загрузка изображений** — drag & drop, конвертация в data:URI
8. **Экспорт PNG** — серверный рендер через Puppeteer для экранов и постов
9. **Экспорт PDF** — серверный рендер с 300 DPI для печатных форматов
10. **Автоматические шрифты** — TT Hoves Pro загружаются с сервера, никаких установок

## Фичи — v2+

- Авторизация (invite-ссылка или пароль)
- История скачиваний и аналитика
- Админка для добавления шаблонов
- Bulk-экспорт (все размеры одного шаблона за раз)
- AI-генерация текстов для постов
- Кастомные шрифты для отдельных миссий

---

## Команды

```bash
npm install
npm run dev          # Next.js dev server
npm run build        # Production build
npm run render       # Запуск Puppeteer render server (отдельно)
```

---

## Checklist перед коммитом

- [ ] Все компоненты соответствуют UI_SKILL.md
- [ ] Шрифты подключены через @font-face, не через CDN и не через local()
- [ ] HTML-шаблоны содержат data-атрибуты для smart text fit
- [ ] Smart color корректно обрабатывает однотонные изображения
- [ ] Превью масштабируется на разных экранах
- [ ] Все варианты размеров переключаются без потери данных
- [ ] Puppeteer рендер ждёт загрузки шрифтов перед скриншотом
- [ ] Экспорт PDF использует правильный DPI
