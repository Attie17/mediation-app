// No application/database imports: dependencies are supplied by the caller.
export function disabledLegacyRegistration(req, res) {
  if (req.body?.role && req.body.role !== 'divorcee') {
    return res.status(403).json({ ok: false, error: { code: 'ROLE_NOT_ALLOWED', message: 'Privileged roles cannot be requested through registration.' } });
  }
  return res.status(503).json({ ok: false, error: { code: 'VERIFIED_REGISTRATION_REQUIRED', message: 'Account entry is unavailable until verified identity and invitations are configured.' } });
}

export function canReadCase(caseRecord, identity, membership) {
  if (!identity?.id || !identity.organization_id || !caseRecord?.organization_id) return false;
  if (String(identity.organization_id) !== String(caseRecord.organization_id)) return false;
  if (caseRecord.mediator_id && String(caseRecord.mediator_id) === String(identity.id)) return true;
  return membership?.status === 'active' && String(membership.user_id) === String(identity.id);
}

async function findCaseAccess(db, input, userId, permits) {
  if (!userId || typeof input !== 'string') return null;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const short = /^[1-9][0-9]*$/;
  if (input !== 'my-case' && !uuid.test(input) && !short.test(input)) return null;
  // Fetch candidate records only; no case contents are returned before scope checks.
  // JSON field lookup fails closed for absent organisation/status fields.
  const { rows } = await db.query(`
    SELECT c.id, c.short_id,
      to_jsonb(c)->>'organization_id' AS organization_id,
      to_jsonb(c)->>'mediator_id' AS mediator_id,
      to_jsonb(u)->>'organization_id' AS actor_organization_id,
      to_jsonb(u)->>'role' AS actor_role, to_jsonb(c)->>'status' AS case_status,
      cp.user_id AS member_user_id, to_jsonb(cp)->>'status' AS member_status,
      to_jsonb(cp)->>'role' AS member_role
    FROM public.cases c
    JOIN public.app_users u
      ON COALESCE(to_jsonb(u)->>'user_id', to_jsonb(u)->>'id') = $2
    LEFT JOIN public.case_participants cp ON cp.case_id = c.id AND cp.user_id::text = $2
    WHERE ($1 = 'my-case' OR c.id::text = $1 OR c.short_id::text = $1)
    ORDER BY c.created_at DESC`, [input, String(userId)]);
  for (const row of rows) {
    const identity = { id: userId, organization_id: row.actor_organization_id };
    const membership = { user_id: row.member_user_id, status: row.member_status };
    if (permits(row, identity, membership)) return {
      id: row.id, short_id: row.short_id, organization_id: row.organization_id
    };
  }
  return null;
}

export async function resolveAuthorizedCase(db, input, userId) {
  const found = await findCaseAccess(db, input, userId, canReadCase);
  return found ? { id: found.id, short_id: found.short_id } : null;
}

export async function resolveMediatorCase(db, input, userId) {
  return findCaseAccess(db, input, userId, (row, identity, membership) =>
    canReadCase(row, identity, membership) && row.actor_role === 'mediator' &&
    String(row.mediator_id) === String(userId) && !['closed', 'completed'].includes(row.case_status));
}

export async function resolveInvitationCase(db, input, userId) {
  return findCaseAccess(db, input, userId, (row, identity, membership) =>
    identity.organization_id && row.organization_id &&
    String(identity.organization_id) === String(row.organization_id) &&
    row.actor_role === 'divorcee' && row.member_role === 'divorcee' &&
    String(membership.user_id) === String(userId) && ['invited', 'active'].includes(membership.status) &&
    !['closed', 'completed'].includes(row.case_status));
}
