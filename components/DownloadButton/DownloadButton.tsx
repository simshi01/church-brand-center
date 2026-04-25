'use client';

import { useState, useCallback, useRef } from 'react';
import { Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import html2canvas from 'html2canvas';
import { useToast } from '@/lib/toastContext';
import { debugLog } from '@/lib/debugLog';
import styles from './DownloadButton.module.css';

type DownloadVariant = 'full' | 'icon' | 'block';

interface DownloadButtonProps {
  templateId: string;
  variantCode: string;
  format: 'png' | 'pdf';
  fields: Record<string, string>;
  getScreenElement: () => HTMLElement | null;
  width: number;
  height: number;
  variant?: DownloadVariant;
}

const TRANSPARENT_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualzQAAAABJRU5ErkJggg==';

const MIN_EXPECTED_PNG_BYTES = 40 * 1024;

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) &&
    !(window as unknown as { MSStream?: unknown }).MSStream
  );
}

function srcPreview(src: string): string {
  if (!src) return '<empty>';
  if (!src.startsWith('data:')) return src;
  const [head, rest] = src.split(',');
  return `${head}, ${rest ? rest.length : 0}B`;
}

export default function DownloadButton({
  templateId,
  variantCode,
  format,
  fields,
  getScreenElement,
  width,
  height,
  variant = 'full',
}: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const inFlightRef = useRef(false);
  const { showToast } = useToast();

  const notifySuccess = useCallback(() => {
    if (isIOS() && format === 'png') {
      showToast(
        'Готово! Удерживай изображение и выбери «Сохранить в Фото»',
        'success',
        4500
      );
    } else {
      showToast('Готово!', 'success');
    }
  }, [format, showToast]);

  const handleDownload = useCallback(async () => {
    if (inFlightRef.current) {
      debugLog.warn('download', 'blocked: already in flight');
      return;
    }
    inFlightRef.current = true;
    setLoading(true);
    showToast('Генерирую файл...', 'info');

    debugLog.info('download', 'start', {
      templateId,
      variantCode,
      format,
      ua: navigator.userAgent,
      iOS: isIOS(),
      dpr: window.devicePixelRatio,
      vp: `${window.innerWidth}x${window.innerHeight}`,
    });

    try {
      const t0 = performance.now();
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, variantCode, format, fields }),
      });
      debugLog.info('download', `/api/render -> ${res.status} in ${Math.round(performance.now() - t0)}ms`);

      const contentType = res.headers.get('Content-Type') || '';
      debugLog.info('download', `content-type: ${contentType}`);

      if (contentType.includes('image/') || contentType.includes('application/pdf')) {
        const blob = await res.blob();
        debugLog.info('download', `server blob size=${blob.size}`);
        downloadBlob(blob, `${templateId}-${variantCode}.${format}`);
        notifySuccess();
        return;
      }

      debugLog.info('download', 'falling back to client render');

      if (typeof document !== 'undefined' && 'fonts' in document) {
        try {
          const tf = performance.now();
          await document.fonts.ready;
          debugLog.info('fonts', `fonts.ready in ${Math.round(performance.now() - tf)}ms`);
        } catch (err) {
          debugLog.warn('fonts', `fonts.ready threw: ${String(err)}`);
        }
      }

      const screenEl = getScreenElement();
      if (!screenEl) {
        debugLog.error('download', 'screen element not found');
        showToast('Ошибка: элемент не найден', 'error');
        return;
      }

      const rect = screenEl.getBoundingClientRect();
      debugLog.info('download', `screenEl rect=${Math.round(rect.width)}x${Math.round(rect.height)} target=${width}x${height}`);

      const blob = await captureScreenToPng(screenEl, width, height);
      if (!blob) {
        debugLog.error('download', 'captureScreenToPng returned null');
        showToast('Ошибка генерации', 'error');
        return;
      }

      debugLog.info('download', `final blob size=${blob.size} type=${blob.type}`);
      downloadBlob(blob, `${templateId}-${variantCode}.png`);
      notifySuccess();
    } catch (err) {
      debugLog.error('download', `exception: ${String(err)}`);
      console.error('Export error:', err);
      showToast('Ошибка генерации', 'error');
    } finally {
      inFlightRef.current = false;
      setLoading(false);
      debugLog.info('download', 'done');
    }
  }, [templateId, variantCode, format, fields, getScreenElement, width, height, showToast, notifySuccess]);

  const className = `${styles.btn} ${
    variant === 'icon' ? styles.btnIcon : variant === 'block' ? styles.btnBlock : styles.btnFull
  }`;

  return (
    <button
      className={className}
      onClick={handleDownload}
      disabled={loading}
      aria-label="Скачать"
    >
      <Download size={variant === 'block' ? 18 : 16} strokeWidth={1.5} />
      {variant !== 'icon' && (
        <span>{loading ? 'Генерирую...' : 'Скачать'}</span>
      )}
    </button>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function captureScreenToPng(
  screenEl: HTMLElement,
  width: number,
  height: number
): Promise<Blob | null> {
  const sourceParent = screenEl.parentElement;
  if (!sourceParent) {
    debugLog.error('capture', 'screen has no parent — cannot clone');
    return null;
  }

  // Off-screen clone: we'll mutate it freely without breaking the live
  // preview. The cloned <style> tag carries the template's CSS rules so
  // the cloned .screen has its 1200×1500 layout context.
  //
  // Position the wrapper off to the left (not visibility:hidden) —
  // visibility cascades to descendants and our composite filter drops
  // "invisible" imgs, ending up with an empty canvas. left:-99999 keeps
  // layout alive and imgs decodable without painting.
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;left:-99999px;top:0;pointer-events:none;';
  // Disable transitions/animations on every cloned element so we never
  // capture a half-finished filter swap.
  const noAnim = document.createElement('style');
  noAnim.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; animation-duration: 0s !important; }';
  wrapper.appendChild(noAnim);

  const treeClone = sourceParent.cloneNode(true) as HTMLElement;
  wrapper.appendChild(treeClone);
  document.body.appendChild(wrapper);
  debugLog.info('capture', 'off-screen clone mounted');

  try {
    const cloneScreen = treeClone.querySelector('.screen') as HTMLElement | null;
    if (!cloneScreen) {
      debugLog.error('capture', '.screen not found in clone');
      return null;
    }

    // Wait for cloned imgs to decode before we read their natural sizes.
    const cloneImgs = Array.from(cloneScreen.querySelectorAll('img'));
    debugLog.info('capture', `clone has ${cloneImgs.length} imgs; waiting decode`);
    await Promise.all(
      cloneImgs.map((im) =>
        im.decode().catch(() => {
          /* ignore — bake step will retry via fresh Image() */
        })
      )
    );

    // html2canvas doesn't support CSS filter on imgs reliably, doesn't
    // handle polygon clip-paths, and its object-fit: cover emulation is
    // imperfect. Bake the clipped photo layers (bg + cutout + grayscale +
    // polygon mask + object-fit cover) into a single flat <img> so the
    // renderer just sees a plain image it can blit to canvas.
    const composited = await compositeClippedContainers(cloneScreen);
    debugLog.info('capture', `composited ${composited} clipped container(s)`);

    await doubleRaf();

    const preImgs = Array.from(cloneScreen.querySelectorAll('img'));
    debugLog.info('capture', `pre-render: cloneScreen.outerHTML len=${cloneScreen.outerHTML.length}; imgs=${preImgs.length}`);
    preImgs.forEach((im, i) => {
      debugLog.info('capture', `pre-render img${i}: complete=${im.complete} natural=${im.naturalWidth}x${im.naturalHeight} srcLen=${im.getAttribute('src')?.length ?? 0}`);
    });

    // Diagnostic: cloneScreen size + positions of the info rows. Lets us
    // tell if html2canvas is seeing the expected geometry or layout is
    // drifting for some reason.
    const screenRect = cloneScreen.getBoundingClientRect();
    debugLog.info('layout', `.screen rect: ${Math.round(screenRect.width)}x${Math.round(screenRect.height)} @ (${Math.round(screenRect.left)},${Math.round(screenRect.top)}) offsetH=${cloneScreen.offsetHeight}`);
    const infoWrap = cloneScreen.querySelector('.screen__info') as HTMLElement | null;
    if (infoWrap) {
      const ir = infoWrap.getBoundingClientRect();
      debugLog.info('layout', `.screen__info rect: ${Math.round(ir.width)}x${Math.round(ir.height)} top=${Math.round(ir.top - screenRect.top)} bottom-from-screen=${Math.round(screenRect.bottom - ir.bottom)}`);
    }
    const infoRows = Array.from(cloneScreen.querySelectorAll('.screen__info-row')) as HTMLElement[];
    infoRows.forEach((row, i) => {
      const r = row.getBoundingClientRect();
      debugLog.info('layout', `.info-row[${i}] top=${Math.round(r.top - screenRect.top)} h=${Math.round(r.height)}`);
    });

    // Primary: html2canvas (Canvas 2D, no foreignObject). Renders the
    // already-composited photo layer plus the remaining text/box elements.
    let blob = await renderWithHtml2Canvas(cloneScreen, width, height);

    // Fallback: html-to-image. Its foreignObject path may still need extra
    // img baking since large data URIs get silently dropped there.
    if (!blob || blob.size < MIN_EXPECTED_PNG_BYTES) {
      debugLog.warn('capture', 'html2canvas output too small or missing — falling back to html-to-image');
      await prepareImagesForCapture(cloneScreen);
      await doubleRaf();
      const fallback = await renderWithHtmlToImage(cloneScreen, width, height);
      if (fallback && (!blob || fallback.size > blob.size)) {
        debugLog.info('capture', `fallback improved: ${blob?.size ?? 0} -> ${fallback.size}`);
        blob = fallback;
      }
    }
    return blob;
  } finally {
    document.body.removeChild(wrapper);
    debugLog.info('capture', 'off-screen clone removed');
  }
}

