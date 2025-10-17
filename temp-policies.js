const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(
    "SELECT policyname, permissive, roles, qual, with_check FROM pg_policies WHERE tablename = 'case_participants'"
  );
  console.log(res.rows);
  await client.end();
})();
