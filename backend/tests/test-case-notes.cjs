const path = require('path');
const { randomUUID } = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase')
    ? { rejectUnauthorized: false }
    : undefined,
});

const logSuccess = (message) => console.log(`✅ ${message}`);
const logFailure = (message, error) => console.error(`❌ ${message}`, error ? `\n   ${error.message || error}` : '');

(async () => {
  const testCaseId = Date.now();
  const authorId = randomUUID();
  const noteBody = 'Test note body';
  let noteId;
  let tableAvailable = false;

  try {
    const tableCheck = await pool.query("SELECT to_regclass('public.case_notes') AS oid");
    if (!tableCheck.rows[0] || !tableCheck.rows[0].oid) {
      logFailure('case_notes table does not exist. Attempting to create it for this test run.');
      await pool.query(
        `CREATE TABLE IF NOT EXISTS case_notes (
           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
           case_id BIGINT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
           author_id UUID NOT NULL REFERENCES app_users(id),
           body TEXT NOT NULL,
           created_at TIMESTAMPTZ DEFAULT NOW()
         )`
      );
      await pool.query(
        `CREATE INDEX IF NOT EXISTS idx_case_notes_case_id_created_at
         ON case_notes(case_id, created_at DESC)`
      );
      logSuccess('Created case_notes table');
    }
    tableAvailable = true;

    await pool.query(
      `INSERT INTO cases (id, description)
       VALUES ($1, $2)
       ON CONFLICT (id) DO NOTHING`,
      [testCaseId, 'Case Notes Test Case'],
    );
    logSuccess(`Seeded case ${testCaseId}`);

    await pool.query(
      `INSERT INTO app_users (id, role, name, email)
       VALUES ($1, 'mediator', $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [authorId, 'Case Notes Tester', `tester+${Date.now()}@example.com`],
    );
    logSuccess(`Seeded app_user ${authorId}`);

    const insertNote = await pool.query(
      `INSERT INTO case_notes (case_id, author_id, body)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [testCaseId, authorId, noteBody],
    );
    noteId = insertNote.rows[0].id;
    logSuccess(`Inserted note ${noteId}`);

    const fetchNotes = await pool.query(
      `SELECT cn.id, cn.body, cn.created_at, au.name
       FROM case_notes cn
       JOIN app_users au ON au.id = cn.author_id
       WHERE cn.case_id = $1
       ORDER BY cn.created_at DESC`,
      [testCaseId],
    );

    if (fetchNotes.rowCount > 0) {
      logSuccess(`Fetched ${fetchNotes.rowCount} note(s)`);
      console.table(fetchNotes.rows);
    } else {
      logFailure('No notes returned for test case');
    }

    const deleteNote = await pool.query(
      `DELETE FROM case_notes WHERE id = $1 RETURNING id`,
      [noteId],
    );

    if (deleteNote.rowCount === 1) {
      logSuccess(`Deleted note ${noteId}`);
    } else {
      logFailure(`Failed to delete note ${noteId}`);
    }
  } catch (err) {
    logFailure('Test run failed', err);
  } finally {
    try {
      if (tableAvailable) {
        await pool.query('DELETE FROM case_notes WHERE case_id = $1', [testCaseId]);
      }
      await pool.query('DELETE FROM cases WHERE id = $1', [testCaseId]);
      await pool.query('DELETE FROM app_users WHERE id = $1', [authorId]);
      logSuccess('Cleaned up test data');
    } catch (cleanupErr) {
      logFailure('Cleanup failed', cleanupErr);
    }

    await pool.end();
  }
})();
