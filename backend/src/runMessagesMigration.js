import { pool } from './db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Running messages migration...');
    
    const migrationPath = path.join(__dirname, '../migrations/009_create_messages.sql');
    const sql = await fs.readFile(migrationPath, 'utf-8');
    
    await pool.query(sql);
    
    console.log('✅ Messages table created successfully!');
    
    // Verify table exists
    const check = await pool.query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'messages'
      )`
    );
    
    if (check.rows[0].exists) {
      console.log('✅ Verified: messages table exists');
      
      // Check for sample data
      const count = await pool.query('SELECT COUNT(*) FROM messages');
      console.log(`📊 Found ${count.rows[0].count} sample messages`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
