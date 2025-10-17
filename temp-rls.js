const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(
    "SELECT relrowsecurity, relforcerowsecurity FROM pg_class WHERE relname = 'case_participants'"
  );
  console.log(res.rows);
  await client.end();
})();
