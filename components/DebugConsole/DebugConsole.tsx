'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bug, Copy, Trash2, X } from 'lucide-react';
import { DebugEntry, debugLog } from '@/lib/debugLog';
import styles from './DebugConsole.module.css';

function fmtTime(at: number): string {
  const d = new Date(at);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

export default function DebugConsole() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<DebugEntry[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return debugLog.subscribe(setEntries);
  }, []);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [open, entries]);

  const copyAll = useCallback(async () => {
    const text = entries
      .map((e) => `${fmtTime(e.at)} [${e.tag}] ${e.level === 'info' ? '' : e.level.toUpperCase() + ' '}${e.message}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // iOS fallback — make a hidden textarea + selection
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* noop */ }
      document.body.removeChild(ta);
    }
  }, [entries]);

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-label="Debug-консоль"
        data-active={entries.length > 0 ? 'true' : 'false'}
      >
        <Bug size={18} strokeWidth={1.5} />
        {entries.length > 0 && <span className={styles.badge}>{entries.length}</span>}
      </button>

      {open && (
        <div className={styles.overlay} role="dialog" aria-label="Debug log">
          <div className={styles.header}>
            <span className={styles.title}>Debug · {entries.length}</span>
            <button
              type="button"
              className={styles.headerBtn}
              onClick={copyAll}
              aria-label="Скопировать логи"
            >
              <Copy size={16} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className={styles.headerBtn}
              onClick={() => debugLog.clear()}
              aria-label="Очистить"
            >
              <Trash2 size={16} strokeWidth={1.5} />
            </button>
            <button
              type="button"
              className={styles.headerBtn}
              onClick={() => setOpen(false)}
              aria-label="Закрыть"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>
          <div className={styles.list} ref={listRef}>
            {entries.length === 0 ? (
              <div className={styles.empty}>Пусто. Нажми «Скачать» — логи появятся здесь.</div>
            ) : (
              entries.map((e) => (
                <div
                  key={e.id}
                  className={styles.row}
                  data-level={e.level}
                >
                  <span className={styles.rowTime}>{fmtTime(e.at)}</span>
                  <span className={styles.rowTag}>{e.tag}</span>
                  <span className={styles.rowMsg}>{e.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
