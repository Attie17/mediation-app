import dotenv from 'dotenv';
import pkg from 'pg';

const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase')
    ? { rejectUnauthorized: false }
    : undefined,
});

const caseId = parseInt(process.argv[2] || '4', 10);
const userId = process.argv[3] || '11111111-1111-4111-8111-111111111111';

const isActiveStatus = (status) => {
  if (!status) return true;
  return status === 'active';
};

(async () => {
  const client = await pool.connect();
  try {
    const membershipResult = await client.query(
      `SELECT role, status FROM case_participants WHERE case_id = $1 AND user_id = $2 LIMIT 1`,
      [caseId, userId]
    );
    console.log('membershipResult:', membershipResult.rows);

    const caseResult = await client.query(
      `SELECT id, status, created_at, mediator_id
       FROM cases WHERE id = $1`,
      [caseId]
    );
    console.log('caseResult:', caseResult.rows);

    const participantsResult = await client.query(
      `SELECT cp.user_id,
              cp.role,
              cp.status,
              cp.created_at,
              cp.updated_at,
              au.name,
              au.email
       FROM case_participants cp
       LEFT JOIN app_users au ON au.id = cp.user_id
       WHERE cp.case_id = $1
       ORDER BY cp.created_at ASC`,
      [caseId]
    );
    console.log('participantsResult:', participantsResult.rows.length);

    const notesResult = await client.query(
      `SELECT cn.id,
              cn.body,
              cn.created_at,
              cn.author_id,
              au.name AS author_name
       FROM case_notes cn
       LEFT JOIN app_users au ON au.id = cn.author_id
       WHERE cn.case_id = $1
       ORDER BY cn.created_at DESC
       LIMIT 5`,
      [caseId]
    );
    console.log('notesResult:', notesResult.rows.length);

    const uploadsResult = await client.query(
      `SELECT id, doc_type, status, created_at, updated_at, user_id, notes
       FROM uploads
       WHERE case_id = $1
       ORDER BY created_at DESC`,
      [caseId]
    );
    console.log('uploadsResult:', uploadsResult.rows.length);

    try {
      const requirementResult = await client.query(
        `SELECT id, case_id, doc_type, required, created_at, updated_at, deleted_at
         FROM case_requirements
         WHERE case_id = $1
         ORDER BY created_at ASC`,
        [caseId]
      );
      console.log('requirementsResult:', requirementResult.rows.length);
    } catch (err) {
      console.error('requirements query failed:', err.code, err.message);
    }
  } catch (err) {
    console.error('dashboard debug failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
})().catch((err) => {
  console.error('outer failure:', err);
  process.exit(1);
});
