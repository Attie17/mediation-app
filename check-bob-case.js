import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.kjmwaoainmyzbmvalizu:d8ScTSlTB6e5jmvS@aws-1-eu-west-2.pooler.supabase.com:6543/postgres'
});

const bobCaseId = '3bcb2937-0e55-451a-a9fd-659187af84d4';
const bobUserId = '22222222-2222-2222-2222-222222222222';

async function checkBobCase() {
  console.log('\n=== CHECKING BOB\'S CASE ===\n');
  
  try {
    // Check if case exists
    const caseResult = await pool.query(
      `SELECT * FROM cases WHERE id = $1`,
      [bobCaseId]
    );
    
    if (caseResult.rows.length === 0) {
      console.log('❌ Case does NOT exist!');
      console.log(`   Case ID: ${bobCaseId}`);
    } else {
      console.log('✓ Case exists');
      console.log(`   ID: ${caseResult.rows[0].id}`);
      console.log(`   Status: ${caseResult.rows[0].status}`);
      console.log(`   Mediator: ${caseResult.rows[0].mediator_id}`);
    }
    
    // Check case participants
    console.log('\n--- Case Participants ---');
    const participantsResult = await pool.query(
      `SELECT cp.user_id, u.email, u.role, cp.role as case_role
       FROM case_participants cp
       JOIN app_users u ON cp.user_id = u.user_id
       WHERE cp.case_id = $1`,
      [bobCaseId]
    );
    
    if (participantsResult.rows.length === 0) {
      console.log('No participants found');
    } else {
      participantsResult.rows.forEach(p => {
        const isBob = p.user_id === bobUserId;
        console.log(`  - ${p.email} (${p.case_role})${isBob ? ' <- BOB' : ''}`);
      });
    }
    
    // Check if Bob exists as a user
    console.log('\n--- Bob as User ---');
    const bobResult = await pool.query(
      `SELECT user_id, email, role FROM app_users WHERE user_id = $1`,
      [bobUserId]
    );
    
    if (bobResult.rows.length === 0) {
      console.log('❌ Bob does NOT exist in app_users!');
    } else {
      console.log('✓ Bob exists');
      console.log(`   Email: ${bobResult.rows[0].email}`);
      console.log(`   Role: ${bobResult.rows[0].role}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkBobCase();
