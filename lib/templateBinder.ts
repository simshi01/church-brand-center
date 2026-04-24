import { typograph } from './typograph';

export const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualzQAAAABJRU5ErkJggg==';

export interface Binding {
  kind: 'attr' | 'text';
  node: Element | Text;
  attr?: string;
  template: string;
  keys: string[];
}

const PLACEHOLDER = /\{\{(\w+)\}\}/g;

function extractKeys(s: string): string[] {
  const out: string[] = [];
  PLACEHOLDER.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = PLACEHOLDER.exec(s))) out.push(m[1]);
  return out;
}

function shouldTypograph(value: string): boolean {
  if (!value) return false;
  if (value.startsWith('#')) return false;
  if (value.startsWith('data:')) return false;
  if (value.startsWith('http')) return false;
  if (value.startsWith('/')) return false;
  if (/^\d+$/.test(value)) return false;
  return true;
}

/**
 * Walk a freshly mounted template DOM and record every place that originally
 * contained {{key}} placeholders (attributes and text nodes). Call once after
 * innerHTML. Skips <style>/<script> so accidental braces don't break them.
 *
 * After collection, the caller applies current values via applyBindings().
 * Subsequent value changes re-run applyBindings without touching innerHTML,
 * which keeps <img> elements alive. That matters on iOS Safari: rapid
 * innerHTML resets can drop the img decode and leave a white rectangle.
 */
export function collectBindings(root: HTMLElement): Binding[] {
  const bindings: Binding[] = [];

  const walkAttrs = (el: Element) => {
    const tag = el.tagName;
    if (tag === 'STYLE' || tag === 'SCRIPT') return;
    for (const attr of Array.from(el.attributes)) {
      if (attr.value.includes('{{')) {
        const keys = extractKeys(attr.value);
        if (keys.length) {
          bindings.push({
            kind: 'attr',
            node: el,
            attr: attr.name,
            template: attr.value,
            keys,
          });
        }
      }
    }
    for (const child of Array.from(el.children)) walkAttrs(child);
  };
  walkAttrs(root);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n: Node) {
      const parent = n.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName;
      if (tag === 'STYLE' || tag === 'SCRIPT') return NodeFilter.FILTER_REJECT;
      return n.nodeValue && n.nodeValue.includes('{{')
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const t = n as Text;
    const keys = extractKeys(t.nodeValue || '');
    if (keys.length) {
      bindings.push({
        kind: 'text',
        node: t,
        template: t.nodeValue || '',
        keys,
      });
    }
  }

  return bindings;
}

function resolveAttr(raw: string, attr: string): string {
  if (attr === 'src' && !raw) return TRANSPARENT_PIXEL;
  return raw;
}

function resolveText(raw: string): string {
  if (shouldTypograph(raw)) return typograph(raw);
  return raw;
}

function fill(
  template: string,
  keys: string[],
  values: Record<string, string>,
  resolver: (raw: string) => string
): string {
  let out = template;
  for (const key of keys) {
    out = out.split(`{{${key}}}`).join(resolver(values[key] ?? ''));
  }
  return out;
}

export function applyBindings(
  bindings: Binding[],
  values: Record<string, string>
): void {
  for (const b of bindings) {
    if (b.kind === 'attr') {
      const el = b.node as Element;
      const attr = b.attr!;
      const next = fill(b.template, b.keys, values, (raw) =>
        resolveAttr(raw, attr)
      );
      if (el.getAttribute(attr) !== next) {
        el.setAttribute(attr, next);
      }
    } else {
      const t = b.node as Text;
      const next = fill(b.template, b.keys, values, resolveText);
      if (t.nodeValue !== next) {
        t.nodeValue = next;
      }
    }
  }
}
