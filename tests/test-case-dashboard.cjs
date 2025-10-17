const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: false });
dotenv.config({ path: path.resolve(__dirname, '..', 'backend', '.env'), override: true });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;
const TEST_JWT = process.env.TEST_JWT;
if (!TEST_JWT) {
  throw new Error("Missing TEST_JWT in .env – run setup-mediator.ps1 first");
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL must be set for dashboard tests');
  process.exit(1);
}

if (!SUPABASE_JWT_SECRET && !TEST_JWT) {
  console.error('❌ Provide SUPABASE_JWT_SECRET or TEST_JWT for dashboard tests');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

const TEST_CASE_ID = 9001;
const TEST_MEDIATOR = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'dashboard.mediator@example.com',
  name: 'Dashboard Test Mediator',
  role: 'mediator',
};
const TEST_DIVORCEE = {
  id: '33333333-3333-4333-8333-333333333333',
  email: 'dashboard.divorcee@example.com',
  name: 'Dashboard Test Divorcee',
  role: 'divorcee',
};

const log = {
  info: (message) => console.log(`ℹ️  ${message}`),
  success: (message) => console.log(`✅ ${message}`),
  error: (message, error) => {
    console.error(`❌ ${message}`);
    if (error) {
      console.error(`   ${error.message || error}`);
      if (error.stack) {
        console.error(error.stack);
      }
    }
  },
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const { rowCount } = await pool.query('SELECT 1 FROM auth.users WHERE id = $1', [user.id]);

    if (rowCount > 0) {
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
      log.success(`Reused auth.users record for ${user.id}`);
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
    log.success(`Inserted auth.users record for ${user.id}`);
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

async function ensureCase() {
  let seededCase = false;
  try {
    const existing = await pool.query('SELECT id FROM cases WHERE id = $1 LIMIT 1', [TEST_CASE_ID]);
    if (existing.rowCount === 0) {
      await pool.query(
        `INSERT INTO cases (id, status, created_at, description)
         VALUES ($1, 'open', NOW(), $2)
         ON CONFLICT (id) DO NOTHING`,
        [TEST_CASE_ID, 'Dashboard smoke test case']
      );
      seededCase = true;
      log.success(`Inserted test case ${TEST_CASE_ID}`);
    } else {
      log.success(`Reusing case ${TEST_CASE_ID}`);
    }
  } catch (error) {
    log.error('Failed to ensure cases record', error);
    throw error;
  }
  return { caseId: TEST_CASE_ID, seededCase };
}

async function ensureParticipants(caseId) {
  const seededParticipantIds = [];
  const participants = [TEST_MEDIATOR, TEST_DIVORCEE];

  for (const participant of participants) {
    await ensureAuthUser(participant);
    await ensureAppUser(participant);

    try {
      const { rows } = await pool.query(
        `INSERT INTO case_participants (case_id, user_id, role, status, created_at)
         VALUES ($1, $2, $3, 'active', NOW())
         ON CONFLICT (case_id, user_id) DO NOTHING
         RETURNING id`,
        [caseId, participant.id, participant.role]
      );
      if (rows.length > 0) {
        seededParticipantIds.push(rows[0].id);
        log.success(`Added ${participant.role} participant ${participant.id}`);
      } else {
        log.success(`Reusing existing ${participant.role} participant ${participant.id}`);
      }
    } catch (error) {
      log.error(`Failed to ensure case participant ${participant.id}`, error);
      throw error;
    }
  }

  return seededParticipantIds;
}

async function ensureUpload(caseId, userId) {
  try {
    const existing = await pool.query(
      `SELECT id FROM uploads WHERE case_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [caseId]
    );
    if (existing.rowCount > 0) {
      log.success(`Reusing existing upload ${existing.rows[0].id} for case ${caseId}`);
      return { seededUploadIds: [], uploadId: existing.rows[0].id };
    }

    const { rows } = await pool.query(
      `INSERT INTO uploads (
         case_id,
         doc_type,
         status,
         confirmed,
         uploaded_at,
         storage_path,
         original_filename,
         user_id,
         user_uuid
       )
       VALUES (
         $1,
         'id_document',
         'submitted',
         true,
         NOW(),
         $2,
         $3,
         $4,
         $4
       )
       RETURNING id`,
      [caseId, `cases/${caseId}/id_document.pdf`, 'id_document.pdf', userId]
    );

    const uploadId = rows[0].id;
    log.success(`Inserted upload ${uploadId} for case ${caseId}`);
    return { seededUploadIds: [uploadId], uploadId };
  } catch (error) {
    log.error('Failed to ensure uploads record', error);
    throw error;
  }
}

function buildAuthToken(user) {
  if (AUTH_TOKEN) {
    if (SUPABASE_JWT_SECRET) {
      try {
        const verified = jwt.verify(AUTH_TOKEN, SUPABASE_JWT_SECRET);
        const subject = verified?.sub || verified?.user_id || verified?.id;
        if (subject === user.id) {
          return AUTH_TOKEN;
        }
        log.info('AUTH_TOKEN subject mismatch; generating fresh token.');
      } catch (error) {
        log.info(`Existing AUTH_TOKEN rejected (${error.name || 'verification failed'}); generating fresh token.`);
      }
    } else {
      try {
        const decoded = jwt.decode(AUTH_TOKEN);
        if (decoded?.sub === user.id) {
          return AUTH_TOKEN;
        }
        log.info('AUTH_TOKEN subject mismatch; generating fresh token.');
      } catch (error) {
        log.info('Failed to decode AUTH_TOKEN; generating fresh token.');
      }
    }
  }

  if (!SUPABASE_JWT_SECRET) {
    throw new Error('SUPABASE_JWT_SECRET is required when AUTH_TOKEN is not reused');
  }

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    app_metadata: { role: user.role },
  };

  return jwt.sign(payload, SUPABASE_JWT_SECRET, { expiresIn: '1h' });
}

(async () => {
  let seededCase = false;
  let seededParticipantIds = [];
  let seededUploadIds = [];

  try {
    log.info('Checking API availability');
    await ensureApiAvailable();

    const { caseId, seededCase: createdCase } = await ensureCase();
    seededCase = createdCase;

    const participantIds = await ensureParticipants(caseId);
    seededParticipantIds = participantIds;

    const { seededUploadIds: uploadIds } = await ensureUpload(caseId, TEST_MEDIATOR.id);
    seededUploadIds = uploadIds;

    const token = buildAuthToken(TEST_MEDIATOR);

    log.info('Fetching case dashboard');
    const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(
        `GET /api/cases/${caseId}/dashboard failed (${response.status}): ${payload.error || JSON.stringify(payload)}`
      );
    }

    const caseData = payload.case;
    if (!caseData || Number(caseData.id) !== Number(caseId)) {
      throw new Error('Dashboard response missing case metadata');
    }
    log.success('Dashboard response includes case metadata');

    if (!Array.isArray(payload.participants) || payload.participants.length === 0) {
      throw new Error('Dashboard response missing participants');
    }
    log.success('Dashboard response includes participants array');

    if (!Array.isArray(payload.uploads_summary) || payload.uploads_summary.length === 0) {
      throw new Error('Dashboard response missing uploads summary');
    }
    log.success('Dashboard response includes uploads array');

    console.log('✅ Dashboard lifecycle succeeded');
  } catch (error) {
    log.error('Case dashboard lifecycle test failed', error);
    process.exitCode = 1;
  } finally {
    try {
      for (const uploadId of seededUploadIds) {
        await pool.query('DELETE FROM uploads WHERE id = $1', [uploadId]);
      }
      if (seededCase) {
        await pool.query('DELETE FROM cases WHERE id = $1', [TEST_CASE_ID]);
      } else if (seededParticipantIds.length > 0) {
        await pool.query('DELETE FROM case_participants WHERE id = ANY($1::uuid[])', [seededParticipantIds]);
      }
    } catch (cleanupError) {
      log.error('Failed during dashboard cleanup', cleanupError);
    } finally {
      await pool
        .end()
        .catch((err) => log.error('Failed to close database pool', err));
      process.exit(process.exitCode || 0);
    }
  }
})();
