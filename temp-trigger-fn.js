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
  const res = await client.query(
    "SELECT pg_get_functiondef('enforce_mediator_constraint'::regproc) AS definition"
  );
  console.log(res.rows[0].definition);
  await client.end();
})();