async function renderWithHtml2Canvas(
  screenEl: HTMLElement,
  width: number,
  height: number
): Promise<Blob | null> {
  const t0 = performance.now();
  try {
    const canvas = await html2canvas(screenEl, {
      width,
      height,
      scale: 1,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      // Normalise render context so baseline / positions don't drift based
      // on where the wrapper sits in the page or how far the user has
      // scrolled. Window size set to target so percent-based CSS resolves
      // consistently.
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      windowWidth: width,
      windowHeight: height,
      foreignObjectRendering: false,
    });
    debugLog.info('h2c', `done in ${Math.round(performance.now() - t0)}ms, canvas ${canvas.width}x${canvas.height}`);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png');
    });
    debugLog.info('h2c', `toBlob ${blob ? blob.size : 0}B`);
    return blob;
  } catch (err) {
    debugLog.error('h2c', `threw: ${String(err)}`);
    return null;
  }
}

async function renderWithHtmlToImage(
  screenEl: HTMLElement,
  width: number,
  height: number
): Promise<Blob | null> {
  const t0 = performance.now();
  try {
    const dataUrl = await toPng(screenEl, {
      width,
      height,
      pixelRatio: 1,
      skipAutoScale: true,
      skipFonts: true,
      includeQueryParams: true,
      imagePlaceholder: TRANSPARENT_PIXEL,
    });
    debugLog.info('h2i', `toPng done in ${Math.round(performance.now() - t0)}ms, dataUrl len=${dataUrl ? dataUrl.length : 0}`);
    if (!dataUrl) return null;
    const resp = await fetch(dataUrl);
    const blob = await resp.blob();
    debugLog.info('h2i', `blob ${blob.size}B type=${blob.type}`);
    return blob;
  } catch (err) {
    debugLog.error('h2i', `threw: ${String(err)}`);
    return null;
  }
}

