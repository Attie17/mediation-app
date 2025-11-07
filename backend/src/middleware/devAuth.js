import { v5 as uuidv5, validate as isUuid } from 'uuid';

// Default namespace if not provided; should remain constant to produce stable UUIDs
const DEFAULT_NS = '6f8c2b65-9e3f-4f7a-9d3d-2a3d2b1c4d10';

export default function devAuth(req, _res, next) {
  const enabled = process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_ENABLED === 'true';
  if (!enabled) return next();
  if (req.user) return next(); // Already authenticated by a real mechanism

  const namespace = process.env.DEV_AUTH_NAMESPACE || DEFAULT_NS;
  const headerId = req.header('x-dev-user-id');
  const email = req.header('x-dev-email');
  const role = req.header('x-dev-role'); // Don't default to anything

  console.log('[devAuth] Headers:', { headerId, email, role, isValidUuid: isUuid(headerId || '') });

  if (!headerId && !email) return next(); // no dev identity provided
  if (!role) return next(); // no role specified, skip devAuth (let real auth handle it)

  // If headerId is provided and matches UUID format (even if it's a test UUID like 22222222-...), use it
  // Otherwise generate deterministic UUID from email
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const userId = (headerId && uuidRegex.test(headerId)) ? headerId : uuidv5(String(email || 'dev@example.com'), namespace);
  console.log('[devAuth] Using userId:', userId, 'from', (headerId && uuidRegex.test(headerId)) ? 'headerId' : 'email');
  const name = req.header('x-dev-name') || email?.split('@')[0] || 'Dev User';
  req.user = { id: userId, email: email || 'dev@example.com', role, name, dev: true };
  console.log('[devAuth] Set req.user:', req.user);
  return next();
}
// reload
// reload
