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
  console.error('❌ DATABASE_URL must be set for uploads tests');
  process.exit(1);
}

if (!SUPABASE_JWT_SECRET && !TEST_JWT) {
  console.error('❌ Provide SUPABASE_JWT_SECRET or TEST_JWT for uploads tests');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

const TEST_CASE_ID = 9101;
const TEST_DOC_TYPE = 'id_document';

const TEST_MEDIATOR = {
  id: '22222222-2222-4222-8222-222222222222',
  email: 'uploads.mediator@example.com',
  name: 'Uploads Test Mediator',
  role: 'mediator',
};

const TEST_DIVORCEE = {
  id: '44444444-4444-4444-8444-444444444444',
  email: 'uploads.divorcee@example.com',
  name: 'Uploads Test Divorcee',
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

async function ensureCase() {
  let seeded = false;
  try {
    const existing = await pool.query('SELECT id FROM cases WHERE id = $1 LIMIT 1', [TEST_CASE_ID]);
    if (existing.rowCount === 0) {
      await pool.query(
        `INSERT INTO cases (id, status, created_at, description)
         VALUES ($1, 'open', NOW(), $2)
         ON CONFLICT (id) DO NOTHING`,
        [TEST_CASE_ID, 'Uploads smoke test case']
      );
      seeded = true;
    }
  } catch (error) {
    log.error('Failed to ensure cases record', error);
    throw error;
  }
  return { seeded };
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
      return { seeded: true, id: rows[0].id };
    }
    const reuse = await pool.query(
      'SELECT id FROM case_participants WHERE case_id = $1 AND user_id = $2 LIMIT 1',
      [caseId, user.id]
    );
    return { seeded: false, id: reuse.rows[0]?.id || null };
  } catch (error) {
    log.error(`Failed to ensure case participant ${user.id}`, error);
    throw error;
  }
}

function buildToken(user) {
  // Always use TEST_JWT for all API calls
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
  let seededCase = false;
  let mediatorParticipantSeeded = false;
  let divorceeParticipantSeeded = false;
  let mediatorParticipantId = null;
  let divorceeParticipantId = null;
  let createdUploadId = null;

  try {
    log.info('Checking API availability');
    await ensureApiAvailable();

    await ensureAuthUser(TEST_MEDIATOR);
    await ensureAuthUser(TEST_DIVORCEE);
    await ensureAppUser(TEST_MEDIATOR);
    await ensureAppUser(TEST_DIVORCEE);

  const { seeded } = await ensureCase();
    seededCase = seeded;

    const mediatorParticipant = await ensureCaseParticipant(TEST_CASE_ID, TEST_MEDIATOR, 'mediator');
    mediatorParticipantSeeded = mediatorParticipant.seeded;
    mediatorParticipantId = mediatorParticipant.id;

    const divorceeParticipant = await ensureCaseParticipant(TEST_CASE_ID, TEST_DIVORCEE, 'divorcee');
    divorceeParticipantSeeded = divorceeParticipant.seeded;
    divorceeParticipantId = divorceeParticipant.id;

    const mediatorToken = buildToken(TEST_MEDIATOR);
    const divorceeToken = buildToken(TEST_DIVORCEE);

    log.info('Creating upload via API');
    const createResponse = await fetchJson(
      `${API_BASE_URL}/api/uploads`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${divorceeToken}`,
        },
        body: JSON.stringify({
          userId: TEST_DIVORCEE.id,
          docType: TEST_DOC_TYPE,
          privacyTier: 'Mediator-Only',
          caseId: TEST_CASE_ID,
        }),
      },
      'create upload'
    );

    if (!createResponse?.data?.id) {
      throw new Error('Upload creation response missing ID');
    }

    createdUploadId = createResponse.data.id;
    log.success(`Created upload ${createdUploadId}`);

    log.info('Fetching uploads list to verify creation');
    const listAfterCreate = await fetchJson(
      `${API_BASE_URL}/api/uploads`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mediatorToken}`,
        },
      },
      'list uploads after create'
    );

    const createdUpload = (listAfterCreate.uploads || []).find((upload) => upload.id === createdUploadId);
    if (!createdUpload) {
      throw new Error('Created upload not found in listing response');
    }
    log.success('Upload appears in listing after creation');

    log.info('Confirming upload via API');
    const confirmResponse = await fetchJson(
      `${API_BASE_URL}/api/uploads/${createdUploadId}/confirm`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mediatorToken}`,
        },
        body: JSON.stringify({}),
      },
      'confirm upload'
    );

    const confirmedUpload = confirmResponse.data || confirmResponse;
    if (!confirmedUpload || confirmedUpload.status !== 'confirmed') {
      throw new Error('Upload status was not confirmed');
    }
    log.success('Upload confirmed via API');

    log.info('Rejecting upload via API');
    const rejectResponse = await fetchJson(
      `${API_BASE_URL}/api/uploads/${createdUploadId}/reject`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${mediatorToken}`,
        },
        body: JSON.stringify({ reason: 'Test rejection' }),
      },
      'reject upload'
    );

    const rejectedUpload = rejectResponse.data || rejectResponse;
    if (!rejectedUpload || rejectedUpload.status !== 'rejected') {
      throw new Error('Upload status was not rejected');
    }
    log.success('Upload rejected via API');

    log.info('Deleting upload via API');
    await fetchJson(
      `${API_BASE_URL}/api/uploads/${createdUploadId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${mediatorToken}`,
        },
      },
      'delete upload'
    );
    log.success('Upload deleted via API');

    log.info('Verifying uploads list is empty for the case');
    const listAfterDelete = await fetchJson(
      `${API_BASE_URL}/api/uploads`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${mediatorToken}`,
        },
      },
      'list uploads after delete'
    );

    const remainingUpload = (listAfterDelete.uploads || []).find((upload) => upload.id === createdUploadId);
    if (remainingUpload) {
      throw new Error('Upload still present after deletion');
    }
    log.success('Uploads list is empty after deletion');

    console.log('✅ Uploads lifecycle succeeded');
  } catch (error) {
    log.error('Uploads lifecycle test failed', error);
    process.exitCode = 1;
  } finally {
    try {
      if (createdUploadId) {
        await pool.query('DELETE FROM upload_audit WHERE upload_id = $1', [createdUploadId]);
        await pool.query('DELETE FROM uploads WHERE id = $1', [createdUploadId]);
      }
      if (seededCase) {
        await pool.query('DELETE FROM cases WHERE id = $1', [TEST_CASE_ID]);
      } else {
        if (divorceeParticipantSeeded && divorceeParticipantId) {
          await pool.query('DELETE FROM case_participants WHERE id = $1', [divorceeParticipantId]);
        }
        if (mediatorParticipantSeeded && mediatorParticipantId) {
          await pool.query('DELETE FROM case_participants WHERE id = $1', [mediatorParticipantId]);
        }
      }
    } catch (cleanupError) {
      log.error('Failed during uploads cleanup', cleanupError);
    } finally {
      await pool.end().catch((err) => log.error('Failed to close database pool', err));
      process.exit(process.exitCode || 0);
    }
  }
})();
