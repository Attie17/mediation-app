import { pool } from './src/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyAIMigration() {
  const client = await pool.connect();
  
  try {
    console.log('📦 Applying AI Insights migration...\n');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '20251010_create_ai_insights.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration applied successfully!\n');
    
    // Verify table creation
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_insights'
      );
    `);
    
    console.log('✅ ai_insights table exists:', tableCheck.rows[0].exists);
    
    // Verify enum creation
    const enumCheck = await client.query(`
      SELECT enumlabel FROM pg_enum
      WHERE enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'ai_insight_type'
      )
      ORDER BY enumsortorder;
    `);
    
    console.log('\n✅ ai_insight_type enum values:');
    enumCheck.rows.forEach(row => console.log(`   - ${row.enumlabel}`));
    
    // Get table schema
    const schemaCheck = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ai_insights'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Table schema:');
    schemaCheck.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.detail) console.error('   Detail:', error.detail);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyAIMigration();
