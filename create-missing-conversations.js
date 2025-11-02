import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.kjmwaoainmyzbmvalizu:d8ScTSlTB6e5jmvS@aws-1-eu-west-2.pooler.supabase.com:6543/postgres'
});

const caseId = '3bcb2937-0e55-451a-a9fd-659187af84d4';

async function createMissingConversations() {
  console.log('\n=== CREATING MISSING CONVERSATIONS ===\n');
  
  try {
    // Get all participants
    const participantsResult = await pool.query(
      `SELECT user_id, role FROM case_participants WHERE case_id = $1`,
      [caseId]
    );
    
    const participants = participantsResult.rows;
    const divorcees = participants.filter(p => p.role === 'divorcee');
    const mediators = participants.filter(p => p.role === 'mediator');
    
    console.log(`Participants: ${participants.length}`);
    console.log(`  Divorcees: ${divorcees.length}`);
    console.log(`  Mediators: ${mediators.length}\n`);
    
    // Check existing conversations
    const existingResult = await pool.query(
      `SELECT conversation_type FROM conversations WHERE case_id = $1`,
      [caseId]
    );
    
    const existingTypes = existingResult.rows.map(r => r.conversation_type);
    console.log(`Existing conversations: ${existingTypes.join(', ')}\n`);
    
    // Create divorcee_to_divorcee if missing
    if (!existingTypes.includes('divorcee_to_divorcee') && divorcees.length === 2) {
      console.log('Creating divorcee_to_divorcee conversation...');
      await pool.query('BEGIN');
      
      const convResult = await pool.query(`
        INSERT INTO conversations (case_id, conversation_type, title, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id
      `, [caseId, 'divorcee_to_divorcee', 'Private Discussion']);
      
      const conversationId = convResult.rows[0].id;
      
      for (const divorcee of divorcees) {
        await pool.query(`
          INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
          VALUES ($1, $2, NOW())
        `, [conversationId, divorcee.user_id]);
      }
      
      await pool.query('COMMIT');
      console.log(`✅ Created divorcee_to_divorcee: ${conversationId}\n`);
    }
    
    // Create group conversation if missing
    if (!existingTypes.includes('group') && participants.length >= 2) {
      console.log('Creating group conversation...');
      await pool.query('BEGIN');
      
      const convResult = await pool.query(`
        INSERT INTO conversations (case_id, conversation_type, title, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id
      `, [caseId, 'group', 'All Participants']);
      
      const conversationId = convResult.rows[0].id;
      
      for (const participant of participants) {
        await pool.query(`
          INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
          VALUES ($1, $2, NOW())
        `, [conversationId, participant.user_id]);
      }
      
      await pool.query('COMMIT');
      console.log(`✅ Created group conversation: ${conversationId}\n`);
    }
    
    // Show final state
    const finalResult = await pool.query(
      `SELECT id, conversation_type, title FROM conversations WHERE case_id = $1`,
      [caseId]
    );
    
    console.log('\nFinal conversations:');
    finalResult.rows.forEach(c => {
      console.log(`  - ${c.conversation_type}: ${c.title} (${c.id})`);
    });
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

createMissingConversations();
