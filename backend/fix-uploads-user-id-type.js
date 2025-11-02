import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function diagnosisAndFix() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  UPLOADS TABLE SCHEMA FIX - Complete Diagnosis');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Check current schema
    console.log('📋 STEP 1: Current Schema');
    console.log('─────────────────────────────────────────────────────────');
    const schemaCheck = await pool.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'uploads' AND column_name IN ('user_id', 'id', 'case_id')
      ORDER BY column_name
    `);
    schemaCheck.rows.forEach(col => {
      console.log(`  ${col.column_name.padEnd(15)}: ${col.data_type.padEnd(20)} (${col.udt_name})`);
    });

    // Step 2: Check data count
    console.log('\n📊 STEP 2: Data Check');
    console.log('─────────────────────────────────────────────────────────');
    const countCheck = await pool.query('SELECT COUNT(*) as count FROM uploads');
    const uploadCount = parseInt(countCheck.rows[0].count);
    console.log(`  Total uploads in table: ${uploadCount}`);

    if (uploadCount > 0) {
      const sampleData = await pool.query('SELECT id, user_id, case_id, doc_type FROM uploads LIMIT 5');
      console.log('\n  Sample data:');
      sampleData.rows.forEach((row, i) => {
        console.log(`    ${i + 1}. ID: ${row.id}, user_id: ${row.user_id}, case_id: ${row.case_id}`);
      });
    }

    // Step 3: Apply fix
    console.log('\n🔧 STEP 3: Applying Schema Fix');
    console.log('─────────────────────────────────────────────────────────');

    if (uploadCount === 0) {
      console.log('  Table is empty - safe to change type directly');
      console.log('  Executing: ALTER TABLE uploads ALTER COLUMN user_id TYPE UUID...');
      
      await pool.query(`
        ALTER TABLE uploads ALTER COLUMN user_id TYPE UUID 
        USING CASE 
          WHEN user_id IS NULL THEN NULL
          ELSE user_id::text::uuid 
        END
      `);
      
      console.log('  ✅ Successfully changed user_id to UUID type');
    } else {
      console.log('  ⚠️  Table has data - using safe migration...');
      
      // Add new column
      console.log('  1. Adding user_id_new column...');
      await pool.query('ALTER TABLE uploads ADD COLUMN IF NOT EXISTS user_id_new UUID');
      
      // Migrate data
      console.log('  2. Migrating data...');
      const migrateResult = await pool.query(`
        UPDATE uploads 
        SET user_id_new = user_id::text::uuid 
        WHERE user_id IS NOT NULL
      `);
      console.log(`     Migrated ${migrateResult.rowCount} rows`);
      
      // Drop old column
      console.log('  3. Dropping old user_id column...');
      await pool.query('ALTER TABLE uploads DROP COLUMN user_id');
      
      // Rename new column
      console.log('  4. Renaming user_id_new to user_id...');
      await pool.query('ALTER TABLE uploads RENAME COLUMN user_id_new TO user_id');
      
      console.log('  ✅ Successfully migrated user_id to UUID type');
    }

    // Step 4: Add foreign key constraint
    console.log('\n🔗 STEP 4: Adding Foreign Key Constraint');
    console.log('─────────────────────────────────────────────────────────');
    try {
      await pool.query(`
        ALTER TABLE uploads 
        DROP CONSTRAINT IF EXISTS fk_uploads_user
      `);
      
      await pool.query(`
        ALTER TABLE uploads 
        ADD CONSTRAINT fk_uploads_user 
        FOREIGN KEY (user_id) 
        REFERENCES app_users(user_id)
        ON DELETE CASCADE
      `);
      console.log('  ✅ Foreign key constraint added');
    } catch (fkError) {
      console.log('  ⚠️  Could not add foreign key:', fkError.message);
      console.log('     (This is optional - system will still work)');
    }

    // Step 5: Verify
    console.log('\n✅ STEP 5: Verification');
    console.log('─────────────────────────────────────────────────────────');
    const verifySchema = await pool.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'uploads' AND column_name = 'user_id'
    `);
    const finalType = verifySchema.rows[0];
    console.log(`  user_id type: ${finalType.data_type} (${finalType.udt_name})`);
    
    if (finalType.udt_name === 'uuid') {
      console.log('\n🎉 SUCCESS! Schema fix applied successfully!');
      console.log('   uploads.user_id is now UUID type, matching app_users.user_id');
      console.log('\n📝 Next step: Refresh the frontend - error should be gone!');
    } else {
      console.log('\n❌ PROBLEM: Type is still not UUID!');
      console.log(`   Current type: ${finalType.data_type} (${finalType.udt_name})`);
    }

  } catch (error) {
    console.error('\n❌ ERROR during fix:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    if (error.detail) console.error('   Detail:', error.detail);
    if (error.hint) console.error('   Hint:', error.hint);
  } finally {
    await pool.end();
  }
}

diagnosisAndFix().catch(console.error);
