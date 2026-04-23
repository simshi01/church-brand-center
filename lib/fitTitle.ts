/**
 * Синхронный font-fit: подгоняет fontSize заголовка чтобы он помещался в карточку.
 * Начинает с maxFontSize, уменьшает по 2px пока текст не поместится.
 * Вызывается в useLayoutEffect (до paint) — мерцания нет.
 */
export function fitTitleInCard(
  container: HTMLElement,
  maxFontSize: number,
  minFontSize: number,
): number {
  const title = container.querySelector('.screen__title') as HTMLElement;
  const card = container.querySelector('.screen__card') as HTMLElement;
  const subtitle = container.querySelector('.screen__subtitle') as HTMLElement;
  if (!title || !card) return maxFontSize;

  const cs = getComputedStyle(card);
  const contentW = card.clientWidth - parseInt(cs.paddingLeft) - parseInt(cs.paddingRight);
  const contentH = card.clientHeight - parseInt(cs.paddingTop) - parseInt(cs.paddingBottom);
  const subH = subtitle ? subtitle.offsetHeight : 0;
  const gap = 40;
  const maxTitleH = contentH - subH - gap;

  let size = maxFontSize;
  title.style.fontSize = size + 'px';

  while (size > minFontSize &&
    (title.scrollHeight > maxTitleH || title.scrollWidth > contentW)) {
    size -= 2;
    title.style.fontSize = size + 'px';
  }

  return size;
}
