const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(
     'SELECT id, case_id, user_id FROM case_participants WHERE case_id = $1 AND id = $2',
     [9102, '6750b742-4bce-458d-a02c-953daa8ca32a']
  );
  console.log(res.rows);
  await client.end();
})();
