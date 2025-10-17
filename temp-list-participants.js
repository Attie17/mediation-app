const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, 'backend', '.env') });
dotenv.config({ path: path.resolve(__dirname, 'tests', '.env') });

const caseId = process.env.TEMP_LIST_CASE_ID || 9102;

(async () => {
  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL environment variable.');
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, case_id, user_id, role, status
       FROM case_participants
       WHERE case_id = $1
       ORDER BY created_at DESC`,
      [caseId]
    );
    console.log(rows);
  } catch (error) {
    console.error('Failed to list participants', error);
  } finally {
    await client.end();
  }
})();
