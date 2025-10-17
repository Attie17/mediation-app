import { pool } from './src/db.js';

async function seedChatChannel() {
  try {
    const testCaseId = '0782ec41-1250-41c6-9c38-764f1139e8f1';
    const testChannelId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const testUserId = '11111111-2222-3333-4444-555555555555'; // mediator from devAuth
    
    // Check if channel already exists
    const existing = await pool.query(
      'SELECT id FROM chat_channels WHERE id = $1',
      [testChannelId]
    );
    
    if (existing.rows.length > 0) {
      console.log('✅ Test channel already exists:', testChannelId);
    } else {
      // Insert test channel
      const result = await pool.query(`
        INSERT INTO chat_channels (id, case_id, type, created_by, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `, [testChannelId, testCaseId, 'mediator_divorcees', testUserId]);
      
      console.log('✅ Created test channel:', result.rows[0].id);
      console.log('   Case ID:', result.rows[0].case_id);
      console.log('   Type:', result.rows[0].type);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Detail:', error.detail);
  } finally {
    await pool.end();
  }
}

seedChatChannel();
