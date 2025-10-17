// db-cleanup-case4.cjs

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

const CASE_ID = 4;
const USER_IDS = [
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
];

(async () => {
  try {
    const nowRes = await pool.query('SELECT NOW() AS now');
    console.log(`✅ DB connected, server time: ${nowRes.rows[0].now}`);

    const userRes = await pool.query('SELECT current_user AS user');
    console.log(`✅ Current user: ${userRes.rows[0].user}`);

    const dbRes = await pool.query('SELECT current_database() AS db');
    console.log(`✅ Current database: ${dbRes.rows[0].db}`);

    const client = await pool.connect();

    let participantsRemoved = 0;
    let usersRemoved = 0;
    let casesRemoved = 0;

    try {
      await client.query('BEGIN');

      const participantsBefore = await client.query(
        `SELECT id, case_id, user_id, role, status
         FROM case_participants
         WHERE case_id = $1`,
        [CASE_ID],
      );
      if (participantsBefore.rowCount > 0) {
        console.log('🔍 Participants before cleanup:');
        console.table(participantsBefore.rows);
      }

      let triggerDisabled = false;
      try {
        await client.query('ALTER TABLE case_participants DISABLE TRIGGER trg_enforce_mediator_constraint');
        triggerDisabled = true;
        console.log('🔧 Temporarily disabled mediator constraint trigger');
      } catch (triggerErr) {
        console.warn('⚠️ Could not disable mediator constraint trigger:', triggerErr.message);
      }

      try {
        const participantRes = await client.query(
          `DELETE FROM case_participants
           WHERE case_id = $1
           RETURNING id, user_id, role, status`,
          [CASE_ID],
        );
        participantsRemoved = participantRes.rowCount;
        if (participantsRemoved > 0) {
          console.log('🗑️ Removed participants:');
          console.table(participantRes.rows);
        } else {
          console.log('ℹ️ No matching participants to remove');
        }
      } finally {
        if (triggerDisabled) {
          await client.query('ALTER TABLE case_participants ENABLE TRIGGER trg_enforce_mediator_constraint');
          console.log('🔧 Restored mediator constraint trigger');
        }
      }

      const userResDelete = await client.query(
        `DELETE FROM app_users
         WHERE id = ANY($1::uuid[])
         RETURNING id, email, role`,
        [USER_IDS],
      );
      usersRemoved = userResDelete.rowCount;
      if (usersRemoved > 0) {
        console.log('🗑️ Removed app users:');
        console.table(userResDelete.rows);
      } else {
        console.log('ℹ️ No matching app_users to remove');
      }

      const caseRes = await client.query(
        `DELETE FROM cases
         WHERE id = $1
         RETURNING id, description`,
        [CASE_ID],
      );
      casesRemoved = caseRes.rowCount;
      if (casesRemoved > 0) {
        console.log('🗑️ Removed case row:');
        console.table(caseRes.rows);
      } else {
        console.log('ℹ️ Case 4 was already absent');
      }

      await client.query('COMMIT');
      console.log('✅ Cleanup committed successfully');
    } catch (cleanupErr) {
      await client.query('ROLLBACK');
      throw cleanupErr;
    } finally {
      client.release();
    }

    const verifyCase = await pool.query(
      `SELECT id FROM cases WHERE id = $1`,
      [CASE_ID],
    );
    if (verifyCase.rowCount === 0) {
      console.log('✅ Verification: case 4 removed');
    } else {
      console.warn('⚠️ Case 4 still present:', verifyCase.rows);
    }

    const verifyUsers = await pool.query(
      `SELECT id, email, role FROM app_users WHERE id = ANY($1::uuid[])`,
      [USER_IDS],
    );
    if (verifyUsers.rowCount === 0) {
      console.log('✅ Verification: Alice + Bob removed');
    } else {
      console.warn('⚠️ Users still present:', verifyUsers.rows);
    }

    const verifyParticipants = await pool.query(
      `SELECT id, case_id, user_id, role, status
       FROM case_participants
       WHERE case_id = $1`,
      [CASE_ID],
    );
    if (verifyParticipants.rowCount === 0) {
      console.log('✅ Verification: no participants remain for case 4');
    } else {
      console.warn('⚠️ Participants still present for case 4:');
      console.table(verifyParticipants.rows);
    }

    console.log('📊 Summary:');
    console.table([
      { entity: 'case_participants', removed: participantsRemoved },
      { entity: 'app_users', removed: usersRemoved },
      { entity: 'cases', removed: casesRemoved },
    ]);
  } catch (err) {
    console.error('❌ db-cleanup-case4 failed:', err.message);
  } finally {
    await pool.end();
  }
})();
