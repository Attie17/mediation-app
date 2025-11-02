import { pool } from './src/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createNotificationsTable() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'src/migrations/create_notifications.sql'),
      'utf8'
    );
    
    await pool.query(sql);
    console.log('✅ Notifications table created successfully');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating notifications table:', err.message);
    process.exit(1);
  }
}

createNotificationsTable();
