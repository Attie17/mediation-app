/**
 * Run Full Organizations Migration
 * Executes the SQL file properly by splitting statements
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const connectionConfig = {
  connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

async function runFullMigration() {
  const client = new Client(connectionConfig);
  
  try {
    await client.connect();
    console.log('\n🚀 Starting Full Multi-Tenant Migration\n');
    console.log('='.repeat(60));
    
    // Read SQL file
    console.log('\n📄 Reading SQL migration file...');
    const sqlPath = path.join(__dirname, 'migrations', '001-create-organizations-schema.sql');
    const fullSQL = fs.readFileSync(sqlPath, 'utf8');
    console.log('✅ SQL file loaded (' + fullSQL.length + ' bytes)');
    
    // Execute as single transaction
    console.log('\n🔧 Running migration in transaction...');
    await client.query('BEGIN');
    
    try {
      // Execute the full SQL - this works with pg Client for multi-statement SQL
      await client.query(fullSQL);
      
      await client.query('COMMIT');
      console.log('✅ Migration completed successfully!');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
    // Verify results
    console.log('\n🔍 Verifying migration...');
    
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('organizations', 'subscription_plans', 'subscriptions', 'invoices', 'case_assignments')
      ORDER BY table_name
    `);
    
    console.log('✅ Tables created:');
    tables.rows.forEach(row => {
      console.log('   ✓ ' + row.table_name);
    });
    
    const plans = await client.query('SELECT COUNT(*) as count FROM subscription_plans');
    console.log(`✅ Subscription plans inserted: ${plans.rows[0].count}`);
    
    const orgCols = await client.query(`
      SELECT table_name 
      FROM information_schema.columns 
      WHERE column_name = 'organization_id' 
      AND table_schema = 'public'
      AND table_name IN ('app_users', 'cases', 'uploads')
      ORDER BY table_name
    `);
    
    console.log('✅ organization_id column added to:');
    orgCols.rows.forEach(row => {
      console.log('   ✓ ' + row.table_name);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📋 Next step: Run backfill script');
    console.log('Command: node migrations/002-backfill-organizations.js\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.message.includes('already exists')) {
      console.log('\n💡 Tables may already exist. This is OK if you ran this before.');
      console.log('   You can proceed to the backfill step.\n');
    } else {
      console.error('\nFull error:', error);
    }
  } finally {
    await client.end();
  }
}

runFullMigration();
