import { pool } from './src/db.js';

async function setupDevUserForAI() {
  try {
    const devUserId = 'd6864fbd-1637-5644-bfb0-20acdcc8692d';
    const testCaseId = '0782ec41-1250-41c6-9c38-764f1139e8f1';
    
    console.log('Setting up dev user for AI testing...\n');
    
    // 1. Create dev user in app_users if not exists
    const userExists = await pool.query('SELECT 1 FROM app_users WHERE user_id = $1', [devUserId]);
    
    if (userExists.rows.length === 0) {
      await pool.query(`
        INSERT INTO app_users (user_id, email, name, role, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [devUserId, 'mediator@example.com', 'Test Mediator', 'mediator']);
      
      console.log('✅ Created dev user in app_users');
    } else {
      console.log('✅ Dev user already exists in app_users');
    }
    
    // 2. Add dev user to case participants if not exists
    const participantExists = await pool.query(
      'SELECT 1 FROM case_participants WHERE case_id = $1 AND user_id = $2',
      [testCaseId, devUserId]
    );
    
    if (participantExists.rows.length === 0) {
      await pool.query(`
        INSERT INTO case_participants (case_id, user_id, role, created_at)
        VALUES ($1, $2, $3, NOW())
      `, [testCaseId, devUserId, 'mediator']);
      
      console.log('✅ Added dev user to case participants');
    } else {
      console.log('✅ Dev user already has case access');
    }
    
    // 3. Verify setup
    console.log('\n--- VERIFICATION ---');
    
    const userCheck = await pool.query('SELECT email, name, role FROM app_users WHERE user_id = $1', [devUserId]);
    console.log('User in app_users:', userCheck.rows[0]);
    
    const accessCheck = await pool.query(`
      SELECT cp.role, au.name 
      FROM case_participants cp
      JOIN app_users au ON cp.user_id = au.user_id
      WHERE cp.case_id = $1 AND cp.user_id = $2
    `, [testCaseId, devUserId]);
    console.log('Case access:', accessCheck.rows[0]);
    
    console.log('\n🎉 Dev user setup complete! AI tests should now work.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

setupDevUserForAI();