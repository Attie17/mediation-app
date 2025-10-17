const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(
    'SELECT id, case_id, user_id, role, status FROM case_participants WHERE case_id = $1 AND user_id = $2',
    ['9102', '91029102-0000-4000-8000-000000000001']
  );
  console.log(res.rows);
  await client.end();
})();
