import { pool } from './src/db.js';

async function checkChatChannels() {
  try {
    // Check if chat_channels table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_channels'
      );
    `);
    
    console.log('chat_channels table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Get schema
      const schema = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'chat_channels'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nSchema:');
      schema.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
      
      // Get any existing channels
      const channels = await pool.query('SELECT * FROM chat_channels LIMIT 5');
      console.log(`\nExisting channels: ${channels.rows.length}`);
      if (channels.rows.length > 0) {
        channels.rows.forEach(ch => {
          console.log(`  - ID: ${ch.id}, Case: ${ch.case_id}, Created: ${ch.created_at}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkChatChannels();
