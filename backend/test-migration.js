/**
 * Test Organizations Migration
 * Simple script to run the SQL migration and backfill
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  console.log('\n🚀 Starting Multi-Tenant Migration Test\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Read and run SQL migration
    console.log('\n📄 Step 1: Reading SQL migration file...');
    const sqlPath = path.join(__dirname, 'migrations', '001-create-organizations-schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('✅ SQL file loaded (' + sql.length + ' bytes)');
    
    console.log('\n🔧 Step 2: Running SQL migration...');
    await pool.query(sql);
    console.log('✅ SQL migration completed successfully');
    
    // Step 3: Verify tables were created
    console.log('\n🔍 Step 3: Verifying tables...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('organizations', 'subscription_plans', 'subscriptions', 'invoices', 'case_assignments')
      ORDER BY table_name
    `);
    
    console.log('✅ Found tables:');
    tables.rows.forEach(row => {
      console.log('   - ' + row.table_name);
    });
    
    // Step 4: Check if organization_id columns were added
    console.log('\n🔍 Step 4: Checking organization_id columns...');
    const columns = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE column_name = 'organization_id' 
      AND table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('✅ organization_id added to:');
    columns.rows.forEach(row => {
      console.log('   - ' + row.table_name);
    });
    
    // Step 5: Check subscription plans
    console.log('\n🔍 Step 5: Checking subscription plans...');
    const plans = await pool.query('SELECT name, display_name, price_monthly_cents FROM subscription_plans ORDER BY price_monthly_cents');
    console.log('✅ Subscription plans:');
    plans.rows.forEach(plan => {
      const price = (plan.price_monthly_cents / 100).toFixed(2);
      console.log(`   - ${plan.display_name} (${plan.name}): R${price}/month`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION TEST COMPLETE!');
    console.log('='.repeat(60));
    console.log('\nNext step: Run the backfill script');
    console.log('Command: node backend/migrations/002-backfill-organizations.js\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
