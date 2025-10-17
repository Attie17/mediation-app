// Robust global singleton helper to prevent duplicate SDK/runtime initialization across HMR reloads.
// Stores instances on globalThis.__appSingletons.
export function singleton<T>(key: string, factory: () => T): T {
  const g: any = (typeof globalThis !== 'undefined') ? globalThis : (typeof window !== 'undefined' ? window : {});
  g.__appSingletons ??= {};
  if (!g.__appSingletons[key]) {
    const instance = factory();
    g.__appSingletons[key] = instance;
    // Optional: freeze to avoid accidental mutation of container object reference
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug(`[singleton] created '${key}'`);
    }
  }
  return g.__appSingletons[key];
}

// Optional helper to inspect active singletons (dev only)
export function listSingletonKeys(): string[] {
  const g: any = (typeof globalThis !== 'undefined') ? globalThis : (typeof window !== 'undefined' ? window : {});
  return Object.keys(g.__appSingletons || {});
}
