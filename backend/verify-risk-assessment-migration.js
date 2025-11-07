// Verify risk_assessment column in database
import { pool } from './src/db.js';

async function verifyMigration() {
  try {
    console.log('🔍 Verifying risk_assessment migration...\n');
    
    // Check column exists
    const columnCheck = await pool.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'app_users' 
      AND column_name = 'risk_assessment'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('❌ Column not found!');
      await pool.end();
      return false;
    }
    
    console.log('✅ Column exists in app_users table');
    console.log('   Name:', columnCheck.rows[0].column_name);
    console.log('   Type:', columnCheck.rows[0].data_type);
    console.log('   Nullable:', columnCheck.rows[0].is_nullable);
    
    // Check index exists
    const indexCheck = await pool.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'app_users' 
      AND indexname = 'idx_app_users_risk_assessment'
    `);
    
    if (indexCheck.rows.length > 0) {
      console.log('\n✅ GIN index exists');
      console.log('   Name:', indexCheck.rows[0].indexname);
    } else {
      console.log('\n⚠️  GIN index not found (optional but recommended)');
    }
    
    // Check if any data exists
    const dataCheck = await pool.query(`
      SELECT COUNT(*) as total,
             COUNT(risk_assessment) as with_assessment
      FROM app_users
    `);
    
    console.log('\n📊 Database Stats:');
    console.log('   Total users:', dataCheck.rows[0].total);
    console.log('   With assessments:', dataCheck.rows[0].with_assessment);
    
    // Show sample structure (if any exists)
    const sampleCheck = await pool.query(`
      SELECT risk_assessment
      FROM app_users
      WHERE risk_assessment IS NOT NULL
      LIMIT 1
    `);
    
    if (sampleCheck.rows.length > 0) {
      console.log('\n📋 Sample Assessment Structure:');
      const sample = sampleCheck.rows[0].risk_assessment;
      console.log('   IPV Flags:', sample.ipvFlags);
      console.log('   Power Imbalance:', sample.powerImbalance);
      console.log('   Suitability:', sample.suitability);
      console.log('   Recommendation:', sample.recommendation);
    }
    
    console.log('\n✅ Migration verification complete!');
    console.log('✅ Database is ready for risk assessment feature');
    
    await pool.end();
    return true;
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    await pool.end();
    return false;
  }
}

verifyMigration()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