function doubleRaf(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

async function decodeFreshImage(src: string): Promise<HTMLImageElement | null> {
  if (!src || src === TRANSPARENT_PIXEL) return null;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  try {
    await img.decode();
  } catch {
    await new Promise<void>((resolve) => {
      const done = () => resolve();
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
      setTimeout(done, 5000);
    });
  }
  if (!img.naturalWidth || !img.naturalHeight) return null;
  return img;
}

/**
 * Parse a CSS `clip-path: polygon(...)` value into a Path2D scaled to the
 * given box size. Returns null if the value isn't a polygon or the format
 * isn't recognised.
 */
function parseClipPathPolygon(css: string, w: number, h: number): Path2D | null {
  if (!css || !css.startsWith('polygon')) return null;
  const match = css.match(/polygon\([^)]*\)/);
  if (!match) return null;
  const inner = match[0].slice('polygon('.length, -1);
  const points = inner.split(',').map((p) => {
    const tokens = p.trim().split(/\s+/);
    const px = parsePercent(tokens[0] || '0');
    const py = parsePercent(tokens[1] || '0');
    return { x: px * w, y: py * h };
  });
  if (points.length < 3) return null;
  const path = new Path2D();
  path.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) path.lineTo(points[i].x, points[i].y);
  path.closePath();
  return path;
}

