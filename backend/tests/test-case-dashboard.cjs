const path = require('path');
const { randomUUID } = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase')
      ? { rejectUnauthorized: false }
      : undefined,
});

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';
const CASE_ID = 4;
const mediatorId = '11111111-1111-4111-8111-111111111111';
const divorceeId = '22222222-2222-4222-8222-222222222222';
const mediatorEmail = 'alice.mediator@example.com';
const divorceeEmail = 'bob.divorcee@example.com';

const now = Date.now();
const notes = [
  {
    body: `Dashboard test note A ${now}`,
    authorId: mediatorId,
  },
  {
    body: `Dashboard test note B ${now}`,
    authorId: divorceeId,
  },
];

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg, err) => console.error(`❌ ${msg}${err ? `\n   ${err.message || err}` : ''}`),
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
      await wait(500 * attempt);
    }
  }
  throw new Error(`Unable to reach API at ${API_BASE_URL}. Please start the backend server.`);
}

async function seedData() {
  log.info('Seeding mediator and participant records');

  await pool.query(
    `INSERT INTO app_users (id, role, name, email)
     VALUES ($1, 'mediator', 'Alice Mediator', $2)
     ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name, email = EXCLUDED.email` ,
    [mediatorId, mediatorEmail]
  );

  await pool.query(
    `INSERT INTO app_users (id, role, name, email)
     VALUES ($1, 'divorcee', 'Bob Divorcee', $2)
     ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name, email = EXCLUDED.email` ,
    [divorceeId, divorceeEmail]
  );

  log.success('Upserted app_users records');

  const existingCase = await pool.query('SELECT id FROM cases WHERE id = $1', [CASE_ID]);
  let createdCase = false;

  if (existingCase.rowCount === 0) {
    await pool.query(
      `INSERT INTO cases (id, status, created_at)
       VALUES ($1, 'open', NOW())`,
      [CASE_ID]
    );
    createdCase = true;
    log.success(`Created case ${CASE_ID}`);
  } else {
    log.success(`Case ${CASE_ID} already exists`);
  }

  const upsertParticipant = async (userId, role, status) => {
    await pool.query(
      `INSERT INTO case_participants (case_id, user_id, role, status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (case_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status`,
      [CASE_ID, userId, role, status]
    );
  };

  await upsertParticipant(mediatorId, 'mediator', 'active');
  await upsertParticipant(divorceeId, 'divorcee', 'active');

  log.success('Participants ensured');

  const noteIds = [];

  for (const note of notes) {
    await pool.query('DELETE FROM case_notes WHERE case_id = $1 AND author_id = $2', [CASE_ID, note.authorId]);
    const inserted = await pool.query(
      `INSERT INTO case_notes (id, case_id, author_id, body, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id` ,
      [randomUUID(), CASE_ID, note.authorId, note.body]
    );
    noteIds.push(inserted.rows[0].id);
  }

  log.success('Inserted dashboard test notes');

  return { noteIds, createdCase };
}

function buildToken(userId, role) {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) {
    throw new Error('SUPABASE_JWT_SECRET is not configured');
  }
  const payload = {
    sub: userId,
    role,
    app_metadata: { role },
    user_role: role,
  };
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

async function assertDashboard(token) {
  const response = await fetch(`${API_BASE_URL}/api/cases/${CASE_ID}/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Expected 200 OK, received ${response.status}`);
  }

  const data = await response.json();

  if (!data.case || Number(data.case.id) !== CASE_ID) {
    throw new Error('Dashboard payload missing case info.');
  }

  const participants = data.participants || [];
  const participantIds = participants.map((participant) => participant.user_id);
  if (!participantIds.includes(mediatorId) || !participantIds.includes(divorceeId)) {
    throw new Error('Participants list is missing expected users.');
  }

  const responseNoteBodies = (data.notes || []).map((note) => note.body);
  const missingNote = notes.find((note) => !responseNoteBodies.includes(note.body));
  if (missingNote) {
    throw new Error(`Dashboard notes missing expected body: ${missingNote.body}`);
  }

  log.success('Dashboard response includes seeded case, participants, and notes');
}

async function assertInvalidToken() {
  const response = await fetch(`${API_BASE_URL}/api/cases/${CASE_ID}/dashboard`, {
    headers: {
      Authorization: 'Bearer invalid-token',
    },
  });

  if (response.status !== 401) {
    throw new Error(`Expected 401 for invalid token, received ${response.status}`);
  }

  log.success('Invalid token rejected with 401');
}

(async () => {
  let seeded = null;
  try {
    await ensureApiAvailable();
  seeded = await seedData();

    const mediatorToken = buildToken(mediatorId, 'mediator');
    await assertDashboard(mediatorToken);
    await assertInvalidToken();
  } catch (error) {
    log.error('Case dashboard test failed', error);
    process.exitCode = 1;
  } finally {
    try {
      if (seeded?.noteIds?.length) {
        await pool.query('DELETE FROM case_notes WHERE id = ANY($1)', [seeded.noteIds]);
      }
      await pool.query('DELETE FROM case_participants WHERE case_id = $1 AND user_id IN ($2, $3)', [CASE_ID, mediatorId, divorceeId]);
      if (seeded?.createdCase) {
        await pool.query('DELETE FROM cases WHERE id = $1', [CASE_ID]);
      }
      log.success('Cleanup complete');
    } catch (cleanupErr) {
      log.error('Cleanup encountered an error', cleanupErr);
    }
    await pool.end();
  }
})();
