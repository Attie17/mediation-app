const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: false });
dotenv.config({ path: path.resolve(__dirname, '..', 'backend', '.env'), override: true });

typeCheckEnv(['DATABASE_URL']);

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

const TEST_JWT = process.env.TEST_JWT;
if (!TEST_JWT) {
  throw new Error("Missing TEST_JWT in .env – run setup-mediator.ps1 first");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

const TEST_CASE_ID = Number(9102);

const MEDIATOR = {
  id: '91029102-0000-4000-8000-000000000001',
  email: 'participants.mediator@example.com',
  name: 'Participants Test Mediator',
  role: 'mediator',
};

const INVITED_PARTICIPANT = {
  email: `invited+${Date.now()}@example.com`,
  name: 'Participants Test Divorcee',
  role: 'divorcee',
};

function typeCheckEnv(requiredKeys) {
  const missing = requiredKeys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}

const log = {
  info: (message) => console.log(`ℹ️  ${message}`),
  success: (message) => console.log(`✅ ${message}`),
  error: (message, error) => {
    console.error(`❌ ${message}`);
    if (error) {
      console.error(`   ${error.message || error}`);
      if (error.stack) console.error(error.stack);
    }
  },
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function extractParticipants(body) {
  if (Array.isArray(body)) {
    return body;
  }
  if (Array.isArray(body?.participants)) {
    return body.participants;
  }
  if (Array.isArray(body?.data?.participants)) {
    return body.data.participants;
  }
  return null;
}

function extractParticipant(body) {
  if (!body || typeof body !== 'object') {
    return null;
  }
  if (body.participant) {
    return body.participant;
  }
  if (body.data?.participant) {
    return body.data.participant;
  }
  const candidate = body.data ?? body;
  if (candidate && typeof candidate === 'object' && 'id' in candidate && 'case_id' in candidate) {
    return candidate;
  }
  return null;
}

async function ensureApiAvailable() {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      if (response.ok) {
        log.success('API server reachable');
        return;
      }
    } catch (error) {
      log.info(`Attempt ${attempt}/5 to reach API failed. Retrying...`);
    }
    await wait(500 * attempt);
  }
  throw new Error(`Unable to reach API at ${API_BASE_URL}. Ensure the backend server is running.`);
}

async function ensureAuthUser(user) {
  try {
    const existing = await pool.query('SELECT id FROM auth.users WHERE id = $1 LIMIT 1', [user.id]);
    if (existing.rowCount > 0) {
      await pool.query(
        `UPDATE auth.users
           SET email = $2,
               raw_app_meta_data = $3::jsonb,
               raw_user_meta_data = $4::jsonb,
               updated_at = NOW(),
               is_anonymous = false,
               is_sso_user = false
         WHERE id = $1`,
        [user.id, user.email, JSON.stringify({ role: user.role }), JSON.stringify({ name: user.name })]
      );
      return;
    }

    await pool.query('DELETE FROM app_users WHERE id = $1', [user.id]);

    await pool.query(
      `INSERT INTO auth.users (
         id,
         email,
         aud,
         role,
         raw_app_meta_data,
         raw_user_meta_data,
         is_super_admin,
         is_anonymous,
         is_sso_user,
         created_at,
         updated_at
       )
       VALUES (
         $1,
         $2,
         'authenticated',
         'authenticated',
         $3::jsonb,
         $4::jsonb,
         false,
         false,
         false,
         NOW(),
         NOW()
       )`,
      [user.id, user.email, JSON.stringify({ role: user.role }), JSON.stringify({ name: user.name })]
    );
  } catch (error) {
    log.error(`Failed to ensure auth.users record for ${user.id}`, error);
    throw error;
  }
}

async function ensureAppUser(user) {
  try {
    await pool.query(
      `INSERT INTO app_users (id, role, email, name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, email = EXCLUDED.email, name = EXCLUDED.name`,
      [user.id, user.role, user.email, user.name]
    );
  } catch (error) {
    log.error(`Failed to ensure app_users record for ${user.id}`, error);
    throw error;
  }
}

async function ensureCase(caseId, mediatorId) {
  try {
    await pool.query(
      `INSERT INTO cases (id, status, mediator_id, created_at, description)
       VALUES ($1, 'open', $2, NOW(), $3)
       ON CONFLICT (id) DO UPDATE SET mediator_id = EXCLUDED.mediator_id, status = EXCLUDED.status, description = EXCLUDED.description`,
      [caseId, mediatorId, 'Participants smoke test case']
    );
  } catch (error) {
    if (error.code === '42703' || error.code === '22P02') {
      await pool.query(
        `INSERT INTO cases (id, status, created_at, description)
         VALUES ($1, 'open', NOW(), $2)
         ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, description = EXCLUDED.description`,
        [caseId, 'Participants smoke test case']
      );
    } else {
      throw error;
    }
  }
}

