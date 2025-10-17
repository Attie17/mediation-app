// Windows-friendly SQL migration runner using pg Pool
// Usage: node backend/scripts/run-sql.js backend/migrations/20251007_test_users_password_hash.sql
import fs from 'fs';
import { Pool } from 'pg';
import path from 'path';
import url from 'url';
import dotenv from 'dotenv';

// Load env (relative to backend directory)
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const file = process.argv[2];
if (!file) {
  console.error('❌ Provide a SQL file: node backend/scripts/run-sql.js <path-to-sql>');
  process.exit(1);
}

const sqlPath = path.resolve(process.cwd(), file);
if (!fs.existsSync(sqlPath)) {
  console.error('❌ SQL file not found:', sqlPath);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');

function getSSL() {
  return process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false };
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: getSSL() });

(async () => {
  console.log('🛠️  Applying migration:', sqlPath);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('✅ Migration applied');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', e.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
})();
