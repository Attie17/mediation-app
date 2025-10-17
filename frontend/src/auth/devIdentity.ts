// Utilities for stable dev UUID mapping per email
// Stores a map { email: uuid } in localStorage so identities persist across refresh

const MAP_KEY = 'devUserUuidMap';

export function ensureDevUuidForEmail(email: string): string {
  try {
    const raw = localStorage.getItem(MAP_KEY) || '{}';
    const map = JSON.parse(raw);
    if (map[email]) return map[email];
    const id = (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : genFallbackV4();
    map[email] = id;
    localStorage.setItem(MAP_KEY, JSON.stringify(map));
    return id;
  } catch (e) {
    console.warn('[devIdentity] failed to load/store map, generating ephemeral uuid', e);
    return genFallbackV4();
  }
}

function genFallbackV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isLikelyUuid(v?: string | null): boolean {
  return !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}