async function ensureCaseParticipant(caseId, user, role) {
  try {
    const { rows } = await pool.query(
      `INSERT INTO case_participants (case_id, user_id, role, status, created_at)
       VALUES ($1, $2, $3, 'active', NOW())
       ON CONFLICT (case_id, user_id) DO NOTHING
       RETURNING id`,
      [caseId, user.id, role]
    );
    if (rows.length > 0) {
      return { id: rows[0].id, seeded: true };
    }
    const reuse = await pool.query(
      'SELECT id FROM case_participants WHERE case_id = $1 AND user_id = $2 LIMIT 1',
      [caseId, user.id]
    );
    return { id: reuse.rows[0]?.id || null, seeded: false };
  } catch (error) {
    if (error.code === '42703') {
      const insert = await pool.query(
        `INSERT INTO case_participants (case_id, user_id, role, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (case_id, user_id) DO NOTHING
         RETURNING id`,
        [caseId, user.id, role]
      );
      if (insert.rows.length > 0) {
        return { id: insert.rows[0].id, seeded: true };
      }
      const reuse = await pool.query(
        'SELECT id FROM case_participants WHERE case_id = $1 AND user_id = $2 LIMIT 1',
        [caseId, user.id]
      );
      return { id: reuse.rows[0]?.id || null, seeded: false };
    }
    throw error;
  }
}

function getJwtOrExit() {
  if (!TEST_JWT) {
    log.error('TEST_JWT not set, run setup-mediator.ps1');
    process.exit(1);
  }
  return TEST_JWT;
}

async function fetchJson(url, options = {}, label = 'request') {
  const response = await fetch(url, options);
  let body = null;
  try {
    body = await response.json();
  } catch (error) {
    log.error(`Failed to parse JSON from ${label}`, error);
  }
  if (!response.ok) {
    const errorMessage = body?.error || JSON.stringify(body);
    throw new Error(`${label} failed (${response.status}): ${errorMessage}`);
  }
  return body;
}

