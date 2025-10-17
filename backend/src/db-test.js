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

try {
  const url = new URL(process.env.DATABASE_URL || '');
  console.log('DB host:', url.host);
} catch {
  console.log('DB URL not set/parsable');
}

(async () => {
  try {
    const result = await pool.query('select now()');
    console.log('✅ Connected! Supabase says:', result.rows[0]);
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
  } finally {
    await pool.end();
  }
})();