/**
 * Find every element whose computed clip-path is a polygon and that has
 * <img> descendants — those are the layered photo wrappers our templates
 * use. Walking only on demand.
 */
function findClippedContainers(root: HTMLElement): HTMLElement[] {
  const out: HTMLElement[] = [];
  const walk = (el: Element) => {
    if (el.tagName === 'IMG' || el.tagName === 'STYLE' || el.tagName === 'SCRIPT') return;
    const cs = getComputedStyle(el);
    const cp = cs.clipPath;
    if (cp && cp !== 'none' && cp.startsWith('polygon') && el.querySelector('img')) {
      out.push(el as HTMLElement);
      return; // don't descend; we'll composite the whole subtree
    }
    for (const child of Array.from(el.children)) walk(child);
  };
  walk(root);
  return out;
}

/**
 * For each clipped container, render its visible imgs (with their CSS
 * filters and object-fit/-position) plus the clip-path mask into a single
 * canvas, then replace the container's children with one plain <img> at
 * fixed pixel dimensions. The container's own clip-path is removed because
 * the polygon mask is now baked into the bitmap pixels (white outside,
 * photo inside). This collapses the whole layered structure into the
 * simplest possible foreignObject input — one block element, one image,
 * no clip-path, no transitions, no positioning tricks.
 *
 * Returns the number of containers it composited.
 */
async function compositeClippedContainers(root: HTMLElement): Promise<number> {
  const containers = findClippedContainers(root);
  let count = 0;
  for (let i = 0; i < containers.length; i++) {
    const ok = await compositeContainer(containers[i], i);
    if (ok) count++;
  }
  return count;
}

async function compositeContainer(container: HTMLElement, idx: number): Promise<boolean> {
  const w = container.clientWidth || container.offsetWidth;
  const h = container.clientHeight || container.offsetHeight;
  if (!w || !h) {
    debugLog.warn(`composite${idx}`, `container has zero size ${w}x${h} — skipping`);
    return false;
  }

  const cs = getComputedStyle(container);
  const polygonPath = parseClipPathPolygon(cs.clipPath, w, h);
  debugLog.info(`composite${idx}`, `target ${w}x${h}, clip=${cs.clipPath}`);

  // Imgs in document (z-index/paint) order. Skip ones display:none / hidden,
  // so the cutout layer is included only when active.
  const imgs = Array.from(container.querySelectorAll('img')).filter((im) => {
    const ics = getComputedStyle(im);
    return ics.display !== 'none' && ics.visibility !== 'hidden';
  });
  debugLog.info(`composite${idx}`, `compositing ${imgs.length} visible img(s)`);
  if (imgs.length === 0) return false;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    debugLog.error(`composite${idx}`, 'getContext returned null');
    return false;
  }

  // Fill outside-of-clip area with white so the JPEG-friendly composite
  // matches the .screen background.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  if (polygonPath) {
    ctx.save();
    ctx.clip(polygonPath);
  }

  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i];
    const src = img.getAttribute('src') || '';
    if (!src.startsWith('data:')) {
      debugLog.warn(`composite${idx}`, `img${i}: src not data URI — skipping`);
      continue;
    }

    const fresh = await decodeFreshImage(src);
    if (!fresh) {
      debugLog.warn(`composite${idx}`, `img${i}: decodeFreshImage returned null`);
      continue;
    }

    const ics = getComputedStyle(img);
    const filter = ics.filter;
    const hasGrayscale = !!filter && filter.includes('grayscale');

    const fit = ics.objectFit || 'cover';
    const pos = ics.objectPosition || '50% 50%';
    if (fit === 'cover' || fit === 'fill') {
      drawWithCover(ctx, fresh, w, h, pos);
    } else {
      ctx.drawImage(fresh, 0, 0, w, h);
    }
    debugLog.info(`composite${idx}`, `img${i}: drawn (${fresh.naturalWidth}x${fresh.naturalHeight}, fit=${fit}, pos=${pos})`);

    // Apply CSS filter manually via pixel manipulation instead of ctx.filter,
    // which iOS Safari's Canvas 2D silently ignores for drawImage(). Doing
    // this right after drawing THIS img and before drawing the next one so
    // only this layer gets grayscaled. Already-white outside-clip pixels
    // stay white (grayscale of 255,255,255 is still 255,255,255). putImageData
    // is not affected by the active clip region, but since white in stays
    // white out there's no visual difference outside the polygon.
    if (hasGrayscale) {
      const tgs = performance.now();
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      for (let p = 0; p < d.length; p += 4) {
        const g = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
        d[p] = d[p + 1] = d[p + 2] = g;
      }
      ctx.putImageData(imgData, 0, 0);
      debugLog.info(`composite${idx}`, `img${i}: grayscale baked via pixels in ${Math.round(performance.now() - tgs)}ms`);
    }
  }

  if (polygonPath) ctx.restore();

  // JPEG ok — every pixel is now opaque (we filled white below the photo).
  const composite = canvas.toDataURL('image/jpeg', 0.85);
  debugLog.info(`composite${idx}`, `composite jpeg len=${composite.length}`);
  if (!composite || composite.length < 1000) {
    debugLog.warn(`composite${idx}`, 'composite came out tiny — aborting replace');
    return false;
  }

  // Replace container content with a single <img> using 100% sizing. We
  // deliberately DON'T pin the container to explicit px — its CSS rules
  // (position:absolute;inset:0 = 1200×1500) already size it correctly, and
  // inline px can disturb adjacent absolutely-positioned info rows.
  while (container.firstChild) container.removeChild(container.firstChild);
  const flat = document.createElement('img');
  flat.src = composite;
  flat.alt = '';
  flat.style.cssText = 'display:block;width:100%;height:100%;object-fit:fill;';
  container.appendChild(flat);
  // Clip-path is baked into the pixels; drop it from the container so the
  // renderer doesn't try to re-apply it (html2canvas doesn't support polygon
  // clip-paths on HTML elements anyway).
  container.style.clipPath = 'none';

  try {
    await flat.decode();
  } catch {
    /* ignore */
  }
  return true;
}

