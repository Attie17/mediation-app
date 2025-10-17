const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(
    'SELECT id, mediator_id FROM cases WHERE id = $1',
    ['9102']
  );
  console.log(res.rows);
  await client.end();
})();
