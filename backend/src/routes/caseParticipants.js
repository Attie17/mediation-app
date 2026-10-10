import express from 'express';
import { pool } from '../db.js';
import { withTransaction } from '../utils/tx.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { resolveAuthorizedCase, resolveInvitationCase } from '../security/pilotAccess.js';
import { requireMediatorCase, findVerifiedTarget, MEMBERSHIP_ROLES, MEMBERSHIP_STATUSES } from '../security/membership.js';
import { insertNotification } from '../utils/notifications.js';

const router = express.Router({ mergeParams: true });
const getCaseId = req => {
  const parts = req.baseUrl.split('/');
  return req.params.id || req.params.caseId || parts[parts.length - 2];
};
const fail = (status, message) => Object.assign(new Error(message), { status });
async function write(res, callback) {
  try { return await withTransaction(pool, callback); }
  catch (error) {
    res.status(error.status || (['42703', '42P01'].includes(error.code) ? 503 : 500))
      .json({ error: error.status ? error.message : 'Membership operation unavailable' });
  }
}
async function notify(userId, message) {
  try { await insertNotification(userId, message, 'participant'); }
  catch { /* Membership state is committed; notification failure cannot grant access. */ }
}
router.get('/participants/ping', (_req, res) => res.json({ ok: true }));
router.get('/ping', (_req, res) => res.json({ msg: 'participants router alive' }));
router.use(authenticateUser);

router.get('/', async (req, res) => {
  try {
    const scope = await resolveAuthorizedCase(pool, String(getCaseId(req)), req.user?.id);
    if (!scope) return res.status(403).json({ error: 'Case access required' });
    const result = await pool.query(`SELECT cp.*, to_jsonb(cp)->>'status' AS status,
      json_build_object('name',u.name,'email',u.email) AS app_users
      FROM case_participants cp JOIN cases c ON c.id=cp.case_id
      JOIN app_users u ON COALESCE(to_jsonb(u)->>'user_id',to_jsonb(u)->>'id')=cp.user_id::text
      WHERE cp.case_id=$1 AND to_jsonb(u)->>'organization_id'=to_jsonb(c)->>'organization_id'`, [scope.id]);
    res.json(result.rows);
  } catch { res.status(503).json({ error: 'Membership data unavailable' }); }
});

router.post('/invite', async (req, res) => {
  const { userId, email, role } = req.body || {};
  if (!MEMBERSHIP_ROLES.has(role) || (!userId && !email)) return res.status(400).json({ error: 'Valid target and membership role required' });
  const row = await write(res, async client => {
    const scope = await requireMediatorCase(client, getCaseId(req), req.user?.id);
    const target = await findVerifiedTarget(client, scope, { userId, email, role });
    if (!target) throw fail(404, 'Verified user in this practice required');
    const result = await client.query(`INSERT INTO case_participants(case_id,user_id,role,status)
      VALUES($1,$2,$3,'invited') ON CONFLICT(case_id,user_id) DO NOTHING RETURNING *`, [scope.id,target.user_id,role]);
    if (!result.rows[0]) throw fail(409, 'Participant already exists; review their membership explicitly');
    return { ...result.rows[0], email: target.email };
  });
  if (res.headersSent) return;
  await notify(row.user_id, 'You have been invited to a mediation case.');
  return res.json(row);
});

router.post('/accept', async (req, res) => {
  if (req.body?.userId && req.body.userId !== req.user.id) return res.status(403).json({ error: 'You may only accept your own invite' });
  const row = await write(res, async client => {
    const scope = await resolveInvitationCase(client, String(getCaseId(req)), req.user.id);
    if (!scope) throw fail(403, 'Current invitation in your practice required');
    await client.query('SELECT id FROM cases WHERE id=$1 FOR SHARE', [scope.id]);
    if (!await resolveInvitationCase(client, String(scope.id), req.user.id)) throw fail(403, 'Current invitation required');
    const verified = await findVerifiedTarget(client, scope, { userId: req.user.id, role: 'divorcee' });
    if (!verified) throw fail(403, 'Verified identity required');
    const result = await client.query(`UPDATE case_participants SET status='active',updated_at=NOW()
      WHERE case_id=$1 AND user_id=$2 AND role='divorcee' AND status IN ('invited','active') RETURNING *`, [scope.id,req.user.id]);
    if (!result.rows[0]) throw fail(403, 'Current invitation required');
    return result.rows[0];
  });
  if (res.headersSent) return;
  const assigned = await pool.query("SELECT to_jsonb(c)->>'mediator_id' AS mediator_id FROM cases c WHERE id=$1", [row.case_id]);
  if (assigned.rows[0]?.mediator_id) await notify(assigned.rows[0].mediator_id, 'A participant accepted a current mediation case invitation.');
  res.json(row);
});

router.patch('/:userId', async (req, res) => {
  const { role, status } = req.body || {};
  if ((!role && !status) || (role !== undefined && !MEMBERSHIP_ROLES.has(role)) ||
      (status !== undefined && !MEMBERSHIP_STATUSES.has(status))) return res.status(400).json({ error: 'Invalid membership update' });
  const row = await write(res, async client => {
    const scope = await requireMediatorCase(client, getCaseId(req), req.user.id);
    const target = await client.query('SELECT * FROM case_participants WHERE case_id=$1 AND user_id=$2 FOR UPDATE', [scope.id,req.params.userId]);
    if (!target.rows[0]) throw fail(404, 'Participant not found');
    if (req.params.userId === req.user.id && ((role && role !== 'mediator') || (status && status !== 'active')))
      throw fail(409, 'Use the case assignment workflow to remove the assigned mediator');
    if ((status || target.rows[0].status) === 'active' || role) {
      if (!await findVerifiedTarget(client, scope, { userId:req.params.userId, role:role || target.rows[0].role }))
        throw fail(403, 'Verified user in this practice with the requested role required');
    }
    const result = await client.query(`UPDATE case_participants SET role=COALESCE($1,role),status=COALESCE($2,status),updated_at=NOW()
      WHERE case_id=$3 AND user_id=$4 RETURNING *`, [role,status,scope.id,req.params.userId]);
    return result.rows[0];
  });
  if (res.headersSent) return;
  await notify(row.user_id, 'Your mediation case membership has been reviewed.');
  res.json(row);
});

router.delete('/:userId', async (req, res) => {
  await write(res, async client => {
    const scope = await requireMediatorCase(client, getCaseId(req), req.user.id);
    if (req.params.userId === req.user.id) throw fail(409, 'Use the case assignment workflow to remove the assigned mediator');
    const result = await client.query(`UPDATE case_participants SET status='removed',updated_at=NOW()
      WHERE case_id=$1 AND user_id=$2 RETURNING user_id`, [scope.id,req.params.userId]);
    if (!result.rows[0]) throw fail(404, 'Participant not found');
  });
  if (res.headersSent) return;
  await notify(req.params.userId, 'Your mediation case membership has been removed.');
  res.json({ success: true });
});
export default router;
