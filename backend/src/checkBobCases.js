import { pool } from './db.js';

async function checkBobCases() {
  try {
    const bobId = '22222222-2222-2222-2222-222222222222';
    
    console.log('Checking cases for Bob...\n');
    
    const result = await pool.query(`
      SELECT 
        c.id,
        c.status,
        c.mediator_id,
        cp.user_id as participant_user_id,
        cp.role as participant_role
      FROM cases c
      LEFT JOIN case_participants cp ON c.id = cp.case_id
      WHERE cp.user_id = $1 OR c.mediator_id = $1
    `, [bobId]);
    
    console.log('Cases Bob is part of:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBobCases();
