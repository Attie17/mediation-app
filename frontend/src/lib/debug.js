// Lightweight debug logger for frontend (Vite / React)
// Usage: import { debug, warn, error, isDebug } from '../lib/debug';
// if (isDebug()) debug('notifications', 'Reply clicked', payload)

export const isDebug = () => {
  try {
    // Vite: import.meta.env.DEV; also allow window.DEBUG = true for ad-hoc enabling
    const viteDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
    const winDebug = typeof window !== 'undefined' && window && window.DEBUG === true;
    return Boolean(viteDev || winDebug);
  } catch (_) {
    return false;
  }
};

export const prefix = (ns) => `[${ns}]`;

export const debug = (ns, ...args) => {
  if (isDebug()) {
    // eslint-disable-next-line no-console
    console.log(prefix(ns), ...args);
  }
};

export const warn = (ns, ...args) => {
  if (isDebug()) {
    // eslint-disable-next-line no-console
    console.warn(prefix(ns), ...args);
  }
};

export const error = (ns, ...args) => {
  // Errors are useful in dev; keep them guarded for consistency
  if (isDebug()) {
    // eslint-disable-next-line no-console
    console.error(prefix(ns), ...args);
  }
};
