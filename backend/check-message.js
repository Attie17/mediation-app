import { pool } from './src/db.js';

const messageId = '7b621fb5-0115-4ae7-9f07-8ac0aa6fd857';

try {
  const result = await pool.query(
    'SELECT id, content, case_id, created_at FROM chat_messages WHERE id = $1', 
    [messageId]
  );
  
  if (result.rows.length > 0) {
    const msg = result.rows[0];
    console.log('Message Details:');
    console.log('  ID:', msg.id);
    console.log('  Case ID:', msg.case_id);
    console.log('  Content:', msg.content.substring(0, 50) + '...');
    console.log('  Created:', msg.created_at);
    
    if (msg.case_id) {
      console.log('\n✓ Message HAS case_id - AI processing should have been triggered');
    } else {
      console.log('\n✗ Message does NOT have case_id - AI processing was skipped');
    }
  } else {
    console.log('Message not found');
  }
} catch (err) {
  console.error('Error:', err.message);
}

pool.end();