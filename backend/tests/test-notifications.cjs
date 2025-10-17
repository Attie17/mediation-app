const path = require('path');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const TEST_USER_ID = 'c7c9861a-6f24-4d2c-a2f3-6b1f8dc29aa4';
const TEST_USER_EMAIL = 'notifications.test@example.com';
const SECRET = process.env.SUPABASE_JWT_SECRET;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set for notification tests');
}

if (!SECRET) {
  throw new Error('SUPABASE_JWT_SECRET must be set for notification tests');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL.includes('supabase')
      ? { rejectUnauthorized: false }
      : undefined,
});

const log = {
  info: (message) => console.log(`ℹ️  ${message}`),
  success: (message) => console.log(`✅ ${message}`),
  error: (message, err) => console.error(`❌ ${message}${err ? `\n   ${err.message || err}` : ''}`),
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createToken = () =>
  jwt.sign(
    {
      sub: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      role: 'mediator',
      app_metadata: { role: 'mediator' },
    },
    SECRET,
    { expiresIn: '1h' },
  );

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
      await wait(300 * attempt);
    }
  }
  throw new Error(`Unable to reach API at ${API_BASE_URL}. Ensure the backend server is running.`);
}

async function seedUser() {
  log.info('Seeding test user');
  await pool.query(
    `INSERT INTO app_users (id, email, role, name)
     VALUES ($1, $2, 'mediator', 'Notifications Test User')
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, role = EXCLUDED.role, name = EXCLUDED.name`,
    [TEST_USER_ID, TEST_USER_EMAIL],
  );
  await pool.query(`DELETE FROM notifications WHERE user_id = $1`, [TEST_USER_ID]);
}

async function insertTestNotification() {
  log.info('Inserting seed notification');
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, message, type)
     VALUES ($1, $2, 'info')
     RETURNING id, status` ,
    [TEST_USER_ID, 'Initial test notification'],
  );
  return rows[0];
}

async function fetchNotifications(token) {
  const response = await fetch(`${API_BASE_URL}/api/notifications`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`GET /api/notifications failed (${response.status}): ${payload.error || JSON.stringify(payload)}`);
  }

  return Array.isArray(payload.data) ? payload.data : [];
}

async function markAsRead(token, id) {
  const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`PATCH /api/notifications/${id}/read failed (${response.status}): ${payload.error || JSON.stringify(payload)}`);
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
    throw new Error(`DELETE /api/notifications/${id} failed (${response.status}): ${payload.error || JSON.stringify(payload)}`);
  }
  return payload;
}

(async () => {
  const token = createToken();
  let seededNotification;

  try {
    await ensureApiAvailable();
    await seedUser();
    seededNotification = await insertTestNotification();

    const notifications = await fetchNotifications(token);
    const found = notifications.find((item) => item.id === seededNotification.id);
    if (!found) {
      throw new Error('Seeded notification missing from GET response');
    }
    if (found.status !== 'unread') {
      throw new Error(`Expected seeded notification to be unread, got ${found.status}`);
    }
    log.success('GET /api/notifications returned seeded notification');

    const updated = await markAsRead(token, seededNotification.id);
    if (updated.status !== 'read') {
      throw new Error('PATCH did not return a read notification');
    }
    log.success('PATCH /api/notifications/:id/read marked notification as read');

    await deleteNotification(token, seededNotification.id);
    const afterDelete = await fetchNotifications(token);
    if (afterDelete.some((item) => item.id === seededNotification.id)) {
      throw new Error('Notification still present after DELETE');
    }
    log.success('DELETE /api/notifications/:id removed notification');
  } catch (error) {
    log.error('Notification lifecycle test failed', error);
    process.exitCode = 1;
  } finally {
    if (seededNotification) {
      await pool.query(`DELETE FROM notifications WHERE id = $1`, [seededNotification.id]).catch(() => {});
    }
    await pool.query(`DELETE FROM notifications WHERE user_id = $1`, [TEST_USER_ID]).catch(() => {});
    await pool.end();
    process.exit(process.exitCode || 0);
  }
})();
