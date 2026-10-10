import express from 'express';
import { pool } from '../db.js';
import { withTransaction } from '../utils/tx.js';
import { resolveAuthorizedCase } from '../security/pilotAccess.js';
import { requireMediatorCase, findVerifiedTarget } from '../security/membership.js';
import { supabase, requireSupabaseOr500 } from '../lib/supabaseClient.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();
router.use((req,res,next)=>{ if(!supabase) return requireSupabaseOr500(res); next(); });

router.use(authenticateUser);


const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const isUuid = (value) => typeof value === 'string' && uuidPattern.test(value);

const parseCaseId = (value) => {
  return isUuid(value) ? value : null;
};

function validateUUID(req, res, next) {
  const { case_id, participant_id } = req.body;
  if (case_id && !isUuid(case_id)) return res.status(400).json({ error: "Invalid case_id" });
  if (participant_id && !isUuid(participant_id)) return res.status(400).json({ error: "Invalid participant_id" });
  next();
}

const mapParticipantRow = (row) => ({
  id: row.id,
  case_id: row.case_id,
  user_id: row.user_id,
  role: row.role,
  status: row.status ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at ?? row.created_at,
  email: row.email ?? null,
  name: row.name ?? null,
});

async function broadcastCaseUpdate(caseId, eventType, payloadOverrides = {}) {
  try {
    const payload = {
      case_id: caseId,
      event_type: eventType,
      timestamp: new Date().toISOString(),
      ...payloadOverrides,
    };

    const channel = supabase.channel(`case-${caseId}-updates`);
    await channel.send({
      type: 'broadcast',
      event: 'case_update',
      payload,
    });
  } catch (error) {
    console.error('[participants] Failed to broadcast case update', error);
  }
}

async function withClient(callback, res) {
  const client = await pool.connect();
  try {
    return await callback(client);
  } catch (error) {
    if (error.code === '42P01') {
      console.warn('[participants] Missing table when handling request:', error.message);
      return res.status(503).json({ error: 'Participants data is unavailable.' });
    }
    if (error.code === '42703') {
      console.warn('[participants] Missing column when handling request:', error.message);
      return res.status(503).json({ error: 'Participants data is unavailable.' });
    }
    console.error('[participants] Unexpected database error:', error);
    return res.status(500).json({ error: 'Unexpected error loading participants.' });
  } finally {
    client.release();
  }
}

async function requireViewerAccess(client, caseId, user) {
  if (!await resolveAuthorizedCase(client, caseId, user?.id)) {
    const error = new Error('You do not have access to this case');
    error.status = 403;
    throw error;
  }
}

async function runWrite(res, callback) {
  try { return await withTransaction(pool, callback); }
  catch (error) {
    return res.status(error.status || (['42703', '42P01'].includes(error.code) ? 503 : 500))
      .json({ error: error.status ? error.message : 'Membership operation unavailable' });
  }
}

async function listParticipants(client, caseId) {
  const result = await client.query(`SELECT cp.id,cp.case_id,cp.user_id,cp.role,
    to_jsonb(cp)->>'status' AS status,cp.created_at,cp.updated_at,u.email,u.name
    FROM case_participants cp JOIN cases c ON c.id=cp.case_id
    JOIN app_users u ON COALESCE(to_jsonb(u)->>'user_id',to_jsonb(u)->>'id')=cp.user_id::text
    WHERE cp.case_id=$1 AND to_jsonb(u)->>'organization_id'=to_jsonb(c)->>'organization_id'
    ORDER BY cp.created_at ASC`, [caseId]);
  return result.rows.map(mapParticipantRow);
}

router.get('/:caseId/participants', async (req, res) => {
  console.log('🔍 [participants] GET /:caseId/participants', { 
    rawCaseId: req.params.caseId,
    isUuidResult: isUuid(req.params.caseId)
  });
  const caseId = parseCaseId(req.params.caseId);
  console.log('🔍 [participants] parseCaseId result:', caseId);
  if (!caseId) {
    console.log('❌ [participants] Invalid case ID');
    return res.status(400).json({ error: 'Invalid case ID' });
  }

  return withClient(async (client) => {
    try {
      await requireViewerAccess(client, caseId, req.user);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }

    const participants = await listParticipants(client, caseId);
    return res.json({ success: true, participants });
  }, res);
});

