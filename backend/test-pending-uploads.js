import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const mediatorId = '44d32632-d369-5263-9111-334e03253f94';

async function run() {
  const casesResult = await pool.query(`SELECT id as case_id FROM cases WHERE mediator_id = $1`, [mediatorId]);
  console.log('Cases:', casesResult.rows);
  if (casesResult.rows.length === 0) return;
  const caseIds = casesResult.rows.map(r => r.case_id);
  console.log('Case IDs JS array:', caseIds);
  const { rows } = await pool.query(
    `SELECT u.id, u.case_id, u.user_id, u.status
     FROM uploads u
     WHERE u.case_id = ANY($1::uuid[])
       AND u.status = 'pending'
     ORDER BY u.uploaded_at DESC
     LIMIT 50`,
    [caseIds]
  );
  console.log('Uploads rows:', rows);
  await pool.end();
}

run().catch(err => { console.error(err); pool.end(); });
