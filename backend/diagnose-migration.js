/**
 * Diagnose Migration Issue
 */

import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function diagnose() {
  try {
    console.log('\n🔍 Diagnosing database...\n');
    
    // Check UUID extension
    console.log('1. Checking UUID extension...');
    const ext = await pool.query(`
      SELECT extname, extversion FROM pg_extension WHERE extname = 'uuid-ossp';
    `);
    if (ext.rows.length > 0) {
      console.log('✅ uuid-ossp extension exists:', ext.rows[0].extversion);
    } else {
      console.log('⚠️  uuid-ossp extension NOT found - will try to create it');
      await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      console.log('✅ Created uuid-ossp extension');
    }
    
    // Check if tables already exist
    console.log('\n2. Checking existing tables...');
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('organizations', 'subscription_plans', 'subscriptions', 'invoices', 'case_assignments')
    `);
    
    if (tables.rows.length > 0) {
      console.log('⚠️  Some tables already exist:');
      tables.rows.forEach(t => console.log('   -', t.table_name));
      console.log('\n   These may need to be dropped first or migration will skip them.');
    } else {
      console.log('✅ No conflicting tables found');
    }
    
    // Check existing organization_id columns
    console.log('\n3. Checking for existing organization_id columns...');
    const cols = await pool.query(`
      SELECT table_name FROM information_schema.columns 
      WHERE column_name = 'organization_id' 
      AND table_schema = 'public'
    `);
    
    if (cols.rows.length > 0) {
      console.log('⚠️  organization_id already exists in:');
      cols.rows.forEach(c => console.log('   -', c.table_name));
    } else {
      console.log('✅ No existing organization_id columns');
    }
    
    // Test UUID generation
    console.log('\n4. Testing UUID generation...');
    const uuid = await pool.query('SELECT uuid_generate_v4() as id');
    console.log('✅ UUID generation works:', uuid.rows[0].id);
    
    console.log('\n✅ Database diagnostic complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

diagnose();
