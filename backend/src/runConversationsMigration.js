// Run the conversations migration
import { pool } from './db.js';

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting conversations migration...\n');
    
    // Read migration file
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    
    const migrationPath = path.join(__dirname, '../migrations/010_create_conversations.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing migration SQL...\n');
    
    // Execute migration
    await client.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Show results
    const conversationsResult = await client.query('SELECT COUNT(*) as count FROM conversations');
    const participantsResult = await client.query('SELECT COUNT(*) as count FROM conversation_participants');
    const messagesResult = await client.query('SELECT COUNT(*) as count FROM messages WHERE conversation_id IS NOT NULL');
    
    console.log('📊 Migration Summary:');
    console.log(`   - Conversations created: ${conversationsResult.rows[0].count}`);
    console.log(`   - Participants added: ${participantsResult.rows[0].count}`);
    console.log(`   - Messages migrated: ${messagesResult.rows[0].count}`);
    console.log('');
    
    // Show sample conversations
    const sampleConvs = await client.query(`
      SELECT c.id, c.conversation_type, c.title, 
             (SELECT COUNT(*) FROM conversation_participants WHERE conversation_id = c.id) as participant_count,
             (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
      FROM conversations c
      ORDER BY c.created_at DESC
      LIMIT 5
    `);
    
    if (sampleConvs.rows.length > 0) {
      console.log('📋 Sample Conversations:');
      sampleConvs.rows.forEach((conv, idx) => {
        console.log(`   ${idx + 1}. ${conv.conversation_type} - "${conv.title}"`);
        console.log(`      Participants: ${conv.participant_count}, Messages: ${conv.message_count}`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
