import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function applyMigration() {
  const client = await pool.connect();
  try {
    console.log('🔄 Applying mediation_sessions migration...');
    
    const sqlPath = join(__dirname, 'src', 'migrations', 'create_mediation_sessions.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    
    await client.query(sql);
    
    console.log('✅ Migration applied successfully!');
    console.log('📊 Table mediation_sessions created with indexes and triggers');
    
    // Verify table was created
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'mediation_sessions'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
