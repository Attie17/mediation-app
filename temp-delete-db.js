const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, 'backend', '.env') });
dotenv.config({ path: path.resolve(__dirname, 'tests', '.env') });

(async () => {
  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL environment variable.');
    process.exit(1);
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    const res = await client.query(
      `DELETE FROM case_participants
       WHERE case_id = $1
         AND (id = $2::uuid OR user_id = $2::uuid)
       RETURNING id, user_id`,
      [9102, '6750b742-4bce-458d-a02c-953daa8ca32a']
    );
    console.log('deleted', res.rows);
  } finally {
    await client.end();
  }
})();
