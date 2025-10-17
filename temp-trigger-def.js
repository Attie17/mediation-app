const { Client } = require('pg');

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(
    "SELECT tgname, pg_get_triggerdef(oid) AS definition FROM pg_trigger WHERE tgrelid = 'case_participants'::regclass AND NOT tgisinternal"
  );
  console.log(res.rows);
  await client.end();
})();
