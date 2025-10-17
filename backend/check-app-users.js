import { pool } from './src/db.js';

async function checkAppUsersAndAccess() {
  try {
    const devUserId = 'd6864fbd-1637-5644-bfb0-20acdcc8692d';
    const testCaseId = '0782ec41-1250-41c6-9c38-764f1139e8f1';
    
    console.log('Checking app_users table and access...\n');
    
    // Check app_users schema
    const schema = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'app_users'
      ORDER BY ordinal_position;
    `);
    
    console.log('app_users schema:');
    schema.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    // Check if our dev user exists in app_users
    const userCheck = await pool.query('SELECT * FROM app_users WHERE user_id = $1', [devUserId]);
    console.log(`\nDev user exists in app_users:`, userCheck.rows.length > 0);
    if (userCheck.rows.length > 0) {
      console.log('User details:', userCheck.rows[0]);
    }
    
    // Check if case exists
    const caseCheck = await pool.query('SELECT id FROM cases WHERE id = $1', [testCaseId]);
    console.log(`\nTest case exists:`, caseCheck.rows.length > 0);
    
    // Check case participants
    const participantCheck = await pool.query(
      'SELECT user_id FROM case_participants WHERE case_id = $1', 
      [testCaseId]
    );
    console.log(`Case participants: ${participantCheck.rows.length}`);
    participantCheck.rows.forEach(p => {
      console.log(`  - User: ${p.user_id}`);
    });
    
    // Check if dev user has case access
    const accessCheck = await pool.query(
      'SELECT 1 FROM case_participants WHERE case_id = $1 AND user_id = $2',
      [testCaseId, devUserId]
    );
    console.log(`\nDev user has case access:`, accessCheck.rows.length > 0);
    
    console.log('\n--- FIXES NEEDED ---');
    if (userCheck.rows.length === 0) {
      console.log('1. Create dev user in app_users table');
    }
    if (accessCheck.rows.length === 0) {
      console.log('2. Add dev user to case_participants');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAppUsersAndAccess();