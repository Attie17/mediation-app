import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.kjmwaoainmyzbmvalizu:d8ScTSlTB6e5jmvS@aws-1-eu-west-2.pooler.supabase.com:6543/postgres'
});

const caseId = '3bcb2937-0e55-451a-a9fd-659187af84d4';
const bobUserId = '22222222-2222-2222-2222-222222222222';

async function checkConversations() {
  console.log('\n=== CHECKING CONVERSATIONS ===\n');
  
  try {
    // Check all conversations for this case
    const conversationsResult = await pool.query(
      `SELECT id, conversation_type, title, created_at 
       FROM conversations 
       WHERE case_id = $1
       ORDER BY created_at`,
      [caseId]
    );
    
    console.log(`Total conversations for case: ${conversationsResult.rows.length}\n`);
    
    for (const conv of conversationsResult.rows) {
      console.log(`\n--- Conversation: ${conv.id} ---`);
      console.log(`Type: ${conv.conversation_type}`);
      console.log(`Title: ${conv.title}`);
      
      // Get participants for this conversation
      const participantsResult = await pool.query(
        `SELECT cp.user_id, u.email, u.role 
         FROM conversation_participants cp
         JOIN app_users u ON cp.user_id = u.user_id
         WHERE cp.conversation_id = $1`,
        [conv.id]
      );
      
      console.log(`Participants (${participantsResult.rows.length}):`);
      participantsResult.rows.forEach(p => {
        const isBob = p.user_id === bobUserId;
        console.log(`  - ${p.email} (${p.role})${isBob ? ' <- BOB' : ''}`);
      });
      
      // Check if Bob is in this conversation
      const bobInConv = participantsResult.rows.some(p => p.user_id === bobUserId);
      console.log(`Bob is participant: ${bobInConv ? 'YES ✓' : 'NO ✗'}`);
    }
    
    // Summary
    console.log('\n\n=== SUMMARY ===');
    const bobConversations = await pool.query(
      `SELECT c.id, c.conversation_type, c.title
       FROM conversations c
       JOIN conversation_participants cp ON c.id = cp.conversation_id
       WHERE c.case_id = $1 AND cp.user_id = $2`,
      [caseId, bobUserId]
    );
    
    console.log(`\nConversations Bob should see: ${bobConversations.rows.length}`);
    bobConversations.rows.forEach(c => {
      console.log(`  - ${c.conversation_type}: ${c.title}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkConversations();
