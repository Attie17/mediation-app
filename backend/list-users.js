import { pool } from './src/db.js';

const res = await pool.query('SELECT email, role FROM app_users ORDER BY created_at LIMIT 10');
console.log('\nAvailable users:');
res.rows.forEach(r => console.log(`  ${(r.email || 'null').padEnd(30)} - ${r.role}`));
await pool.end();
