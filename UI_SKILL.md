# UI_SKILL.md — Jem Church Template Service: Frontend UI/UX Skill

## Философия

Интерфейс в стиле Apple — **чистый, светлый, функциональный**. Каждый элемент существует потому что он нужен. Никаких декораций ради декораций. Пространство — это тоже дизайн.

Ключевые принципы:
- **Контент — главное.** Интерфейс отступает на второй план. Превью шаблона занимает максимум экрана.
- **Тишина.** Мало цветов, мало элементов, много воздуха.
- **Тактильность.** Анимации мягкие, ease-out, 200–300ms. Элементы реагируют на hover/click приятно, но сдержанно.
- **Типографика вместо графики.** Иерархия строится шрифтами и весами, не цветами и иконками.

---

## Шрифты

### Основной шрифт интерфейса — TT Hoves Pro

Используем три начертания из семейства TT Hoves Pro:

| Начертание | CSS font-family | font-weight | Применение |
|---|---|---|---|
| TT Hoves Pro Medium | `'TT Hoves Pro', sans-serif` | 500 | Основной текст, поля ввода, описания |
| TT Hoves Pro DemiBold | `'TT Hoves Pro', sans-serif` | 600 | Заголовки секций, кнопки, акценты |
| TT Hoves Pro Expanded DemiBold | `'TT Hoves Pro Expanded', sans-serif` | 600 | Логотип, крупные заголовки страниц |

### Подключение шрифтов

Файлы .woff2 лежат в `/public/fonts/`. Подключаются глобально в layout.tsx через `@font-face`:

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

**ВАЖНО:** Фолбэк — `sans-serif`. Никогда не используй Inter, Arial, Helvetica или другие шрифты. Только TT Hoves Pro.

### Типографическая шкала

```css
--text-xs:   12px;   /* Мета-информация, хинты */
--text-sm:   13px;   /* Лейблы полей, категории */
--text-base: 15px;   /* Основной текст */
--text-lg:   17px;   /* Подзаголовки карточек */
--text-xl:   22px;   /* Заголовки секций */
--text-2xl:  28px;   /* Заголовки страниц */
--text-3xl:  36px;   /* Hero-заголовки */
```

Letter-spacing: `-0.01em` для text-base и меньше, `-0.02em` для text-xl и больше.
Line-height: `1.4` для текста, `1.15` для заголовков.

---

## Цветовая система

### Светлая тема (основная и единственная)

```css
:root {
  /* Фоны */
  --bg:              #FFFFFF;        /* Основной фон */
  --bg-secondary:    #F5F5F7;        /* Фон секций, сайдбара */
  --bg-tertiary:     #EBEBED;        /* Фон полей ввода, hover */
  
  /* Поверхности */
  --surface:         #FFFFFF;        /* Карточки, модалки */
  --surface-hover:   #F9F9FB;        /* Hover на карточках */
  
  /* Границы */
  --border:          #E2E2E7;        /* Основные разделители */
  --border-light:    #F0F0F2;        /* Тонкие разделители */
  --border-focus:    #007AFF;        /* Фокус на полях ввода */
  
  /* Текст */
  --text-primary:    #1D1D1F;        /* Заголовки, основной текст */
  --text-secondary:  #6E6E73;        /* Описания, лейблы */
  --text-tertiary:   #AEAEB2;        /* Плейсхолдеры, хинты */
  
  /* Акцент — церковный бренд */
  --accent:          #1D1D1F;        /* Кнопки, ссылки (чёрный как у Apple) */
  --accent-hover:    #424245;        /* Hover на кнопках */
  --accent-bg:       #F5F5F7;        /* Фон акцентных секций */
  
  /* Системные */
  --success:         #34C759;
  --error:           #FF3B30;
  --warning:         #FF9500;
  
  /* Тени */
  --shadow-sm:       0 1px 3px rgba(0,0,0,0.04);
  --shadow-md:       0 4px 12px rgba(0,0,0,0.06);
  --shadow-lg:       0 12px 40px rgba(0,0,0,0.08);
  --shadow-card:     0 2px 8px rgba(0,0,0,0.04), 0 0 1px rgba(0,0,0,0.06);
}
```

### Правила использования цветов

