import { pool } from './src/db.js';

const tables = ['uploads', 'chat_messages', 'notifications', 'documents', 'cases'];

for (const table of tables) {
  try {
    const { rows } = await pool.query(
      `SELECT column_name FROM information_schema.columns 
       WHERE table_name = $1 AND table_schema = 'public' 
       ORDER BY ordinal_position`,
      [table]
    );
    console.log(`\n${table}:`, rows.map(r => r.column_name).join(', '));
  } catch (e) {
    console.log(`\n${table}: ERROR -`, e.message);
  }
}

pool.end();
