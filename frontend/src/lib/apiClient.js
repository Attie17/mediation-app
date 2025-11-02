// Minimal fetch wrapper with token + 401 handling
import config from '../config';

let _getToken = () => null;

export function bindTokenGetter(fn) { 
  _getToken = fn; 
}

export async function apiFetch(path, init = {}) {
  const base = config.api.baseUrl;
  const token = _getToken?.();
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  
  // In dev mode, send x-dev-email and x-dev-user-id headers so backend uses correct user
  if (token === 'dev-fake-token') {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('[apiClient] Dev mode - user from localStorage:', user);
    if (user.email) {
      headers.set('x-dev-email', user.email);
      console.log('[apiClient] Set x-dev-email:', user.email);
    }
    const resolvedUserId = user.user_id || user.id;
    if (resolvedUserId) {
      headers.set('x-dev-user-id', resolvedUserId);
      console.log('[apiClient] Set x-dev-user-id:', resolvedUserId);
    }
    const resolvedRole = user.role || 'admin';
    headers.set('x-dev-role', resolvedRole);
    console.log('[apiClient] Set x-dev-role:', resolvedRole);
  }
  
  const res = await fetch(`${base}${path}`, { ...init, headers });
  
  if (res.status === 401) {
    // dispatch a logout event; AuthContext will listen
    window.dispatchEvent(new CustomEvent('app:unauthorized'));
  }
  
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Handle validation errors with details
    let errorMessage = data?.error?.message || data?.error || res.statusText;
    if (data?.details && Array.isArray(data.details)) {
      errorMessage = data.details.map(d => d.message).join(', ');
    }
    throw Object.assign(new Error(errorMessage), { status: res.status, data });
  }
  return data;
}
