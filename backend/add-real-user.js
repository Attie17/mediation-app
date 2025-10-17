import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const userId = '862b3a3e-8390-57f8-a307-12004a341a2e';
const caseId = '0782ec41-1250-41c6-9c38-764f1139e8f1';

console.log('Adding real user to app_users and case_participants...\n');

// Add to app_users
try {
  await pool.query(
    `INSERT INTO app_users (user_id, email, role, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, 'real-user@example.com', 'mediator']
  );
  console.log('✅ Added user to app_users (or already exists)');
} catch (err) {
  console.error('❌ Failed to add to app_users:', err.message);
}

// Add to case_participants (check if already exists first)
try {
  const check = await pool.query(
    `SELECT * FROM case_participants WHERE case_id = $1 AND user_id = $2`,
    [caseId, userId]
  );
  
  if (check.rows.length === 0) {
    await pool.query(
      `INSERT INTO case_participants (case_id, user_id, role, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [caseId, userId, 'mediator']
    );
    console.log('✅ Added user as case participant');
  } else {
    console.log('✅ User already a case participant');
  }
} catch (err) {
  console.error('❌ Failed to add to case_participants:', err.message);
}

console.log('\n✅ Setup complete!');
await pool.end();
