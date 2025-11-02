import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function ensureDevAdmin() {
  try {
    const result = await pool.query(
      `INSERT INTO app_users (user_id, email, role, name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) 
       DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name
       RETURNING *`,
      ['862b3a3e-8390-57f8-a307-12004a341a2e', 'admin@dev.local', 'admin', 'Dev Admin']
    );
    
    console.log('\n✅ Dev Admin User Ready:');
    console.log(`   User ID: ${result.rows[0].user_id}`);
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   Name: ${result.rows[0].name}`);
    console.log(`   Role: ${result.rows[0].role}`);
    console.log('\n🔑 To access admin dashboard:');
    console.log('   1. Open: http://localhost:5173/dev-login.html');
    console.log('   2. Click "Admin" role');
    console.log('   3. Click "Login as Developer"');
    console.log('   4. You will be redirected to admin dashboard\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

ensureDevAdmin();
