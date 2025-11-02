import { pool } from './src/db.js';

const email = process.argv[2] || 'ceo@stabilistc.co.za';

try {
  const userRes = await pool.query(
    `SELECT user_id, email, role, organization_id, name 
     FROM app_users WHERE email = $1`,
    [email]
  );
  
  if (userRes.rows.length === 0) {
    console.log(`❌ User NOT FOUND: ${email}`);
  } else {
    const user = userRes.rows[0];
    console.log(`\n✓ User:`, user);
    
    if (user.organization_id) {
      const orgRes = await pool.query(
        `SELECT * FROM organizations WHERE id = $1`,
        [user.organization_id]
      );
      
      if (orgRes.rows.length > 0) {
        console.log(`\n✓ Organization:`, orgRes.rows[0]);
      } else {
        console.log(`\n⚠️  Organization ID exists but organization not found: ${user.organization_id}`);
      }
    } else {
      console.log(`\n⚠️  User has no organization_id`);
    }
  }
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await pool.end();
}
