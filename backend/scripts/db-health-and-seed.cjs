// db-health-and-seed.cjs

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Add it to backend/.env.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('supabase')
    ? { rejectUnauthorized: false }
    : undefined,
});

const TABLES = ['cases', 'app_users', 'case_participants'];
const CASE_ID = 4;

const USERS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    role: 'mediator',
    name: 'Alice Mediator',
    email: 'alice@example.com',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    role: 'divorcee',
    name: 'Bob Divorcee',
    email: 'bob@example.com',
  },
];

const PARTICIPANTS = [
  {
    id: '44444444-1111-4444-1111-111111111111',
    caseId: CASE_ID,
    userId: USERS[0].id,
    role: 'mediator',
    status: 'active',
  },
  {
    id: '44444444-2222-4444-2222-222222222222',
    caseId: CASE_ID,
    userId: USERS[1].id,
    role: 'divorcee',
    status: 'invited',
  },
];

(async () => {
  try {
    const nowRes = await pool.query('SELECT NOW() AS now');
    console.log(`✅ DB connected, server time: ${nowRes.rows[0].now}`);

    const userRes = await pool.query('SELECT current_user AS user');
    console.log(`✅ Current user: ${userRes.rows[0].user}`);

    const dbRes = await pool.query('SELECT current_database() AS db');
    console.log(`✅ Current database: ${dbRes.rows[0].db}`);

    const missingTables = [];
    for (const table of TABLES) {
      const existsRes = await pool.query('SELECT to_regclass($1) AS oid', [`public.${table}`]);
      const exists = Boolean(existsRes.rows[0].oid);
      if (!exists) {
        console.warn(`⚠️ Table missing: ${table}`);
        missingTables.push(table);
      } else {
        const countRes = await pool.query(`SELECT COUNT(*) FROM ${table}`);
        console.log(`✅ ${table} rows: ${countRes.rows[0].count}`);
      }
    }

    if (missingTables.length > 0) {
      console.warn('⚠️ Skipping seeding due to missing tables.');
      return;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO cases (id, description)
         VALUES ($1, $2)
         ON CONFLICT (id) DO NOTHING`,
        [CASE_ID, 'Test case for participants'],
      );

      for (const user of USERS) {
        await client.query(
          `INSERT INTO app_users (id, role, name, email)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (id) DO NOTHING`,
          [user.id, user.role, user.name, user.email],
        );
      }

      for (const participant of PARTICIPANTS) {
        await client.query(
          `INSERT INTO case_participants (id, case_id, user_id, role, status)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (case_id, user_id) DO UPDATE
           SET id = EXCLUDED.id,
               role = EXCLUDED.role,
               status = EXCLUDED.status`,
          [
            participant.id,
            participant.caseId,
            participant.userId,
            participant.role,
            participant.status,
          ],
        );
      }

      await client.query('COMMIT');
      console.log('✅ Seed data ensured for case 4');
    } catch (seedErr) {
      await client.query('ROLLBACK');
      throw seedErr;
    } finally {
      client.release();
    }

    const participantsRes = await pool.query(
      `SELECT cp.case_id, cp.role AS participant_role, cp.status,
              au.id AS user_id, au.name, au.email, au.role AS app_user_role
       FROM case_participants cp
       JOIN app_users au ON cp.user_id = au.id
       WHERE cp.case_id = $1
       ORDER BY cp.role DESC;`,
      [CASE_ID],
    );

    console.log('👥 Participants for case 4:');
    console.table(participantsRes.rows);
  } catch (err) {
    console.error('❌ db-health-and-seed failed:', err.message);
  } finally {
    await pool.end();
  }
})();