function canvasHasPixels(ctx: CanvasRenderingContext2D, w: number, h: number): boolean {
  try {
    const cx = Math.floor(w / 2);
    const cy = Math.floor(h / 2);
    const { data } = ctx.getImageData(cx, cy, 1, 1);
    return data[3] !== 0;
  } catch (err) {
    debugLog.warn('bake', `getImageData threw: ${String(err)} — assuming ok`);
    return true;
  }
}

function parsePercent(token: string): number {
  if (!token) return 0.5;
  if (token.endsWith('%')) return parseFloat(token) / 100;
  if (token === 'left' || token === 'top') return 0;
  if (token === 'right' || token === 'bottom') return 1;
  if (token === 'center') return 0.5;
  const n = parseFloat(token);
  return Number.isFinite(n) ? n / 100 : 0.5;
}

/**
 * Emulate object-fit: cover with object-position by computing the draw rect
 * for ctx.drawImage. Lets us bake the visual crop into the canvas pixels so
 * we can output at the displayed (smaller) size and as JPEG.
 */
function drawWithCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  targetW: number,
  targetH: number,
  objectPosition: string
): void {
  const naturalW = img.naturalWidth;
  const naturalH = img.naturalHeight;
  const naturalAspect = naturalW / naturalH;
  const targetAspect = targetW / targetH;

  const tokens = (objectPosition || '50% 50%').split(/\s+/);
  const posX = parsePercent(tokens[0] || '50%');
  const posY = parsePercent(tokens[1] || '50%');

  let drawW: number;
  let drawH: number;
  let drawX: number;
  let drawY: number;

  if (naturalAspect > targetAspect) {
    // Source wider — fit height, crop sides
    drawH = targetH;
    drawW = drawH * naturalAspect;
    drawX = (targetW - drawW) * posX;
    drawY = 0;
  } else {
    // Source taller — fit width, crop top/bottom
    drawW = targetW;
    drawH = drawW / naturalAspect;
    drawX = 0;
    drawY = (targetH - drawH) * posY;
  }

  ctx.drawImage(img, drawX, drawY, drawW, drawH);
}

/**
 * For each <img>: bake the visible CSS filter + object-fit cover into canvas
 * pixels at the displayed size (typically 1200×1500 for our templates), then
 * output as JPEG when no transparency is needed (filter applied or source
 * was JPEG) — drastically smaller than re-encoding photos as PNG, which is
 * what was bloating the foreignObject and crashing the iOS export.
 */
