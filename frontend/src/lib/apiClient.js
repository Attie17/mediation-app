// Minimal fetch wrapper with token + 401 handling
let _getToken = () => null;

export function bindTokenGetter(fn) { 
  _getToken = fn; 
}

export async function apiFetch(path, init = {}) {
  const base = import.meta.env.VITE_API_BASE || '';
  const token = _getToken?.();
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  
  const res = await fetch(`${base}${path}`, { ...init, headers });
  
  if (res.status === 401) {
    // dispatch a logout event; AuthContext will listen
    window.dispatchEvent(new CustomEvent('app:unauthorized'));
  }
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data?.error?.message || res.statusText), { status: res.status, data });
  return data;
}
