import { pool } from './src/db.js';

const devUserId = '01234567-89ab-cdef-0123-456789abcdef';

try {
  console.log('Checking dev user access...');
  
  // Check if dev user exists in app_users
  const userResult = await pool.query('SELECT user_id, email, role FROM app_users WHERE user_id = $1', [devUserId]);
  console.log('Dev user in app_users:', userResult.rows);
  
  // Check case participation
  const participantResult = await pool.query(`
    SELECT cp.case_id, cp.role, c.title 
    FROM case_participants cp
    JOIN cases c ON cp.case_id = c.id
    WHERE cp.user_id = $1
  `, [devUserId]);
  console.log('Cases where dev user is participant:', participantResult.rows);
  
  // Check available chat channels
  const channelResult = await pool.query(`
    SELECT id, case_id, type, created_by
    FROM chat_channels 
    WHERE case_id IN (
      SELECT case_id FROM case_participants WHERE user_id = $1
    )
  `, [devUserId]);
  console.log('Chat channels dev user can access:', channelResult.rows);
  
  // Get the case_id from the channel we've been using
  const channelId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const channelInfo = await pool.query('SELECT case_id FROM chat_channels WHERE id = $1', [channelId]);
  console.log(`Channel ${channelId} belongs to case:`, channelInfo.rows);
  
} catch (err) {
  console.error('Error:', err.message);
}

pool.end();