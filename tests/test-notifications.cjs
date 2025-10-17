const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const rootEnvPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: rootEnvPath, override: false });

const backendEnvPath = path.resolve(__dirname, '..', 'backend', '.env');
dotenv.config({ path: backendEnvPath, override: true });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const DATABASE_URL = process.env.DATABASE_URL;
const TEST_JWT = process.env.TEST_JWT;
if (!TEST_JWT) {
  throw new Error("Missing TEST_JWT in .env – run setup-mediator.ps1 first");
}
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL must be set in your .env file');
  process.exit(1);
}

if (!SUPABASE_JWT_SECRET && !TEST_JWT) {
  console.error('❌ Provide SUPABASE_JWT_SECRET or TEST_JWT in your .env file');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

const TEST_MEDIATOR_ID = '11111111-2222-3333-4444-555555555555';
const TEST_MEDIATOR_EMAIL = 'notifications.mediator@example.com';
const TEST_MEDIATOR_NAME = 'Notifications Test Mediator';
const MESSAGE = 'Notification test message';
const TYPE = 'info';

const log = {
  info: (message) => console.log(`ℹ️  ${message}`),
  success: (message) => console.log(`✅ ${message}`),
  error: (message, err) => {
    console.error(`❌ ${message}`);
    if (err) {
      console.error(`   ${err.message || err}`);
      if (err.stack) {
        console.error(err.stack);
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
    } catch (err) {
      log.info(`Attempt ${attempt}/5 to reach API failed. Retrying...`);
    }
    await wait(500 * attempt);
  }
  throw new Error(`Unable to reach API at ${API_BASE_URL}. Ensure the backend server is running.`);
}

async function ensureMediatorUser() {
  // Prefer an existing mediator that already has a matching auth.users row (to satisfy FK constraints)
  try {
    const existing = await pool.query(
      `SELECT au.id,
              COALESCE(au.email, '') AS email,
              COALESCE(au.name, '') AS name
         FROM app_users au
         JOIN auth.users u ON au.id = u.id
        WHERE au.role = 'mediator'
        ORDER BY au.created_at DESC NULLS LAST
        LIMIT 1`
    );

    if (existing.rowCount > 0) {
      const mediator = existing.rows[0];
      log.success(`Reusing mediator user ${mediator.id}`);
      return {
        id: mediator.id,
        email: mediator.email || TEST_MEDIATOR_EMAIL,
        name: mediator.name || TEST_MEDIATOR_NAME,
      };
    }
  } catch (error) {
    log.error('Failed to query existing mediator users', error);
    throw error;
  }

  log.info('No mediator linked to auth.users found; inserting fixed mediator');

  try {
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
       )
       ON CONFLICT (id) DO UPDATE SET
         email = EXCLUDED.email,
         raw_app_meta_data = EXCLUDED.raw_app_meta_data,
         raw_user_meta_data = EXCLUDED.raw_user_meta_data,
         updated_at = NOW(),
         is_anonymous = false,
         is_sso_user = false`,
      [
        TEST_MEDIATOR_ID,
        TEST_MEDIATOR_EMAIL,
        JSON.stringify({ role: 'mediator' }),
        JSON.stringify({ name: TEST_MEDIATOR_NAME }),
      ]
    );
  } catch (error) {
    log.error('Failed to ensure auth.users mediator record', error);
    throw error;
  }

  try {
    await pool.query(
      `INSERT INTO app_users (id, role, email, name)
       VALUES ($1, 'mediator', $2, $3)
       ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, email = EXCLUDED.email, name = EXCLUDED.name`,
      [TEST_MEDIATOR_ID, TEST_MEDIATOR_EMAIL, TEST_MEDIATOR_NAME]
    );
    log.success(`Inserted mediator user ${TEST_MEDIATOR_ID}`);
    return {
      id: TEST_MEDIATOR_ID,
      email: TEST_MEDIATOR_EMAIL,
      name: TEST_MEDIATOR_NAME,
    };
  } catch (error) {
    log.error('Failed to insert mediator user', error);
    throw error;
  }
}

function buildAuthToken(user) {
  if (AUTH_TOKEN) {
    try {
      const decoded = jwt.decode(AUTH_TOKEN);
      if (decoded?.sub === user.id) {
        return AUTH_TOKEN;
      }
      log.info('AUTH_TOKEN subject does not match mediator user; generating token from SUPABASE_JWT_SECRET instead');
    } catch (error) {
      log.info('Failed to decode AUTH_TOKEN; generating token from SUPABASE_JWT_SECRET');
    }
  }

  const payload = {
    sub: user.id,
    email: user.email,
    role: 'mediator',
    app_metadata: { role: 'mediator' },
  };

  return jwt.sign(payload, SUPABASE_JWT_SECRET, { expiresIn: '1h' });
}

async function clearNotifications(userId) {
  try {
    await pool.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
  } catch (error) {
    log.error('Failed to clear notifications for mediator', error);
    throw error;
  }
}

async function postNotification(token) {
  const requestBody = { message: MESSAGE, type: TYPE };

  if (!token) {
    throw new Error('Authentication token is required to create a notification');
  }

  const response = await fetch(`${API_BASE_URL}/api/notifications`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error(`POST /api/notifications returned non-JSON response (${response.status})`);
  }

  if (!response.ok) {
    throw new Error(
      `POST /api/notifications failed (${response.status}): ${payload.error || JSON.stringify(payload)}`
    );
  }

  return payload.data || payload;
}

async function fetchNotifications(token) {
  const response = await fetch(`${API_BASE_URL}/api/notifications`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      `GET /api/notifications failed (${response.status}): ${payload.error || JSON.stringify(payload)}`
    );
  }

  return Array.isArray(payload.data) ? payload.data : [];
}

async function markNotificationAsRead(token, id) {
  const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      `PATCH /api/notifications/${id}/read failed (${response.status}): ${payload.error || JSON.stringify(payload)}`
    );
  }

  return payload.data || payload;
}

async function deleteNotification(token, id) {
  const response = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      `DELETE /api/notifications/${id} failed (${response.status}): ${payload.error || JSON.stringify(payload)}`
    );
  }

  return payload.data || payload;
}

(async () => {
  let mediatorUser;
  let seededNotification;
  let token;

  try {
    log.info('Checking API availability');
    await ensureApiAvailable();

    log.info('Ensuring mediator user exists');
    mediatorUser = await ensureMediatorUser();
    log.success(`Mediator user ready (${mediatorUser.id})`);

    log.info('Clearing notifications for mediator user');
    await clearNotifications(mediatorUser.id);
    log.success('Notifications cleared');

    token = buildAuthToken(mediatorUser);

    log.info('Creating notification (POST step)');
    seededNotification = await postNotification(token);
    log.success('POST /api/notifications created notification via API');

    log.info('Fetching notifications list');
    const list = await fetchNotifications(token);
    const match = list.find((item) => item.id === seededNotification.id);
    if (!match) {
      throw new Error('Seeded notification missing from GET response');
    }
    log.success('GET /api/notifications returned seeded notification');

    log.info('Marking notification as read');
    const updated = await markNotificationAsRead(token, seededNotification.id);
    if (updated.status !== 'read') {
      throw new Error('Notification status did not update to read');
    }
    log.success('PATCH /api/notifications/:id/read marked notification as read');

    log.info('Deleting notification');
    await deleteNotification(token, seededNotification.id);
    log.success('DELETE /api/notifications/:id removed notification');

    log.info('Verifying notifications list is empty');
    const finalList = await fetchNotifications(token);
    const remaining = finalList.filter((item) => item.user_id === mediatorUser.id);
    if (remaining.length > 0) {
      throw new Error('Expected no notifications for mediator after delete');
    }
  log.success('Final GET confirmed empty notification list');
  } catch (error) {
    log.error('Notification lifecycle test failed', error);
    process.exitCode = 1;
  } finally {
    if (mediatorUser) {
      try {
        await clearNotifications(mediatorUser.id);
      } catch (cleanupError) {
        log.error('Failed to cleanup notifications', cleanupError);
      }
    }

    await pool
      .end()
      .catch((err) => log.error('Failed to close database pool', err));

    process.exit(process.exitCode || 0);
  }
})();
