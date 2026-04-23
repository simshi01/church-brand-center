import { typograph } from './typograph';

// Values that should NOT be typographed (colors, images, sizes)
export function shouldTypograph(value: string): boolean {
  if (!value) return false;
  if (value.startsWith('#')) return false;        // hex color
  if (value.startsWith('data:')) return false;     // data URI
  if (value.startsWith('http')) return false;       // URL
  if (value.startsWith('/')) return false;          // path
  if (/^\d+$/.test(value)) return false;           // pure number
  return true;
}

// 1x1 transparent PNG as fallback for empty image fields
const TRANSPARENT_PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualzQAAAABJRU5ErkJggg==';

export function renderTemplate(
  html: string,
  fields: Record<string, string>
): string {
  let result = html;
  for (const [key, value] of Object.entries(fields)) {
    let processed: string;
    if (key === 'bgImage' && !value) {
      processed = TRANSPARENT_PIXEL;
    } else {
      processed = shouldTypograph(value) ? typograph(value) : value;
    }
    result = result.replaceAll(`{{${key}}}`, processed);
  }
  return result;
}
