import { pool } from './db.js';

async function checkTables() {
  const result = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'cases' AND column_name = 'id'
  `);
  console.log('Cases table id column:', result.rows);
  
  const cases = await pool.query(`SELECT id FROM cases LIMIT 1`);
  console.log('Sample case id:', cases.rows[0]);
  
  process.exit(0);
}

checkTables().catch(e => { console.error(e); process.exit(1); });
