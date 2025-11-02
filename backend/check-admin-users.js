import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkAdminUsers() {
  try {
    const result = await pool.query(
      `SELECT user_id, email, role, name, created_at 
       FROM app_users 
       WHERE role = 'admin' 
       ORDER BY created_at`
    );
    
    console.log('\n=== Admin Users ===');
    console.log(`Found ${result.rows.length} admin user(s):\n`);
    
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name || 'No name'}`);
      console.log(`   User ID: ${user.user_id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.created_at}`);
      console.log('');
    });
    
    if (result.rows.length === 0) {
      console.log('⚠️  No admin users found. Creating developer admin user...\n');
      
      const createResult = await pool.query(
        `INSERT INTO app_users (user_id, email, role, name)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO UPDATE 
         SET role = EXCLUDED.role
         RETURNING user_id, email, role, name`,
        [
          '862b3a3e-8390-57f8-a307-12004a341a2e',
          'admin@dev.local',
          'admin',
          'Dev Admin'
        ]
      );
      
      console.log('✅ Created admin user:');
      console.log(`   User ID: ${createResult.rows[0].user_id}`);
      console.log(`   Email: ${createResult.rows[0].email}`);
      console.log(`   Role: ${createResult.rows[0].role}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAdminUsers();
