import { pool } from './src/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyAIFKFix() {
  const client = await pool.connect();
  
  try {
    console.log('📦 Applying AI Insights Foreign Key Fix...\n');
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', '20251010_fix_ai_insights_fk.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute migration
    await client.query(migrationSQL);
    
    console.log('✅ Foreign key constraints updated!\n');
    
    // Verify new constraints
    const constraints = await client.query(`
      SELECT 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'ai_insights'
        AND kcu.column_name IN ('created_by', 'reviewed_by');
    `);
    
    console.log('✅ Updated foreign key constraints:');
    constraints.rows.forEach(constraint => {
      console.log(`   ${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
    });
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyAIFKFix();