import pkg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testLogin() {
  try {
    const email = 'admin@accord.com';
    const password = 'pass1234';
    
    console.log(`\n🔐 Testing login for: ${email}`);
    console.log(`   Password: ${password}\n`);
    
    // Check test_users table
    const result = await pool.query(
      `SELECT email, password_hash FROM test_users WHERE email = $1`,
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found in test_users table');
      console.log('\n💡 You need to register first. Use the Register page in the app.');
      return;
    }
    
    const user = result.rows[0];
    console.log('✅ User found in database');
    console.log(`   Email: ${user.email}`);
    console.log(`   Has password hash: ${user.password_hash ? 'Yes' : 'No'}`);
    
    if (!user.password_hash) {
      console.log('\n❌ No password hash found - registration may have failed');
      return;
    }
    
    // Test password
    const isValid = await bcrypt.compare(password, user.password_hash);
    
    if (isValid) {
      console.log('\n✅ PASSWORD MATCH! Login should work.');
    } else {
      console.log('\n❌ PASSWORD DOES NOT MATCH!');
      console.log('   The password you entered does not match what was registered.');
      console.log('   Either:');
      console.log('   1. You registered with a different password');
      console.log('   2. Or registration failed to save the password');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testLogin();
