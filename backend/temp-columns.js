import dotenv from 'dotenv';
import pkg from 'pg';

const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase')
    ? { rejectUnauthorized: false }
    : undefined,
});

const table = process.argv[2] || 'case_requirements';

(async () => {
  const result = await pool.query(
    `SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [table]
  );
  console.log(result.rows);
  await pool.end();
})().catch((err) => {
  console.error('Column lookup failed:', err);
  process.exit(1);
});
