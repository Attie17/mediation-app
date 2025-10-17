const path = require('path');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = 'http://localhost:4000/api';
const CASE_ID = 4;
const CHARLIE_EMAIL = 'charlie@example.com';
const CHARLIE_ID = process.env.CHARLIE_USER_ID || '33333333-3333-4333-8333-333333333333';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

if (!AUTH_TOKEN) {
  console.error('❌ Missing AUTH_TOKEN in environment');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('❌ Missing DATABASE_URL in environment');
  process.exit(1);
}

if (!SUPABASE_JWT_SECRET) {
  console.error('❌ Missing SUPABASE_JWT_SECRET in environment (needed to sign participant token)');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : undefined,
});

const mediatorHeaders = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
};

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logFailure(message) {
  console.log(`❌ ${message}`);
}

async function upsertCharlieUser() {
  const query = `INSERT INTO app_users (id, role, name, email)
                 VALUES ($1, 'divorcee', 'Charlie Example', $2)
                 ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name, email = EXCLUDED.email`;
  await pool.query(query, [CHARLIE_ID, CHARLIE_EMAIL]);
}

async function getParticipants() {
  const response = await fetch(`${BASE_URL}/cases/${CASE_ID}/participants`, {
    headers: mediatorHeaders,
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GET participants failed (${response.status}): ${body}`);
  }
  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error('GET participants did not return an array');
  }
  logSuccess(`GET participants returned ${data.length} rows`);
  return data;
}

async function inviteParticipant() {
  const response = await fetch(`${BASE_URL}/cases/${CASE_ID}/participants/invite`, {
    method: 'POST',
    headers: mediatorHeaders,
    body: JSON.stringify({ email: CHARLIE_EMAIL, role: 'divorcee' }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Invite failed (${response.status}): ${data.error || JSON.stringify(data)}`);
  }
  if (!data || !data.user_id) {
    throw new Error('Invite response missing user_id');
  }
  logSuccess('Invite participant succeeded');
  return data.user_id;
}

function buildParticipantToken(userId) {
  const payload = {
    sub: userId,
    role: 'divorcee',
    app_metadata: { role: 'divorcee' },
    user_role: 'divorcee',
  };
  return jwt.sign(payload, SUPABASE_JWT_SECRET, { expiresIn: '30m' });
}

async function acceptInvite(userId) {
  const participantToken = buildParticipantToken(userId);
  const response = await fetch(`${BASE_URL}/cases/${CASE_ID}/participants/accept`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${participantToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Accept failed (${response.status}): ${data.error || JSON.stringify(data)}`);
  }
  if (!data || data.status !== 'active') {
    throw new Error(`Accept response missing expected status, received: ${JSON.stringify(data)}`);
  }
  logSuccess('Accept invite succeeded');
}

async function activateParticipant(userId) {
  const response = await fetch(`${BASE_URL}/cases/${CASE_ID}/participants/${userId}`, {
    method: 'PATCH',
    headers: mediatorHeaders,
    body: JSON.stringify({ status: 'active' }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Patch failed (${response.status}): ${data.error || JSON.stringify(data)}`);
  }
  if (data.status !== 'active') {
    throw new Error(`Patch response did not return active status: ${JSON.stringify(data)}`);
  }
  logSuccess('Patch participant status succeeded');
}

async function deleteParticipant(userId) {
  const response = await fetch(`${BASE_URL}/cases/${CASE_ID}/participants/${userId}`, {
    method: 'DELETE',
    headers: mediatorHeaders,
  });
  const data = await response.json().catch(() => ({}));
  if (response.ok && data.success) {
    logSuccess('Delete participant succeeded');
    return;
  }
  if (!response.ok) {
    logFailure(`Delete participant returned ${response.status}: ${data.error || JSON.stringify(data)}`);
  } else {
    logFailure('Delete participant did not return success flag');
  }
}

async function main() {
  try {
    await upsertCharlieUser();
    await getParticipants();
    const userId = await inviteParticipant();
    await acceptInvite(userId);
    await activateParticipant(userId);
    await deleteParticipant(userId);
  } catch (error) {
    logFailure(error.message || error);
    process.exitCode = 1;
  } finally {
    await pool.end();
    process.exit(process.exitCode || 0);
  }
}

main();
