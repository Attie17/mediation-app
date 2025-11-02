import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkParticipants() {
  try {
    console.log('📊 case_participants table structure:\n');
    
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'case_participants'
      ORDER BY ordinal_position
    `);
    
    columns.rows.forEach(c => {
      console.log(`  ${c.column_name}: ${c.data_type}${c.is_nullable === 'NO' ? ' (NOT NULL)' : ''}`);
    });
    
    console.log('\n🔍 Checking constraints:');
    const constraints = await pool.query(`
      SELECT con.conname, pg_get_constraintdef(con.oid) AS definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'case_participants'
    `);
    
    constraints.rows.forEach(c => {
      console.log(`\n  ${c.conname}:`);
      console.log(`    ${c.definition}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkParticipants();
