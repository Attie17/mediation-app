const KEY = 'lastRoute';
export const saveLastRoute = (path) => {
  try { localStorage.setItem(KEY, path); } catch {}
};
export const getLastRoute = () => {
  try { return localStorage.getItem(KEY) || null; } catch { return null; }
};
