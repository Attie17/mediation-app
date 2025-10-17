import express from 'express';
import crypto from 'crypto';
import { Pool } from 'pg';
import { supabase, requireSupabaseOr500 } from '../lib/supabaseClient.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required for participants routes');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('supabase')
    ? { rejectUnauthorized: false }
    : undefined,
});

const router = express.Router();
router.use((req,res,next)=>{ if(!supabase) return requireSupabaseOr500(res); next(); });

router.use(authenticateUser);


const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const isUuid = (value) => typeof value === 'string' && uuidPattern.test(value);

function validateUUID(req, res, next) {
  const { case_id, participant_id } = req.body;
  if (case_id && !isUuid(case_id)) return res.status(400).json({ error: "Invalid case_id" });
  if (participant_id && !isUuid(participant_id)) return res.status(400).json({ error: "Invalid participant_id" });
  next();
}

const isActiveStatus = (status) => {
  if (status === null || status === undefined) return true;
  return status === 'active';
};

const mapParticipantRow = (row) => ({
  id: row.id,
  case_id: row.case_id,
  user_id: row.user_id,
  role: row.role,
  status: row.status ?? 'active',
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

async function fetchCaseRecord(client, caseId) {
  try {
    const result = await client.query(
      `SELECT id, mediator_id FROM cases WHERE id = $1 LIMIT 1`,
      [caseId]
    );
    return result.rows[0] || null;
  } catch (error) {
    if (error.code === '42703') {
      const fallback = await client.query(
        `SELECT id FROM cases WHERE id = $1 LIMIT 1`,
        [caseId]
      );
      return fallback.rows[0] ? { ...fallback.rows[0], mediator_id: null } : null;
    }
    throw error;
  }
}

async function fetchMembership(client, caseId, userId) {
  try {
    const result = await client.query(
      `SELECT id, role, status FROM case_participants WHERE case_id = $1 AND user_id = $2 LIMIT 1`,
      [caseId, userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    if (error.code === '42703') {
      const fallback = await client.query(
        `SELECT id, role FROM case_participants WHERE case_id = $1 AND user_id = $2 LIMIT 1`,
        [caseId, userId]
      );
      return fallback.rows[0] ? { ...fallback.rows[0], status: 'active' } : null;
    }
    throw error;
  }
}

async function requireCaseExists(client, caseId) {
  const caseRecord = await fetchCaseRecord(client, caseId);
  if (!caseRecord) {
    const error = new Error('Case not found');
    error.status = 404;
    throw error;
  }
  return caseRecord;
}

async function requireMediatorAccess(client, caseId, user) {
  const caseRecord = await requireCaseExists(client, caseId);
  if (caseRecord.mediator_id && caseRecord.mediator_id === user.id) {
    return caseRecord;
  }

  const membership = await fetchMembership(client, caseId, user.id);
  if (membership && membership.role === 'mediator' && isActiveStatus(membership.status)) {
    return caseRecord;
  }

  const error = new Error('Mediator access required for this action');
  error.status = 403;
  throw error;
}

async function requireViewerAccess(client, caseId, user) {
  const caseRecord = await requireCaseExists(client, caseId);

  if (caseRecord.mediator_id && caseRecord.mediator_id === user.id) {
    return caseRecord;
  }

  const membership = await fetchMembership(client, caseId, user.id);
  if (membership && isActiveStatus(membership.status)) {
    return caseRecord;
  }

  const error = new Error('You do not have access to this case');
  error.status = 403;
  throw error;
}

async function ensureAppUser(client, userId, role, email, name) {
  try {
    await client.query(
      `INSERT INTO app_users (id, role, email, name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role,
                                      email = COALESCE(EXCLUDED.email, app_users.email),
                                      name = COALESCE(EXCLUDED.name, app_users.name)`,
      [userId, role, email, name]
    );
  } catch (error) {
    if (error.code === '42703') {
      await client.query(
        `INSERT INTO app_users (id, role)
         VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role`,
        [userId, role]
      );
    } else {
      throw error;
    }
  }
}

async function loadOrCreateUser(client, email, name, defaultRole = 'divorcee') {
  const normalizedEmail = email.trim().toLowerCase();
  const desiredName = name || normalizedEmail.split('@')[0];
  const assignedRole = defaultRole || 'divorcee';

  let existing;
  try {
    existing = await client.query(
      `SELECT id, email, raw_user_meta_data->>'name' AS name
       FROM auth.users
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [normalizedEmail]
    );
  } catch (error) {
    if (error.code === '42703') {
      existing = await client.query(
        `SELECT id, email FROM auth.users
         WHERE LOWER(email) = $1
         LIMIT 1`,
        [normalizedEmail]
      );
    } else {
      throw error;
    }
  }

  if (existing.rows[0]) {
    return {
      id: existing.rows[0].id,
      email: existing.rows[0].email,
      name: existing.rows[0].name || desiredName,
    };
  }

  const newUserId = crypto.randomUUID();
  try {
    await client.query(
      `INSERT INTO auth.users (
         id, email, raw_app_meta_data, raw_user_meta_data,
         aud, role, encrypted_password, email_confirmed_at, created_at, updated_at,
         is_super_admin, is_sso_user, is_anonymous
       )
       VALUES (
         $1, $2, $3::jsonb, $4::jsonb,
         'authenticated', 'authenticated', '', NOW(), NOW(), NOW(),
         false, false, false
       )`,
      [newUserId, normalizedEmail, JSON.stringify({ role: assignedRole }), JSON.stringify({ name: desiredName })]
    );
  } catch (error) {
    if (error.code === '42703') {
      await client.query(
        `INSERT INTO auth.users (
           id, email, aud, role, raw_app_meta_data, raw_user_meta_data,
           is_super_admin, is_sso_user, is_anonymous, created_at, updated_at
         )
         VALUES (
           $1, $2, 'authenticated', 'authenticated', $3::jsonb, $4::jsonb,
           false, false, false, NOW(), NOW()
         )`,
        [newUserId, normalizedEmail, JSON.stringify({ role: assignedRole }), JSON.stringify({ name: desiredName })]
      );
    } else {
      throw error;
    }
  }

  return {
    id: newUserId,
    email: normalizedEmail,
    name: desiredName,
  };
}

async function listParticipants(client, caseId) {
  try {
    const result = await client.query(
      `SELECT cp.id,
              cp.case_id,
              cp.user_id,
              cp.role,
              cp.status,
              cp.created_at,
              cp.updated_at,
              au.email,
              au.name
       FROM case_participants cp
       LEFT JOIN app_users au ON au.id = cp.user_id
       WHERE cp.case_id = $1
       ORDER BY cp.created_at ASC`,
      [caseId]
    );
    return result.rows.map(mapParticipantRow);
  } catch (error) {
    if (error.code === '42703') {
      const fallback = await client.query(
        `SELECT cp.id,
                cp.case_id,
                cp.user_id,
                cp.role,
                cp.created_at,
                cp.updated_at,
                au.email,
                au.name
         FROM case_participants cp
         LEFT JOIN app_users au ON au.id = cp.user_id
         WHERE cp.case_id = $1
         ORDER BY cp.created_at ASC`,
        [caseId]
      );
      return fallback.rows.map((row) => mapParticipantRow({ ...row, status: row.status ?? 'active' }));
    }
    throw error;
  }
}

async function loadParticipant(client, caseId, participantId) {
  if (!participantId) return null;

  const identifier = participantId.toString();
  try {
    const result = await client.query(
      `SELECT cp.id,
              cp.case_id,
              cp.user_id,
              cp.role,
              cp.status,
              cp.created_at,
              cp.updated_at,
              au.email,
              au.name
       FROM case_participants cp
       LEFT JOIN app_users au ON au.id = cp.user_id
       WHERE cp.case_id = $1
         AND (cp.id::text = $2 OR cp.user_id::text = $2)
       LIMIT 1`,
      [caseId, identifier]
    );
    if (result.rows[0]) {
      return mapParticipantRow(result.rows[0]);
    }
  } catch (error) {
    if (error.code !== '42703') {
      throw error;
    }
  }

  const fallback = await client.query(
    `SELECT cp.id,
            cp.case_id,
            cp.user_id,
            cp.role,
            cp.status,
            cp.created_at,
            cp.updated_at,
            au.email,
            au.name
     FROM case_participants cp
     LEFT JOIN app_users au ON au.id = cp.user_id
     WHERE cp.case_id = $1
       AND cp.id::text = $2
     LIMIT 1`,
    [caseId, identifier]
  );

  return fallback.rows[0] ? mapParticipantRow(fallback.rows[0]) : null;
}

router.get('/:caseId/participants', async (req, res) => {
  const caseId = parseCaseId(req.params.caseId);
  if (!caseId) {
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
  if (!caseId) {
    return res.status(400).json({ error: 'Invalid case ID' });
  }

  const { email, name, role = 'divorcee' } = req.body || {};
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email is required' });
  }

  if (!['divorcee', 'mediator'].includes(role)) {
    return res.status(400).json({ error: 'role must be "divorcee" or "mediator"' });
  }

  return withClient(async (client) => {
    try {
      await requireMediatorAccess(client, caseId, req.user);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }

    try {
  const user = await loadOrCreateUser(client, email, name, role);
      await ensureAppUser(client, user.id, role, user.email, user.name);

      let participantRow;
      try {
        const insert = await client.query(
          `INSERT INTO case_participants (case_id, user_id, role, status)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (case_id, user_id) DO UPDATE SET role = EXCLUDED.role
           RETURNING id, case_id, user_id, role, status, created_at, updated_at`,
          [caseId, user.id, role, 'invited']
        );
        participantRow = insert.rows[0];
      } catch (error) {
        if (error.code === '42703') {
          const insert = await client.query(
            `INSERT INTO case_participants (case_id, user_id, role)
             VALUES ($1, $2, $3)
             ON CONFLICT (case_id, user_id) DO NOTHING
             RETURNING id, case_id, user_id, role, created_at, updated_at`,
            [caseId, user.id, role]
          );
          if (insert.rows.length === 0) {
            return res.status(409).json({ error: 'User is already a participant in this case.' });
          }
          participantRow = { ...insert.rows[0], status: 'invited' };
        } else if (error.code === '23505') {
          return res.status(409).json({ error: 'User is already a participant in this case.' });
        } else {
          throw error;
        }
      }

      const participant = mapParticipantRow({ ...participantRow, email: user.email, name: user.name });

      await broadcastCaseUpdate(caseId, 'participant_added', {
        participant_id: participant.id,
        user_id: participant.user_id,
        role: participant.role,
      });

      return res.json({ success: true, participant });
    } catch (error) {
      console.error('[participants] Failed to invite participant:', error);
      return res.status(500).json({ error: 'Failed to invite participant' });
    }
  }, res);
});

router.patch('/:caseId/participants/:participantId/activate', async (req, res) => {
  const caseId = parseCaseId(req.params.caseId);
  if (!caseId) {
    return res.status(400).json({ error: 'Invalid case ID' });
  }
  const { participantId } = req.params;

  return withClient(async (client) => {
    try {
      await requireMediatorAccess(client, caseId, req.user);
    } catch (error) {
      const status = error.status || 500;
      return res.status(status).json({ error: error.message });
    }

    let participant;
    try {
      const update = await client.query(
        `UPDATE case_participants
         SET status = 'active', updated_at = NOW()
         WHERE case_id = $1 AND id = $2
         RETURNING id, case_id, user_id, role, status, created_at, updated_at`,
        [caseId, participantId]
      );
      participant = update.rows[0];
    } catch (error) {
      if (error.code === '42703') {
        const update = await client.query(
          `UPDATE case_participants
           SET updated_at = NOW()
           WHERE case_id = $1 AND id = $2
           RETURNING id, case_id, user_id, role, created_at, updated_at`,
          [caseId, participantId]
        );
        participant = update.rows[0]
          ? { ...update.rows[0], status: 'active' }
          : null;
      } else {
        throw error;
      }
    }

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found for this case' });
    }

    const enriched = await loadParticipant(client, caseId, participantId);

    await broadcastCaseUpdate(caseId, 'participant_activated', {
      participant_id: participant.id,
      user_id: participant.user_id,
    });

    return res.json({ success: true, participant: enriched || mapParticipantRow(participant) });
  }, res);
});




// Soft delete participant (status = 'removed')
router.post('/participants/remove', validateUUID, async (req, res) => {
  const { participant_id, case_id, role } = req.body;
  return withClient(async (client) => {
    // If removing a mediator, check for other active mediators
    if (role === "mediator") {
      const { rows } = await client.query(
        "SELECT COUNT(*) FROM case_participants WHERE case_id = $1::uuid AND role = 'mediator' AND status = 'active'",
        [case_id]
      );
      if (parseInt(rows[0].count) <= 1) {
        return res.status(400).json({ error: "Cannot remove the last active mediator from this case." });
      }
    }
    await client.query(
      "UPDATE case_participants SET status = 'removed', updated_at = NOW() WHERE id = $1::uuid",
      [participant_id]
    );
    res.json({ success: true });
  }, res);
});

// Admin-only hard delete
router.delete('/admin/participants/:id', validateUUID, async (req, res) => {
  return withClient(async (client) => {
    await client.query("DELETE FROM case_participants WHERE id = $1::uuid", [req.params.id]);
    res.json({ success: true });
  }, res);
});

export default router;