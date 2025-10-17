import { pool } from './src/db.js';

async function checkAIInsightsForeignKeys() {
  try {
    // Check foreign key constraints on ai_insights table
    const constraints = await pool.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'ai_insights';
    `);
    
    console.log('ai_insights foreign key constraints:');
    constraints.rows.forEach(constraint => {
      console.log(`  ${constraint.constraint_name}:`);
      console.log(`    ${constraint.table_name}.${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
    });
    
    // Check if users table has our dev user
    const devUserId = 'd6864fbd-1637-5644-bfb0-20acdcc8692d';
    const userInUsersTable = await pool.query('SELECT id FROM users WHERE id = $1', [devUserId]);
    console.log(`\nDev user exists in users table: ${userInUsersTable.rows.length > 0}`);
    
    const userInAppUsersTable = await pool.query('SELECT user_id FROM app_users WHERE user_id = $1', [devUserId]);
    console.log(`Dev user exists in app_users table: ${userInAppUsersTable.rows.length > 0}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAIInsightsForeignKeys();