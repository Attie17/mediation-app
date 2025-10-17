const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(
    "SELECT data_type FROM information_schema.columns WHERE table_name = 'case_participants' AND column_name = 'case_id'"
  );
  console.log(res.rows);
  await client.end();
})();
