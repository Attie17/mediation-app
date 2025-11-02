import pkg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function resetPassword() {
  try {
    const email = process.argv[2] || 'admin@accord.com';
    const newPassword = process.argv[3] || 'pass1234';
    
    console.log(`\n🔄 Resetting password for: ${email}`);
    console.log(`   New password: ${newPassword}\n`);
    
    // Hash the new password
    const hash = await bcrypt.hash(newPassword, 10);
    
    // Update the password in test_users
    const result = await pool.query(
      `UPDATE test_users 
       SET password_hash = $1, updated_at = NOW() 
       WHERE email = $2
       RETURNING email`,
      [hash, email]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found - cannot reset password');
      return;
    }
    
    console.log('✅ Password reset successfully!');
    console.log('\nYou can now log in with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

resetPassword();
