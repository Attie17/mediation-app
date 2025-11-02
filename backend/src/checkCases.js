import { pool } from './db.js';

async function checkCases() {
  const columns = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'cases'
    ORDER BY ordinal_position
  `);
  console.log('Cases table columns:');
  columns.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));
  
  const sample = await pool.query(`SELECT * FROM cases LIMIT 1`);
  console.log('\nSample case:', sample.rows[0]);
  
  process.exit(0);
}

checkCases().catch(e => { console.error(e); process.exit(1); });
