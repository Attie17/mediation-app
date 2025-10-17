import { pool } from './src/db.js';

const devUserId = '01234567-89ab-cdef-0123-456789abcdef';
const devEmail = 'dev@example.com';

try {
  console.log('Setting up dev user for testing...');
  
  // Check if dev user exists
  const userResult = await pool.query('SELECT user_id, email, role FROM app_users WHERE user_id = $1', [devUserId]);
  
  if (userResult.rows.length === 0) {
    console.log('Dev user not found. Creating dev user...');
    
    // Create dev user
    await pool.query(`
      INSERT INTO app_users (user_id, email, role, name, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        name = EXCLUDED.name
    `, [devUserId, devEmail, 'mediator', 'Dev User']);
    
    console.log('✅ Dev user created');
  } else {
    console.log('✅ Dev user already exists:', userResult.rows[0]);
  }
  
  // Check case participation
  const participantResult = await pool.query(`
    SELECT cp.case_id, cp.role, c.id, c.description
    FROM case_participants cp
    JOIN cases c ON cp.case_id = c.id
    WHERE cp.user_id = $1
  `, [devUserId]);
  
  console.log('Cases where dev user is participant:', participantResult.rows);
  
  // Get the case_id from the channel we've been using
  const channelId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  const channelInfo = await pool.query('SELECT case_id FROM chat_channels WHERE id = $1', [channelId]);
  
  if (channelInfo.rows.length > 0) {
    const caseId = channelInfo.rows[0].case_id;
    console.log(`Channel ${channelId} belongs to case: ${caseId}`);
    
    // Check if dev user is a participant in this case
    const isParticipant = await pool.query(
      'SELECT role FROM case_participants WHERE user_id = $1 AND case_id = $2',
      [devUserId, caseId]
    );
    
    if (isParticipant.rows.length === 0) {
      console.log('Dev user is not a participant in this case. Adding as mediator...');
      
      await pool.query(`
        INSERT INTO case_participants (id, user_id, case_id, role, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3, NOW())
      `, [devUserId, caseId, 'mediator']);
      
      console.log('✅ Dev user added as case participant');
    } else {
      console.log('✅ Dev user is already a participant:', isParticipant.rows[0]);
    }
  }
  
  console.log('\n🎯 Dev user setup complete!');
  
} catch (err) {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
}

pool.end();