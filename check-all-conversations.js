const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.kjmwaoainmyzbmvalizu:d8ScTSlTB6e5jmvS@aws-1-eu-west-2.pooler.supabase.com:6543/postgres'
});

async function checkConversations() {
  const caseId = '3bcb2937-0e55-451a-a9fd-659187af84d4';
  const bobId = '22222222-2222-2222-2222-222222222222';

  console.log('Checking all conversations for Bob\'s case:\n');

  // Get all conversations for this case
  const result = await pool.query(`
    SELECT 
      c.id,
      c.conversation_type,
      c.title,
      json_agg(json_build_object(
        'user_id', u.user_id,
        'email', u.email,
        'role', u.role
      )) as participants
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    JOIN app_users u ON cp.user_id = u.user_id
    WHERE c.case_id::text = $1
    GROUP BY c.id
    ORDER BY c.conversation_type
  `, [caseId]);

  console.log(`Found ${result.rows.length} conversations:\n`);

  result.rows.forEach((conv, idx) => {
    console.log(`${idx + 1}. ${conv.conversation_type}`);
    console.log(`   Title: ${conv.title}`);
    console.log(`   ID: ${conv.id}`);
    console.log(`   Participants:`);
    conv.participants.forEach(p => {
      console.log(`     - ${p.email} (${p.role})`);
    });
    
    // Check if Bob is a participant
    const bobIsParticipant = conv.participants.some(p => p.user_id === bobId);
    console.log(`   Bob is participant: ${bobIsParticipant ? '✅ YES' : '❌ NO'}`);
    console.log('');
  });

  // Check conversations Bob should see
  console.log('\n--- Conversations Bob should see (where he is a participant) ---\n');
  
  const bobConvs = await pool.query(`
    SELECT 
      c.id,
      c.conversation_type,
      c.title
    FROM conversations c
    JOIN conversation_participants cp ON c.id = cp.conversation_id
    WHERE c.case_id::text = $1
    AND cp.user_id::text = $2
    ORDER BY c.conversation_type
  `, [caseId, bobId]);

  console.log(`Bob can see ${bobConvs.rows.length} conversations:`);
  bobConvs.rows.forEach(conv => {
    console.log(`  - ${conv.conversation_type}: ${conv.title}`);
  });

  pool.end();
}

checkConversations().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
