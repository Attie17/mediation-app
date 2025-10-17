import { pool } from './src/db.js';

(async () => {
  try {
    const result = await pool.query(`
      INSERT INTO public.chat_messages (
        channel_id,
        sender_id,
        sender_role,
        content,
        case_id,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, sender_role
    `, [
      'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      '11111111-2222-3333-4444-555555555555',
      'mediator',
      'Direct DB test message',
      4
    ]);
    
    console.log('✅ Insert successful!');
    console.log('Message ID:', result.rows[0].id);
    console.log('Sender role:', result.rows[0].sender_role);
    
  } catch (err) {
    console.error('❌ Insert failed:');
    console.error('Error:', err.message);
    console.error('Detail:', err.detail);
    console.error('Hint:', err.hint);
  } finally {
    await pool.end();
  }
})();
