import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkEnums() {
  try {
    const result = await pool.query(`
      SELECT unnest(enum_range(NULL::case_status))::text as status
    `);
    console.log('Valid case_status values:');
    result.rows.forEach(r => console.log(`  - ${r.status}`));
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkEnums();
