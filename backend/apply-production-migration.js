// Apply risk_assessment migration to PRODUCTION database
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from current directory
dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;

// Production database connection (using Supabase)
const productionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function applyProductionMigration() {
  try {
    console.log('🚀 Applying risk_assessment migration to PRODUCTION database...\n');
    console.log('⚠️  WARNING: This will modify the production database!');
    console.log('Database:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'unknown');
    console.log('');
    
    // Add column
    console.log('1️⃣ Adding risk_assessment column...');
    await productionPool.query(`
      ALTER TABLE app_users 
      ADD COLUMN IF NOT EXISTS risk_assessment JSONB
    `);
    console.log('✅ Column added successfully');
    
    // Add index
    console.log('\n2️⃣ Creating GIN index for performance...');
    await productionPool.query(`
      CREATE INDEX IF NOT EXISTS idx_app_users_risk_assessment 
      ON app_users USING GIN (risk_assessment)
    `);
    console.log('✅ Index created successfully');
    
    // Add comment
    console.log('\n3️⃣ Adding column documentation...');
    await productionPool.query(`
      COMMENT ON COLUMN app_users.risk_assessment IS 
      'JSONB object containing IPV screening results and risk scores'
    `);
    console.log('✅ Documentation added');
    
    // Verify
    console.log('\n4️⃣ Verifying migration...');
    const result = await productionPool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'app_users' 
      AND column_name = 'risk_assessment'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Migration verified:');
      console.log('   Column:', result.rows[0].column_name);
      console.log('   Type:', result.rows[0].data_type);
      console.log('   Nullable:', result.rows[0].is_nullable);
    } else {
      throw new Error('Column not found after migration');
    }
    
    // Check index
    const indexResult = await productionPool.query(`
      SELECT indexname
      FROM pg_indexes 
      WHERE tablename = 'app_users' 
      AND indexname = 'idx_app_users_risk_assessment'
    `);
    
    if (indexResult.rows.length > 0) {
      console.log('✅ Index verified:', indexResult.rows[0].indexname);
    }
    
    await productionPool.end();
    console.log('\n✅ PRODUCTION MIGRATION COMPLETE!');
    console.log('✅ Database is ready for deployment\n');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ PRODUCTION MIGRATION FAILED:', error.message);
    console.error('Stack:', error.stack);
    await productionPool.end();
    process.exit(1);
  }
}

applyProductionMigration();
