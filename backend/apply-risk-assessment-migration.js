// Apply risk_assessment migration to database
import { pool } from './src/db.js';

async function applyMigration() {
  try {
    console.log('🔄 Applying risk_assessment migration...');
    
    // Add column
    await pool.query(`
      ALTER TABLE app_users 
      ADD COLUMN IF NOT EXISTS risk_assessment JSONB
    `);
    console.log('✅ Added risk_assessment column');
    
    // Add index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_app_users_risk_assessment 
      ON app_users USING GIN (risk_assessment)
    `);
    console.log('✅ Added GIN index');
    
    // Verify
    const result = await pool.query(`
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
      console.log('❌ Column not found after migration');
    }
    
    await pool.end();
    console.log('\n✅ Migration complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

applyMigration();
