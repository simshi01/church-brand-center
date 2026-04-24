'use client';

export type DebugLevel = 'info' | 'warn' | 'error';

export interface DebugEntry {
  id: number;
  at: number;
  level: DebugLevel;
  tag: string;
  message: string;
}

type Listener = (entries: DebugEntry[]) => void;

const MAX_ENTRIES = 500;
let entries: DebugEntry[] = [];
let nextId = 0;
const listeners = new Set<Listener>();

function push(level: DebugLevel, tag: string, message: string) {
  const entry: DebugEntry = {
    id: nextId++,
    at: Date.now(),
    level,
    tag,
    message,
  };
  entries = [...entries.slice(-(MAX_ENTRIES - 1)), entry];
  for (const fn of listeners) fn(entries);

  if (typeof console !== 'undefined') {
    const prefix = `[${tag}]`;
    if (level === 'error') console.error(prefix, message);
    else if (level === 'warn') console.warn(prefix, message);
    else console.log(prefix, message);
  }
}

function format(value: unknown): string {
  if (value === undefined) return '';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function toMessage(args: unknown[]): string {
  return args.map(format).filter(Boolean).join(' ');
}

export const debugLog = {
  info(tag: string, ...args: unknown[]) {
    push('info', tag, toMessage(args));
  },
  warn(tag: string, ...args: unknown[]) {
    push('warn', tag, toMessage(args));
  },
  error(tag: string, ...args: unknown[]) {
    push('error', tag, toMessage(args));
  },
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    fn(entries);
    return () => {
      listeners.delete(fn);
    };
  },
  clear() {
    entries = [];
    for (const fn of listeners) fn(entries);
  },
  getAll(): DebugEntry[] {
    return entries;
  },
};
