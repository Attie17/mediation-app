import { pool } from './src/db.js';

async function checkEnumTypes() {
  try {
    const result = await pool.query(`
      SELECT 
        t.typname AS enum_name,
        e.enumlabel AS enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname LIKE '%chat%'
      ORDER BY t.typname, e.enumsortorder;
    `);
    
    console.log('Chat-related enum types:');
    let currentType = null;
    result.rows.forEach(row => {
      if (row.enum_name !== currentType) {
        currentType = row.enum_name;
        console.log(`\n${row.enum_name}:`);
      }
      console.log(`  - ${row.enum_value}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkEnumTypes();
