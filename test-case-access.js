import { pool } from './backend/src/db.js';

async function checkCaseAccess() {
  try {
    // Check case participants
    const caseResult = await pool.query(`
      SELECT 
        c.id,
        c.mediator_id,
        cp.user_id as participant_id,
        cp.role
      FROM cases c
      LEFT JOIN case_participants cp ON c.id = cp.case_id
      WHERE c.id::text = '3bcb2937-0e55-451a-a9fd-659187af84d4'
    `);
    
    console.log('\n📊 Case Participants:');
    console.log(JSON.stringify(caseResult.rows, null, 2));
    
    // Check if Bob has access
    const bobId = '22222222-2222-2222-2222-222222222222';
    const hasAccess = caseResult.rows.some(row => 
      row.mediator_id === bobId || row.participant_id === bobId
    );
    
    console.log(`\n✅ Bob (${bobId}) has access:`, hasAccess);
    
    // Try the actual access check query
    const accessCheck = await pool.query(`
      SELECT c.id 
      FROM cases c
      LEFT JOIN case_participants cp ON c.id = cp.case_id
      WHERE c.id::text = $1
      AND (c.mediator_id::text = $2 OR cp.user_id::text = $2)
    `, ['3bcb2937-0e55-451a-a9fd-659187af84d4', bobId]);
    
    console.log('\n🔍 Access Check Result:', accessCheck.rows.length > 0 ? 'GRANTED' : 'DENIED');
    console.log('Rows:', JSON.stringify(accessCheck.rows, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCaseAccess();
