import jwt from 'jsonwebtoken';
import { validate as isUuid, v5 as uuidv5 } from 'uuid';

const AUTH_HEADER_NAMES = ['authorization', 'Authorization'];

export function authenticateUser(req, res, next) {
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
    if (!rawHeader || !rawHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }
    const token = rawHeader.replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ error: 'Missing or invalid token' });

    // Primary: verify with DEV_JWT_SECRET if provided
    const devSecret = process.env.DEV_JWT_SECRET;
    if (devSecret) {
      try {
        const payload = jwt.verify(token, devSecret);
        req.user = { id: payload.sub, email: payload.email, role: payload.role || 'divorcee' };
        return next();
      } catch (e) {
        // Fall through to legacy dev-fake token logic or Supabase JWT below
      }
    }

    // Development bypass: allow a known fake token to simulate auth locally
    // This is only active in non-production environment and for tokens starting with 'dev-fake-'
    if (process.env.NODE_ENV !== 'production' && token.startsWith('dev-fake-')) {
      const devEmail = (req.headers['x-dev-email'] || 'dev@example.com').toString();
      const providedId = (req.headers['x-dev-user-id'] || '').toString();
      const devRole = (req.headers['x-dev-role'] || 'divorcee').toString();
      const NAMESPACE = '6f8c2b65-9e3f-4f7a-9d3d-2a3d2b1c4d10';
      let devId = providedId;
      if (!isUuid(devId)) {
        devId = uuidv5(devEmail, NAMESPACE);
        if (providedId) {
          console.warn('[auth:dev] Non-UUID x-dev-user-id supplied; derived deterministic v5 from email', { email: devEmail, derived: devId });
        }
      }
      req.user = { id: devId, role: devRole, email: devEmail, dev: true };
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
