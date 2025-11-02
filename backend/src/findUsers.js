import { pool } from './db.js';

async function findTestUsers() {
  console.log('Looking for test users...');
  
  const bob = await pool.query(`SELECT user_id, email, role FROM app_users WHERE email = 'bob@example.com'`);
  console.log('Bob:', bob.rows[0] || 'NOT FOUND');
  
  const mediator = await pool.query(`SELECT user_id, email, role FROM app_users WHERE role = 'mediator' LIMIT 1`);
  console.log('Mediator:', mediator.rows[0] || 'NOT FOUND');
  
  const case4 = await pool.query(`SELECT id, divorcee_id, mediator_id FROM cases WHERE id::text LIKE '%4%' LIMIT 1`);
  console.log('Case:', case4.rows[0] || 'NOT FOUND');
  
  process.exit(0);
}

findTestUsers().catch(e => { console.error(e); process.exit(1); });
