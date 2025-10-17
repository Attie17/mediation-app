import { pool } from './src/db.js';

console.log('Testing insert into chat_messages...');
try {
  const testUserId = '01234567-89ab-cdef-0123-456789abcdef';
  const result = await pool.query(`
    INSERT INTO public.chat_messages (
      channel_id,
      sender_id, 
      sender_role,
      content,
      case_id,
      created_at
    ) VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING id, content
  `, ['channel-1', testUserId, 'mediator', 'test message', null]);
  console.log('✅ Insert successful:', result.rows[0]);
} catch (err) {
  console.error('❌ Insert failed:', err.message);
  console.error('Error detail:', err.detail);
  console.error('Error code:', err.code);
}
pool.end();