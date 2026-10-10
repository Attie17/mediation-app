import { resolveMediatorCase } from './pilotAccess.js';

export const MEMBERSHIP_STATUSES = new Set(['invited', 'active', 'removed']);
export const MEMBERSHIP_ROLES = new Set(['divorcee', 'mediator']);

export async function requireMediatorCase(db, caseId, userId) {
  const allowed = await resolveMediatorCase(db, String(caseId), userId);
  if (!allowed) {
    const error = new Error('Assigned mediator access required');
    error.status = 403;
    throw error;
  }
  // Call inside the write transaction; prevent concurrent organisation/assignment
  // changes between permission checking and mutation, and recheck after locking.
  await db.query('SELECT id FROM public.cases WHERE id = $1 FOR SHARE', [allowed.id]);
  await db.query(`SELECT user_id FROM public.app_users WHERE
    COALESCE(to_jsonb(app_users)->>'user_id', to_jsonb(app_users)->>'id') = $1 FOR SHARE`, [String(userId)]);
  if (!await resolveMediatorCase(db, String(allowed.id), userId)) {
    const error = new Error('Assigned mediator access required');
    error.status = 403;
    throw error;
  }
  return allowed;
}

export async function findVerifiedTarget(db, scope, { userId, email, role }) {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : null;
  if (!userId && !normalizedEmail) return null;
  const { rows } = await db.query(`
    SELECT COALESCE(to_jsonb(u)->>'user_id', to_jsonb(u)->>'id') AS user_id, u.email, u.name
    FROM public.app_users u
    JOIN auth.users a ON a.id::text = COALESCE(to_jsonb(u)->>'user_id', to_jsonb(u)->>'id')
    WHERE to_jsonb(u)->>'organization_id' = $1 AND to_jsonb(u)->>'role' = $2
      AND a.email_confirmed_at IS NOT NULL
      AND lower(a.email)=lower(u.email)
      AND ($3::text IS NULL OR a.id::text = $3)
      AND ($4::text IS NULL OR lower(u.email) = $4)
    FOR SHARE OF u, a`, [scope.organization_id, role, userId ? String(userId) : null, normalizedEmail]);
  return rows.length === 1 ? rows[0] : null;
}
