import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkUser() {
  try {
    const emailToCheck = process.argv[2] || 'admin@accord.com';
    console.log(`\n🔍 Checking user: ${emailToCheck}\n`);
    
    // Check test_users table
    const testUsers = await pool.query(
      `SELECT email, password_hash, created_at FROM test_users WHERE email = $1`,
      [emailToCheck]
    );
    
    console.log('=== test_users table ===');
    if (testUsers.rows.length > 0) {
      console.log('✅ User found in test_users:');
      console.log('   Email:', testUsers.rows[0].email);
      console.log('   Has password hash:', testUsers.rows[0].password_hash ? 'Yes' : 'No');
      console.log('   Created:', testUsers.rows[0].created_at);
    } else {
      console.log('❌ User NOT found in test_users table');
    }
    
    // Check app_users table
    const appUsers = await pool.query(
      `SELECT user_id, email, role, name, created_at FROM app_users WHERE email = $1`,
      [emailToCheck]
    );
    
    console.log('\n=== app_users table ===');
    if (appUsers.rows.length > 0) {
      console.log('✅ User found in app_users:');
      console.log('   User ID:', appUsers.rows[0].user_id);
      console.log('   Email:', appUsers.rows[0].email);
      console.log('   Role:', appUsers.rows[0].role);
      console.log('   Name:', appUsers.rows[0].name);
      console.log('   Created:', appUsers.rows[0].created_at);
    } else {
      console.log('❌ User NOT found in app_users table');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUser();
