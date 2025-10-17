import { pool } from './src/db.js';

async function checkColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'case_participants'
      ORDER BY ordinal_position
    `);
    
    console.log('case_participants columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkColumns();
