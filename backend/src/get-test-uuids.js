import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import pkg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
  const userRes = await pool.query('SELECT id FROM app_users LIMIT 1;');
    const caseRes = await pool.query('SELECT id FROM cases LIMIT 1;');
    console.log('User UUID:', userRes.rows[0]?.id || 'No user found');
    console.log('Case UUID:', caseRes.rows[0]?.id || 'No case found');
  } catch (err) {
    console.error('❌ DB query failed:', err.message);
  } finally {
    await pool.end();
  }
})();
