/**
 * Test SQL Migration Step by Step
 */

import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testStepByStep() {
  try {
    console.log('\n🧪 Testing migration step-by-step...\n');
    
    // Step 1: Organizations table
    console.log('1. Creating organizations table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        subscription_tier TEXT DEFAULT 'trial',
        subscription_status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ organizations table created');
    
    // Step 2: Subscription plans table
    console.log('\n2. Creating subscription_plans table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        price_monthly_cents INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ subscription_plans table created');
    
    // Step 3: Subscriptions table with foreign keys
    console.log('\n3. Creating subscriptions table with foreign keys...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        plan_id UUID NOT NULL REFERENCES subscription_plans(id),
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ subscriptions table created with foreign keys!');
    
    console.log('\n✅ All test tables created successfully!');
    console.log('\nThe migration SQL is valid. Ready to run full migration.\n');
    
  } catch (error) {
    console.error('\n❌ Error at step:', error.message);
    console.error('Details:', error);
  } finally {
    await pool.end();
  }
}

testStepByStep();
