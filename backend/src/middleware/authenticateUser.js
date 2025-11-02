import jwt from 'jsonwebtoken';
import { validate as isUuid, v5 as uuidv5 } from 'uuid';

const AUTH_HEADER_NAMES = ['authorization', 'Authorization'];

export function authenticateUser(req, res, next) {
  console.log('[auth] authenticateUser called', { path: req.path, method: req.method });
  // If devAuth (or another upstream middleware) already set req.user, honor it in dev
  if (req.user) {
    if (process.env.DEV_AUTH_ENABLED === 'true' && process.env.NODE_ENV !== 'production') {
      console.log('[auth] bypass via devAuth');
    }
    return next();
  }
  try {
    const headerKey = AUTH_HEADER_NAMES.find((key) => typeof req.headers[key] === 'string');
    const rawHeader = headerKey ? req.headers[headerKey] : null;
    console.log('[auth] Authorization header:', rawHeader?.substring(0, 30) + '...');
    if (!rawHeader || !rawHeader.startsWith('Bearer ')) {
      console.log('[auth] Missing or invalid Authorization header');
      return res.status(401).json({ error: 'Missing or invalid token' });
    }
    const token = rawHeader.replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ error: 'Missing or invalid token' });

    // Primary: verify with JWT_SECRET or DEV_JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET || process.env.DEV_JWT_SECRET;
    if (jwtSecret) {
      try {
        const payload = jwt.verify(token, jwtSecret);
        console.log('[auth] JWT payload decoded:', { sub: payload.sub, email: payload.email, role: payload.role });
        req.user = { id: payload.sub, email: payload.email, role: payload.role || 'divorcee' };
        console.log('[auth] req.user set to:', req.user);
        return next();
      } catch (e) {
        console.log('[auth] JWT verification failed:', e.message);
        // Fall through to legacy dev-fake token logic or Supabase JWT below
      }
    }

    // Development bypass: allow a known fake token to simulate auth locally
    // This is only active in non-production environment and for tokens starting with 'dev-fake-'
    if (process.env.NODE_ENV !== 'production' && token.startsWith('dev-fake-')) {
      const devEmail = (req.headers['x-dev-email'] || 'dev@example.com').toString();
      const providedId = (req.headers['x-dev-user-id'] || '').toString();
      const devRole = (req.headers['x-dev-role'] || 'divorcee').toString();
      console.log('[auth:dev] Headers received:', { 
        'x-dev-email': devEmail, 
        'x-dev-user-id': providedId, 
        'x-dev-role': devRole 
      });
      const NAMESPACE = '6f8c2b65-9e3f-4f7a-9d3d-2a3d2b1c4d10';
      let devId = providedId;
      if (!isUuid(devId)) {
        devId = uuidv5(devEmail, NAMESPACE);
        if (providedId) {
          console.warn('[auth:dev] Non-UUID x-dev-user-id supplied; derived deterministic v5 from email', { email: devEmail, derived: devId });
        } else {
          console.log('[auth:dev] No x-dev-user-id provided; derived deterministic v5 from email', { email: devEmail, derived: devId });
        }
      } else {
        console.log('[auth:dev] Using provided x-dev-user-id:', devId);
      }
      req.user = { id: devId, role: devRole, email: devEmail, dev: true };
      console.log('[auth:dev] Set req.user:', req.user);
      return next();
    }
    // Supabase JWT fallback
    const supaSecret = process.env.SUPABASE_JWT_SECRET;
    if (!supaSecret) {
      console.error('Supabase JWT secret is not configured. Set SUPABASE_JWT_SECRET in the environment.');
      return res.status(500).json({ error: 'Authentication is not configured' });
    }
    const payload = jwt.verify(token, supaSecret);
    const userId = payload?.sub || payload?.user_id || payload?.id;
    const role = payload?.role || payload?.app_metadata?.role || payload?.user_role;
    if (!userId) return res.status(401).json({ error: 'Invalid token payload' });
    req.user = { id: userId, role: role || 'divorcee', email: payload?.email, ...('app_metadata' in payload ? { app_metadata: payload.app_metadata } : {}) };
    return next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
// reload