- **Фон страницы** — `--bg` (#FFFFFF) или `--bg-secondary` (#F5F5F7)
- **Текст на белом фоне** — только `--text-primary` и `--text-secondary`. Никогда не используй серый светлее чем `--text-secondary`
- **Разделители** — `--border` для основных, `--border-light` для фоновых секций. Толщина всегда 1px
- **Кнопки** — чёрные (`--accent`) с белым текстом для primary, прозрачные с `--border` для secondary
- **Никаких градиентов** — только solid цвета

---

## Компоненты

### Кнопки

```
Primary:     bg: --accent, text: white, radius: 10px, height: 44px, font-weight: 600
Secondary:   bg: transparent, border: --border, text: --text-primary, radius: 10px, height: 44px
Ghost:       bg: transparent, text: --text-secondary, no border, hover: --bg-tertiary
Icon:        bg: transparent, 36×36, radius: 8px, hover: --bg-tertiary
```

Padding кнопок: `0 20px`. Минимальная ширина: нет (по контенту).
Transition: `all 0.2s ease`.
Hover на Primary: `--accent-hover`, transform: `translateY(-0.5px)`, shadow: `--shadow-sm`.
Active: `transform: scale(0.98)`, transition 100ms.

### Поля ввода

```
Input:       bg: --bg-tertiary, border: none, radius: 10px, height: 44px, padding: 0 14px
             focus: border 2px --border-focus, bg: --bg
Textarea:    То же, min-height: 88px, padding: 12px 14px
```

Label над полем: `--text-secondary`, font-size: `--text-sm`, font-weight: 500, margin-bottom: 6px.
Placeholder: `--text-tertiary`.

### Карточки шаблонов (галерея)

```
Card:        bg: --surface, radius: 16px, overflow: hidden, shadow: --shadow-card
             hover: shadow: --shadow-md, transform: translateY(-2px), transition: 0.25s ease
Image:       aspect-ratio по размеру шаблона, object-fit: cover, bg: --bg-secondary
Body:        padding: 16px
Title:       --text-lg, font-weight: 600, --text-primary
Meta:        --text-sm, --text-secondary, margin-top: 4px
```

### Sidebar (панель редактирования)

```
Width:       380px (десктоп), фиксированная
Background:  --bg
Border:      1px solid --border справа
Padding:     24px
Sections:    разделены через divider (1px --border-light) с margin 24px 0
```

Section title: `--text-xs`, font-weight: 600, text-transform: uppercase, letter-spacing: 1.5px, color: `--text-tertiary`, margin-bottom: 14px.

### Color Picker

```
Swatch:      32×32, radius: 8px, border: 2px --border
Hex input:   рядом со swatch, flex: 1, --text-sm
Row:         display: flex, gap: 10px, align-items: center
```

### Slider (ползунок)

```
Track:       height: 4px, bg: --border, radius: 2px
Thumb:       16×16, bg: --accent, radius: 50%, shadow: --shadow-sm
Value:       --text-sm, --text-secondary, min-width: 40px, text-align: right
```

### Image Upload

```
Zone:        width: 100%, aspect-ratio: 16/9, radius: 12px
             border: 2px dashed --border, bg: --bg-secondary
             hover: border-color: --text-tertiary, bg: --bg-tertiary
Has image:   border: solid, показать превью с overlay "Заменить" при hover
```

### Toast / Notification

```
Position:    fixed, bottom: 24px, right: 24px (или center на мобильных)
Style:       bg: --text-primary, color: white, radius: 12px, padding: 12px 20px
             shadow: --shadow-lg
Animation:   slide up + fade in, 300ms cubic-bezier(0.34, 1.56, 0.64, 1)
Duration:    2 секунды, потом fade out
```

### Tabs (фильтр категорий)

```
Style:       Текстовые табы без фона. Active: --text-primary, font-weight: 600. 
             Inactive: --text-secondary, font-weight: 500.
             Нижняя линия 2px --accent под активным табом.
Gap:         24px между табами.
Height:      36px.
```

---

## Лейаут

### Главная (галерея)

```
┌─────────────────────────────────────────────────────┐
│  Jem Church                     [Все] [Экран] [Пост] [Печать]  │  ← header, height: 64px
├─────────────────────────────────────────────────────┤
│                                                     │
│  padding: 32px                                      │
│                                                     │
│  ┌────────┐  ┌────────┐  ┌────────┐                │
│  │ preview │  │ preview │  │ preview │               │  ← grid, 3 колонки
│  │        │  │        │  │        │               │    gap: 24px
│  │        │  │        │  │        │               │
│  ├────────┤  ├────────┤  ├────────┤               │
│  │ Назв.  │  │ Назв.  │  │ Назв.  │               │
│  │ Мета   │  │ Мета   │  │ Мета   │               │
│  └────────┘  └────────┘  └────────┘               │
│                                                     │
│  ┌────────┐  ┌────────┐                            │
│  │ preview │  │ preview │                           │
│  │        │  │        │                           │
│  ...                                                │
└─────────────────────────────────────────────────────┘
```

Карточка шаблона показывает все доступные размеры как бейджи внутри: `Экран` `Пост` `A4`.
При клике на карточку — переход в редактор с выбором размера.

### Редактор

```
┌─────────────────────────────────────────────────────┐
│  ← Назад   Название шаблона   [▾ Экран 2970×1080]  [Скачать ↓]  │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ sidebar  │              preview-area                │
│ 380px    │         (flex: 1, centered)              │
│          │                                          │
│ Содерж.  │     ┌─────────────────────────┐         │
│ ────── │     │                         │         │
│ Заголов. │     │      ШАБЛОН             │         │
│ [______] │     │      (масштаб)          │         │
│ Подзагол │     │                         │         │
│ [______] │     └─────────────────────────┘         │
│          │                                          │
│ Фон      │                                          │
│ ────── │                                          │
│ [Upload] │                                          │
│          │                                          │
│ Стиль    │                                          │
│ ────── │                                          │
│ Цвет: ■  │                                          │
│ Размер ──│                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

Дропдаун выбора размера `[▾ Экран 2970×1080]` — переключает текущий вариант шаблона. Превью обновляется мгновенно. Все данные (текст, изображения) сохраняются при переключении.

---

## Анимации и переходы

### Общие правила
- Transition: `0.2s ease` для hover, `0.3s ease-out` для появления элементов
- Никаких bounce-эффектов кроме toast
- Карточки при hover: `transform: translateY(-2px)`, transition `0.25s ease`
- Кнопки при hover: `translateY(-0.5px)`, при active: `scale(0.98)`
- Модальные окна: fade in 0.2s + scale from 0.97
- Sidebar элементы: stagger appear при загрузке страницы (delay 50ms каждый)

### Page transitions
- При переходе галерея → редактор: fade 200ms
- Превью шаблона появляется с opacity 0→1, 300ms

---

## Сетка и отступы

### Spacing scale (кратно 4)
```
4px   — micro gap (иконка к тексту)
8px   — tight gap (между inline-элементами)  
12px  — compact gap (label → input)
16px  — base gap (padding карточки, gap в grid)
24px  — section gap (между секциями sidebar)
32px  — page padding
48px  — крупные отступы между блоками
```

### Grid
- Галерея: CSS Grid, `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`, gap: 24px
- Редактор: CSS Grid, `grid-template-columns: 380px 1fr`

---

## Адаптивность

### Breakpoints
```
Desktop:     > 1200px   — полный лейаут, 3+ колонки
Tablet:      768-1200px — 2 колонки, sidebar складывается в нижнюю панель
Mobile:      < 768px    — 1 колонка, sidebar → bottom sheet
```

### Мобильный редактор
На мобильных sidebar уходит в нижний sheet (bottom sheet pattern):
- Шаблон превью — во весь экран сверху
- Снизу тянется панель с полями (drag handle сверху)
- Кнопка "Скачать" — sticky внизу sheet

---

## Иконки

Используем Lucide Icons (https://lucide.dev/). Размер: 20px для обычных, 16px для компактных.
Stroke-width: 1.5.
Цвет: `--text-secondary` по умолчанию, `--text-primary` при hover/active.

Никаких filled иконок. Только outline.

---

## Паттерны взаимодействия

### Загрузка изображения
1. Пользователь кликает на зону загрузки или перетаскивает файл
2. Изображение конвертируется в data:URI на клиенте
3. Превью обновляется мгновенно
4. В зоне загрузки появляется миниатюра с overlay "Заменить" при hover

### Изменение текстовых полей
1. Пользователь вводит текст
2. Превью обновляется в реальном времени (на каждый keystroke, debounce 0ms)
3. Smart text fitting автоматически подгоняет размер шрифта (см. CLAUDE.md)

### Скачивание
1. Клик на "Скачать" → тост "Генерирую файл..."
2. Серверный рендер через API
3. Тост "Готово!" + автоматическое скачивание файла
4. Если ошибка — тост с ошибкой, красный

### Переключение размера шаблона
1. Клик на дропдаун размера в header
2. Выпадающий список: "Экран 2970×1080", "Пост 1080×1080", "A4 2480×3508"
3. Превью мгновенно переключается, все введённые данные сохраняются
4. Поля могут меняться (у разных размеров могут быть разные наборы полей)

---

## Accessibility

- Все интерактивные элементы доступны с клавиатуры (Tab, Enter, Space)
- Focus ring: `2px solid --border-focus`, offset 2px
- Color contrast: минимум 4.5:1 для текста (AA)
- Image uploads: alt-текст "Загруженное фоновое изображение"
- Aria-labels на иконочных кнопках
- Язык страницы: `lang="ru"`

---

## Запрещено

- ❌ Градиенты
- ❌ Тени тяжелее `--shadow-lg`
- ❌ Border-radius больше 16px
- ❌ Шрифты кроме TT Hoves Pro / TT Hoves Pro Expanded
- ❌ Иконки кроме Lucide
- ❌ Цветные кнопки (синие, зелёные и т.д.) — только чёрные или прозрачные
- ❌ Placeholder-текст серее чем `--text-tertiary`
- ❌ Uppercase для кнопок
- ❌ Анимации дольше 400ms
- ❌ Тёмная тема (не планируется)
