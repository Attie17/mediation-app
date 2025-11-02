import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.kjmwaoainmyzbmvalizu:d8ScTSlTB6e5jmvS@aws-1-eu-west-2.pooler.supabase.com:6543/postgres'
});

const caseId = '3bcb2937-0e55-451a-a9fd-659187af84d4';
const bobUserId = '22222222-2222-2222-2222-222222222222';
const groupConvId = '0a690773-3da9-4577-8cc1-5e2ee79821de';

async function checkGroupConversation() {
  console.log('\n=== GROUP CONVERSATION DETAILS ===\n');
  
  try {
    // Get the exact query the API uses for participants
    const result = await pool.query(`
      SELECT 
        c.id,
        c.conversation_type,
        c.title,
        (
          SELECT json_agg(json_build_object(
            'user_id', u.user_id,
            'email', u.email,
            'role', u.role
          ))
          FROM conversation_participants cp
          JOIN app_users u ON cp.user_id = u.user_id
          WHERE cp.conversation_id = c.id
        ) as participants
      FROM conversations c
      WHERE c.id = $1
    `, [groupConvId]);
    
    if (result.rows.length === 0) {
      console.log('❌ Group conversation not found!');
      return;
    }
    
    const conv = result.rows[0];
    console.log(`Conversation: ${conv.title}`);
    console.log(`Type: ${conv.conversation_type}`);
    console.log(`ID: ${conv.id}\n`);
    
    console.log('Participants from API query:');
    console.log(JSON.stringify(conv.participants, null, 2));
    
    console.log(`\nTotal participants: ${conv.participants?.length || 0}`);
    
    // Also check conversation_participants table directly
    console.log('\n--- Direct query to conversation_participants ---');
    const directResult = await pool.query(`
      SELECT cp.user_id, u.email, u.role
      FROM conversation_participants cp
      JOIN app_users u ON cp.user_id = u.user_id
      WHERE cp.conversation_id = $1
      ORDER BY u.email
    `, [groupConvId]);
    
    console.log(`\nParticipants in database: ${directResult.rows.length}`);
    directResult.rows.forEach((p, i) => {
      const isBob = p.user_id === bobUserId;
      console.log(`${i + 1}. ${p.email} (${p.role})${isBob ? ' <- BOB' : ''}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkGroupConversation();
