import pkg from 'pg';
const {Pool} = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({connectionString: process.env.SUPABASE_DB_URL});

const result = await pool.query(`
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'cases' 
  ORDER BY ordinal_position
`);

console.log('Cases table columns:');
result.rows.forEach(r => console.log('  -', r.column_name));

await pool.end();
