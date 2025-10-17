import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query(`
  SELECT tablename 
  FROM pg_tables 
  WHERE schemaname = 'public' 
  ORDER BY tablename
`)
.then(result => {
  console.log('\n📋 Available tables:');
  result.rows.forEach(row => console.log('  -', row.tablename));
  pool.end();
})
.catch(err => {
  console.error('Error:', err.message);
  pool.end();
  process.exit(1);
});
