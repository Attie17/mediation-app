import { pool } from './src/db.js';

try {
  console.log('Checking chat channels...');
  const result = await pool.query('SELECT * FROM chat_channels LIMIT 5');
  console.log('Chat channels:', result.rows);
  
  if (result.rows.length === 0) {
    console.log('No channels found. Creating a test channel...');
    const newChannel = await pool.query(`
      INSERT INTO chat_channels (id, name, case_id, created_at) 
      VALUES (gen_random_uuid(), 'Test Channel', 'case-1', NOW()) 
      RETURNING id, name
    `);
    console.log('Created channel:', newChannel.rows[0]);
  } else {
    console.log('Using existing channel:', result.rows[0].id);
  }
} catch (err) {
  console.error('Error:', err.message);
}
pool.end();