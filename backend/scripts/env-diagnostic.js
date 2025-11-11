// Quick environment diagnostic for backend startup issues
// Usage (PowerShell): node scripts/env-diagnostic.js
import 'dotenv/config';
import { Pool } from 'pg';

const keys = [
  'NODE_ENV',
  'HOST', 'PORT',
  'DATABASE_URL',
  'JWT_SECRET', 'SESSION_SECRET',
  'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY', 'SUPABASE_JWT_SECRET',
  'FRONTEND_URL',
  'ENABLE_DEV_MODE', 'DEV_AUTH_ENABLED'
];

function mask(val) {
  if (!val) return 'MISSING';
  const s = String(val);
  if (s.length <= 8) return '[set]';
  return s.slice(0, 4) + '...' + s.slice(-4);
}

console.log('\n=== ENV PRESENCE CHECK ===');
for (const k of keys) {
  console.log(`${k} = ${mask(process.env[k])}`);
}

async function checkDb() {
  console.log('\n=== DB CONNECT CHECK ===');
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: /supabase|pooler/.test(process.env.DATABASE_URL || '') ? { rejectUnauthorized: false } : undefined });
    const start = Date.now();
    const { rows } = await pool.query('SELECT 1 as ok');
    console.log('DB OK:', rows[0]?.ok === 1, `(${Date.now() - start}ms)`);
    await pool.end();
  } catch (err) {
    console.error('DB ERROR:', err.message);
    process.exitCode = 1;
  }
}

await checkDb();
console.log('\nDone.');