router.post('/:caseId/participants', async (req, res) => {
  const caseId = parseCaseId(req.params.caseId);
  const { email, role = 'divorcee' } = req.body || {};
  if (!caseId || typeof email !== 'string' || !['divorcee', 'mediator'].includes(role))
    return res.status(400).json({ error: 'Valid case, email and membership role required' });
  const result = await runWrite(res, async client => {
    const scope = await requireMediatorCase(client, caseId, req.user?.id);
    const target = await findVerifiedTarget(client, scope, { email, role });
    if (!target) { const error = new Error('Verified user in this practice required'); error.status = 404; throw error; }
    const insert = await client.query(
      `INSERT INTO case_participants (case_id,user_id,role,status) VALUES($1,$2,$3,'invited')
       ON CONFLICT(case_id,user_id) DO NOTHING RETURNING *`, [scope.id, target.user_id, role]);
    if (!insert.rows.length) { const error = new Error('Participant already exists; review their membership explicitly'); error.status = 409; throw error; }
    return mapParticipantRow({ ...insert.rows[0], email: target.email, name: target.name });
  });
  if (res.headersSent) return;
  await broadcastCaseUpdate(caseId, 'participant_added', { participant_id: result.id, user_id: result.user_id, role: result.role });
  return res.json({ success: true, participant: result });
});

router.patch('/:caseId/participants/:participantId/activate', async (req, res) => {
  const caseId = parseCaseId(req.params.caseId);
  if (!caseId || !isUuid(req.params.participantId)) return res.status(400).json({ error: 'Invalid identifier' });
  const result = await runWrite(res, async client => {
    const scope = await requireMediatorCase(client, caseId, req.user?.id);
    const target = await client.query('SELECT * FROM case_participants WHERE case_id=$1 AND id=$2 FOR UPDATE', [scope.id, req.params.participantId]);
    if (!target.rows[0]) { const error = new Error('Participant not found'); error.status = 404; throw error; }
    const verified = await findVerifiedTarget(client, scope, { userId: target.rows[0].user_id, role: target.rows[0].role });
    if (!verified) { const error = new Error('Verified user in this practice required'); error.status = 403; throw error; }
    const update = await client.query("UPDATE case_participants SET status='active',updated_at=NOW() WHERE case_id=$1 AND id=$2 RETURNING *", [scope.id, req.params.participantId]);
    return mapParticipantRow({ ...update.rows[0], email: verified.email, name: verified.name });
  });
  if (res.headersSent) return;
  await broadcastCaseUpdate(caseId, 'participant_activated', { participant_id: result.id, user_id: result.user_id });
  return res.json({ success: true, participant: result });
});

router.post('/participants/remove', validateUUID, async (req, res) => {
  const { participant_id, case_id } = req.body || {};
  if (!isUuid(participant_id) || !isUuid(case_id)) return res.status(400).json({ error: 'Valid case and participant required' });
  await runWrite(res, async client => {
    const scope = await requireMediatorCase(client, case_id, req.user?.id);
    const target = await client.query('SELECT user_id,role FROM case_participants WHERE case_id=$1 AND id=$2 FOR UPDATE', [scope.id, participant_id]);
    if (!target.rows[0]) { const error = new Error('Participant not found'); error.status = 404; throw error; }
    if (String(target.rows[0].user_id) === String(req.user.id)) { const error = new Error('Use the case assignment workflow to remove the assigned mediator'); error.status = 409; throw error; }
    await client.query("UPDATE case_participants SET status='removed',updated_at=NOW() WHERE case_id=$1 AND id=$2", [scope.id, participant_id]);
  });
  if (!res.headersSent) res.json({ success: true });
});

// Preserve membership evidence; use the scoped soft-removal endpoint.
router.delete('/admin/participants/:id', (_req, res) => res.status(405).json({ error: 'Use scoped membership removal' }));

export default router;
