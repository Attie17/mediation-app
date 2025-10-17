// Name formatting helpers

function capitalizeSegment(seg) {
  if (!seg) return seg;
  return seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase();
}

// Title-case names, handling spaces, hyphens, and apostrophes (e.g., "anne-marie o'brien" → "Anne-Marie O'Brien")
export function toTitleCaseName(name = '') {
  const clean = String(name).trim().replace(/\s+/g, ' ');
  if (!clean) return '';
  return clean
    .split(' ')
    .map(word =>
      word
        .split('-')
        .map(part =>
          part
            .split("'")
            .map(capitalizeSegment)
            .join("'")
        )
        .join('-')
    )
    .join(' ');
}

// Try to produce a human-friendly name from an email local-part (e.g., "ds.attie.nel" → "Ds Attie Nel")
export function nameFromEmail(email = '') {
  const local = String(email).split('@')[0] || '';
  const parts = local
    .replace(/\+/g, ' ')
    .replace(/[._-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return toTitleCaseName(parts.join(' '));
}

export function preferredNameOrName(user) {
  if (!user) return '';
  return user.preferredName || user.name || '';
}
