import { pool } from './src/db.js';

const { rows } = await pool.query('SELECT id, description, status FROM public.cases ORDER BY created_at DESC LIMIT 5');
console.log('\nCases in database:');
rows.forEach(r => console.log(`  ID: ${r.id}  Status: ${r.status}  Description: ${r.description || '(no description)'}`));
pool.end();
