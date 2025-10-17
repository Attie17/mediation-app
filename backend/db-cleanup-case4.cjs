// db-cleanup-case4.cjs

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined in backend/.env');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('supabase')
    ? { rejectUnauthorized: false }
    : undefined,
});

const CASE_ID = 4;
const USER_IDS = [
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
];
const TABLES = ['cases', 'app_users', 'case_participants'];

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
        console.warn(`⚠️ Skipping cleanup: table ${table} is missing`);
        missingTables.push(table);
      }
    }

    if (missingTables.length > 0) {
      console.warn(`⚠️ Cleanup aborted due to missing tables: ${missingTables.join(', ')}`);
      return;
    }

    const client = await pool.connect();
    let participantCount = 0;
    let userCount = 0;
    let caseCount = 0;

    const participantsBefore = await pool.query(
      `SELECT id, case_id, user_id, role, status
       FROM case_participants
       WHERE case_id = $1
         AND user_id = ANY($2::uuid[])`
      , [CASE_ID, USER_IDS],
    );
    if (participantsBefore.rowCount > 0) {
      console.log('🔍 Participants before cleanup:');
      console.table(participantsBefore.rows);
    }

    try {
      await client.query('BEGIN');

      const participantIds = participantsBefore.rows.map((row) => row.id);
      if (participantIds.length > 0) {
        const participantRes = await client.query(
          `DELETE FROM case_participants
           WHERE id = ANY($1::uuid[])
           RETURNING id, case_id, user_id, role, status`,
          [participantIds],
        );
        participantCount = participantRes.rowCount;
        console.log('🗑️ Removed participants:');
        console.table(participantRes.rows);
      } else {
        console.log('ℹ️ No participants matched case 4 + Alice/Bob');
      }

      const usersBefore = await client.query(
        `SELECT id, email, role
         FROM app_users
         WHERE id = ANY($1::uuid[])`,
        [USER_IDS],
      );
      if (usersBefore.rowCount > 0) {
        console.log('� Users before cleanup:');
        console.table(usersBefore.rows);
      }

      if (usersBefore.rowCount > 0) {
        const userResDelete = await client.query(
          `DELETE FROM app_users
           WHERE id = ANY($1::uuid[])
           RETURNING id, email, role`,
          [USER_IDS],
        );
        userCount = userResDelete.rowCount;
        console.log('🗑️ Removed app users:');
        console.table(userResDelete.rows);
      } else {
        console.log('ℹ️ No app_users matched Alice/Bob IDs');
      }

      const caseRes = await client.query(
        `DELETE FROM cases
         WHERE id = $1
         RETURNING id, description`,
        [CASE_ID],
      );
      caseCount = caseRes.rowCount;
      if (caseCount > 0) {
        console.log('🗑️ Removed case entry:');
        console.table(caseRes.rows);
      } else {
        console.log('ℹ️ Case 4 not found in cases table');
      }

      await client.query('COMMIT');
      console.log('✅ Cleanup committed successfully');
    } catch (cleanupErr) {
      await client.query('ROLLBACK');
      throw cleanupErr;
    } finally {
      client.release();
    }

    const postCheck = await pool.query(
      `SELECT cp.case_id, cp.user_id, au.name
       FROM case_participants cp
       LEFT JOIN app_users au ON cp.user_id = au.id
       WHERE cp.case_id = $1
         AND cp.user_id = ANY($2::uuid[]);`,
      [CASE_ID, USER_IDS],
    );

    if (postCheck.rowCount === 0) {
      console.log('🎉 Verification success: no matching participants remain for case 4.');
    } else {
      console.warn('⚠️ Participants still present after cleanup:');
      console.table(postCheck.rows);
    }

    console.log('📊 Summary:');
    console.table([
      { entity: 'case_participants', removed: participantCount },
      { entity: 'app_users', removed: userCount },
      { entity: 'cases', removed: caseCount },
    ]);
  } catch (err) {
    console.error('❌ db-cleanup-case4 failed:', err.message);
  } finally {
    await pool.end();
  }
})();
