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
  const role = req.header('x-dev-role') || 'divorcee';

  if (!headerId && !email) return next(); // no dev identity provided

  const userId = isUuid(headerId || '') ? headerId : uuidv5(String(email || 'dev@example.com'), namespace);
  const name = req.header('x-dev-name') || email?.split('@')[0] || 'Dev User';
  req.user = { id: userId, email: email || 'dev@example.com', role, name, dev: true };
  return next();
}
