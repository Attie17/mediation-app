/**
 * Clean up test tables before real migration
 */

import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function cleanup() {
  try {
    console.log('\n🧹 Cleaning up test tables...\n');
    
    await pool.query('DROP TABLE IF EXISTS subscriptions CASCADE');
    console.log('✅ Dropped subscriptions');
    
    await pool.query('DROP TABLE IF EXISTS subscription_plans CASCADE');
    console.log('✅ Dropped subscription_plans');
    
    await pool.query('DROP TABLE IF EXISTS organizations CASCADE');
    console.log('✅ Dropped organizations');
    
    console.log('\n✅ Cleanup complete! Ready for fresh migration.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

cleanup();