async function prepareImagesForCapture(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'));
  debugLog.info('bake', `found ${imgs.length} <img> in screen`);

  await Promise.all(
    imgs.map(async (img, idx) => {
      const src = img.getAttribute('src') || '';
      const cls = img.className || '(no class)';
      debugLog.info(`img${idx}`, `class=${cls} src=${srcPreview(src)} liveNatural=${img.naturalWidth}x${img.naturalHeight}`);

      if (!src.startsWith('data:')) {
        debugLog.info(`img${idx}`, 'src is not data URI — skipping');
        return;
      }

      const cs = getComputedStyle(img);
      const filter = cs.filter;
      const hasFilter = !!filter && filter !== 'none';
      const objectFit = cs.objectFit || 'fill';
      const objectPosition = cs.objectPosition || '50% 50%';

      // Use the layout (CSS pixel) size of the element — that's what toPng
      // will draw at, and matches the variant export resolution because the
      // template's .screen has explicit width/height in px.
      const targetW = img.clientWidth || img.naturalWidth;
      const targetH = img.clientHeight || img.naturalHeight;

      if (!targetW || !targetH) {
        debugLog.warn(`img${idx}`, `bad target size ${targetW}x${targetH} — skipping`);
        return;
      }

      const t0 = performance.now();
      const fresh = await decodeFreshImage(src);
      if (!fresh) {
        debugLog.warn(`img${idx}`, `decodeFreshImage returned null`);
        return;
      }
      debugLog.info(`img${idx}`, `fresh decoded ${fresh.naturalWidth}x${fresh.naturalHeight} in ${Math.round(performance.now() - t0)}ms; target=${targetW}x${targetH} fit=${objectFit} pos=${objectPosition}`);

      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          debugLog.error(`img${idx}`, 'getContext("2d") returned null');
          return;
        }

        if (hasFilter) {
          debugLog.info(`img${idx}`, `baking CSS filter: ${filter}`);
          ctx.filter = filter;
        }

        if (objectFit === 'cover' || objectFit === 'fill') {
          drawWithCover(ctx, fresh, targetW, targetH, objectPosition);
        } else {
          // Fallback — stretch to fit (matches default 'fill')
          ctx.drawImage(fresh, 0, 0, targetW, targetH);
        }

        ctx.filter = 'none';

        if (!canvasHasPixels(ctx, targetW, targetH)) {
          debugLog.warn(`img${idx}`, 'canvas centre pixel is transparent — drawImage failed silently, skipping');
          return;
        }

        // Choose output format. JPEG is ~5x smaller than PNG for photos and
        // is what iOS Safari foreignObject digests reliably. PNG only when
        // the source was PNG and there's no filter overriding it (likely a
        // cutout that needs alpha).
        const isPng = src.startsWith('data:image/png');
        const useJpeg = hasFilter || !isPng;
        const baked = useJpeg
          ? canvas.toDataURL('image/jpeg', 0.85)
          : canvas.toDataURL('image/png');

        debugLog.info(`img${idx}`, `baked ${useJpeg ? 'jpeg' : 'png'} len=${baked.length} (src was ${src.length})`);

        if (!baked) {
          debugLog.warn(`img${idx}`, 'toDataURL returned empty');
          return;
        }
        if (baked === src) {
          debugLog.info(`img${idx}`, 'baked equals original — leaving original src');
          return;
        }

        img.setAttribute('src', baked);
        img.style.filter = 'none';
        // The visual crop is now baked into the bitmap; tell the browser to
        // stretch the new image to the box without re-cropping.
        img.style.objectFit = 'fill';
        img.style.objectPosition = '0 0';
        debugLog.info(`img${idx}`, 'replaced src + filter/object-fit reset');

        if (!(img.complete && img.naturalWidth > 0)) {
          try {
            await img.decode();
            debugLog.info(`img${idx}`, `live re-decoded ${img.naturalWidth}x${img.naturalHeight}`);
          } catch (err) {
            debugLog.warn(`img${idx}`, `live re-decode threw: ${String(err)}`);
          }
        }
      } catch (err) {
        debugLog.error(`img${idx}`, `bake exception: ${String(err)}`);
      }
    })
  );
  debugLog.info('bake', 'prepareImagesForCapture done');
}
