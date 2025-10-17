import { pool } from './src/db.js';

async function checkUserAndCaseAccess() {
  try {
    const devUserId = 'd6864fbd-1637-5644-bfb0-20acdcc8692d'; // From devAuth
    const testCaseId = '0782ec41-1250-41c6-9c38-764f1139e8f1';
    
    console.log('Checking user and case access...\n');
    
    // Check if user exists in users table
    const userCheck = await pool.query('SELECT id, email, role FROM users WHERE id = $1', [devUserId]);
    console.log('User exists in users table:', userCheck.rows.length > 0);
    if (userCheck.rows.length > 0) {
      console.log('User details:', userCheck.rows[0]);
    }
    
    // Check if case exists
    const caseCheck = await pool.query('SELECT id FROM cases WHERE id = $1', [testCaseId]);
    console.log('\nCase exists:', caseCheck.rows.length > 0);
    
    // Check case participants
    const participantCheck = await pool.query(
      'SELECT user_id, case_id FROM case_participants WHERE case_id = $1', 
      [testCaseId]
    );
    console.log('Case participants:', participantCheck.rows.length);
    participantCheck.rows.forEach(p => {
      console.log(`  - User: ${p.user_id}`);
    });
    
    // Check if our dev user has access to this case
    const accessCheck = await pool.query(
      'SELECT 1 FROM case_participants WHERE case_id = $1 AND user_id = $2',
      [testCaseId, devUserId]
    );
    console.log('\nDev user has case access:', accessCheck.rows.length > 0);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserAndCaseAccess();