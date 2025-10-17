// Fallback singleton for environments where utils/singleton.js is missing
export function singleton(key, factory) {
  if (!window.__singletons) window.__singletons = {};
  if (!window.__singletons[key]) window.__singletons[key] = factory();
  return window.__singletons[key];
}
