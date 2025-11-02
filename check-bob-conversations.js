const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.kjmwaoainmyzbmvalizu:d8ScTSlTB6e5jmvS@aws-1-eu-west-2.pooler.supabase.com:6543/postgres'
});

async function checkConversations() {
  const caseId = '3bcb2937-0e55-451a-a9fd-659187af84d4';
  const userId = '22222222-2222-2222-2222-222222222222';

  console.log('Checking conversations for:');
  console.log('  Case:', caseId);
  console.log('  User:', userId);
  console.log('');

  // Check if user is participant in the case
  const access = await pool.query(`
    SELECT c.id
    FROM cases c
    LEFT JOIN case_participants cp ON c.id = cp.case_id
    WHERE c.id::text = $1
    AND cp.user_id::text = $2
  `, [caseId, userId]);

  console.log('Access check:', access.rows.length > 0 ? '✅ YES' : '❌ NO');
  console.log('');

  // Get conversations
  const result = await pool.query(`
    SELECT c.id, c.conversation_type, c.title, cp.user_id
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    WHERE c.case_id::text = $1
    AND cp.user_id::text = $2
    ORDER BY c.conversation_type
  `, [caseId, userId]);

  console.log('Conversations found:', result.rows.length);
  result.rows.forEach(row => {
    console.log(`  - ${row.conversation_type}: ${row.title || 'Untitled'}`);
    console.log(`    ID: ${row.id}`);
  });

  pool.end();
}

checkConversations().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
