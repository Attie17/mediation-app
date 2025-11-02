import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.kjmwaoainmyzbmvalizu:d8ScTSlTB6e5jmvS@aws-1-eu-west-2.pooler.supabase.com:6543/postgres'
});

const caseId = '3bcb2937-0e55-451a-a9fd-659187af84d4';

async function checkUsers() {
  console.log('\n=== CHECKING CASE PARTICIPANTS ===\n');
  
  try {
    // Check all participants in this case
    const participantsResult = await pool.query(
      `SELECT p.user_id, u.email, u.role as user_role, p.role as case_role
       FROM case_participants p
       JOIN app_users u ON p.user_id = u.user_id
       WHERE p.case_id = $1
       ORDER BY p.role, u.email`,
      [caseId]
    );
    
    console.log(`Total participants in case: ${participantsResult.rows.length}\n`);
    
    participantsResult.rows.forEach(p => {
      console.log(`- ${p.email}`);
      console.log(`  User Role: ${p.user_role}`);
      console.log(`  Case Role: ${p.case_role}`);
      console.log(`  ID: ${p.user_id}\n`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
