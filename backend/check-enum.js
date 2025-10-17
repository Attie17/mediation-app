import { pool } from './src/db.js';

(async () => {
  try {
    // Check sender_role enum values
    const enumCheck = await pool.query(`
      SELECT e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname = 'user_role'
      ORDER BY e.enumsortorder;
    `);
    
    console.log('✅ user_role enum values:');
    enumCheck.rows.forEach(row => {
      console.log(`  - ${row.enum_value}`);
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
})();