(async () => {
  let mediatorParticipantId = null;
  let mediatorParticipantSeeded = false;
  let createdParticipantId = null;
  let createdUserId = null;

  try {
    log.info('Checking API availability');
    await ensureApiAvailable();

    await ensureAuthUser(MEDIATOR);
    await ensureAppUser(MEDIATOR);
    await ensureCase(TEST_CASE_ID, MEDIATOR.id);

    const mediatorParticipant = await ensureCaseParticipant(TEST_CASE_ID, MEDIATOR, 'mediator');
    mediatorParticipantId = mediatorParticipant.id;
    mediatorParticipantSeeded = mediatorParticipant.seeded;
  } catch (initialError) {
    log.error('Participants setup failed', initialError);
    process.exitCode = 1;
    await pool.end().catch((err) => log.error('Failed to close database pool', err));
    process.exit(process.exitCode || 0);
    return;
  }

  const mediatorToken = getJwtOrExit();

  try {
  log.info(`Fetching existing participants (caseId=${TEST_CASE_ID}, type=${typeof TEST_CASE_ID})`);
    const initialResponse = await fetchJson(
      `${API_BASE_URL}/api/cases/${TEST_CASE_ID}/participants`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mediatorToken}`,
          'Content-Type': 'application/json',
        },
      },
      'list participants before invite'
    );

    const initialParticipants = extractParticipants(initialResponse);
    if (!Array.isArray(initialParticipants)) {
      throw new Error('Participants response missing participants array');
    }

  log.info(`Inviting new participant via API (caseId=${TEST_CASE_ID}, type=${typeof TEST_CASE_ID})`);
    const inviteResponse = await fetchJson(
      `${API_BASE_URL}/api/cases/${TEST_CASE_ID}/participants`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mediatorToken}`,
        },
        body: JSON.stringify({
          email: INVITED_PARTICIPANT.email,
          name: INVITED_PARTICIPANT.name,
          role: INVITED_PARTICIPANT.role,
        }),
      },
      'invite participant'
    );

    const invitedParticipant = extractParticipant(inviteResponse);
    if (!invitedParticipant?.id) {
      throw new Error('Invite response missing participant');
    }
    createdParticipantId = invitedParticipant.id;
    createdUserId = invitedParticipant.user_id;

    if (invitedParticipant.status !== 'invited') {
      throw new Error(`Expected invited status, received ${invitedParticipant.status}`);
    }

    log.success('Participant invited');

  log.info(`Fetching participants after invite (caseId=${TEST_CASE_ID}, type=${typeof TEST_CASE_ID})`);
    const postInviteResponse = await fetchJson(
      `${API_BASE_URL}/api/cases/${TEST_CASE_ID}/participants`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mediatorToken}`,
        },
      },
      'list participants after invite'
    );

    const postInviteParticipants = extractParticipants(postInviteResponse) || [];
    const invitedEntry = postInviteParticipants.find((p) => p.id === createdParticipantId);
    if (!invitedEntry) {
      throw new Error('Invited participant missing from listing response');
    }

    if (invitedEntry.status !== 'invited') {
      throw new Error('Invited participant status mismatch after listing');
    }

    log.success('Participant appears in list with invited status');

  log.info(`Activating participant via API (caseId=${TEST_CASE_ID}, type=${typeof TEST_CASE_ID})`);
    const activateResponse = await fetchJson(
      `${API_BASE_URL}/api/cases/${TEST_CASE_ID}/participants/${createdParticipantId}/activate`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${mediatorToken}`,
        },
      },
      'activate participant'
    );

    const activatedParticipant = extractParticipant(activateResponse);
    if (activatedParticipant?.status !== 'active') {
      throw new Error('Participant not marked active after activation');
    }

    log.success('Participant activated');

    // Fetch participants after activation
  log.info(`[participants:test] participants after activation (caseId=${TEST_CASE_ID}, type=${typeof TEST_CASE_ID}):`);
    const afterActivationResponse = await fetchJson(
      `${API_BASE_URL}/api/cases/${TEST_CASE_ID}/participants`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mediatorToken}`,
          'Content-Type': 'application/json',
        },
      },
      'list participants after activation'
    );
    const afterActivationParticipants = extractParticipants(afterActivationResponse) || [];
    afterActivationParticipants.forEach((p) => {
      log.info(` - id: ${p.id}, user_id: ${p.user_id}, status: ${p.status}, role: ${p.role}`);
    });

    // Select the active divorcee for deletion
    const deleteTarget = afterActivationParticipants.find(
      (p) => p.status === 'active' && p.role === 'divorcee'
    );
    if (!deleteTarget) {
      log.error('❌ No active divorcee found for deletion');
      throw new Error('No active divorcee found for deletion');
    }
    const deleteId = deleteTarget.id;
  log.info(`[participants:test] attempting to delete participantId=${deleteId} (caseId=${TEST_CASE_ID}, type=${typeof TEST_CASE_ID})`);

    // Remove the participant using the correct id
    const deleteRes = await fetch(
      `${API_BASE_URL}/api/cases/${TEST_CASE_ID}/participants/${deleteId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${mediatorToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const deleteBody = await deleteRes.text();
    log.info(`[participants:test] delete status=${deleteRes.status}`);
    if (deleteBody) log.info(`[participants:test] delete body: ${deleteBody}`);
    if (deleteRes.status !== 200) {
      throw new Error(`remove participant failed (${deleteRes.status}): ${deleteBody}`);
    }
    log.success('Participant removed');

  log.info(`Verifying participant removal in listing (caseId=${TEST_CASE_ID}, type=${typeof TEST_CASE_ID})`);
    const postRemovalResponse = await fetchJson(
      `${API_BASE_URL}/api/cases/${TEST_CASE_ID}/participants`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mediatorToken}`,
          'Content-Type': 'application/json',
        },
      },
      'list participants after removal'
    );

    const postRemovalParticipants = extractParticipants(postRemovalResponse) || [];
    const removedEntry = postRemovalParticipants.find((p) => p.id === createdParticipantId);
    if (removedEntry) {
      throw new Error('Participant still present after removal');
    }

    log.success('Participant lifecycle completed');
    console.log('✅ Case participants lifecycle succeeded');
  } catch (testError) {
    log.error('Participants lifecycle test failed', testError);
    process.exitCode = 1;
  } finally {
    try {
      if (createdParticipantId) {
        await pool.query('DELETE FROM case_participants WHERE id = $1', [createdParticipantId]);
      }
      if (createdUserId) {
        try {
          await pool.query(
            "DELETE FROM notifications WHERE metadata->>'participant_id' = $1",
            [createdParticipantId]
          );
        } catch (notificationCleanupError) {
          if (!['42703', '42P01'].includes(notificationCleanupError.code)) {
            throw notificationCleanupError;
          }
        }

        await pool.query('DELETE FROM app_users WHERE id = $1', [createdUserId]);
        await pool.query('DELETE FROM auth.users WHERE id = $1', [createdUserId]);
      }
      if (mediatorParticipantSeeded && mediatorParticipantId) {
        try {
          await pool.query('DELETE FROM case_participants WHERE id = $1', [mediatorParticipantId]);
        } catch (mediatorCleanupError) {
          log.info('Skipping mediator cleanup; constraint enforced by database');
          log.error('Mediator participant cleanup failed', mediatorCleanupError);
        }
      }
    } catch (cleanupError) {
      log.error('Cleanup failed for participants lifecycle test', cleanupError);
    } finally {
      await pool.end().catch((err) => log.error('Failed to close database pool', err));
      process.exit(process.exitCode || 0);
    }
  }
})();
