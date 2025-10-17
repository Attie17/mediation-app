import { pool } from './src/db.js';

async function checkUsersTableSchema() {
  try {
    // Check users table schema
    const schema = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('Users table schema:');
    schema.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check what tables exist that might contain users
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' 
      AND table_name LIKE '%user%'
      ORDER BY table_name;
    `);
    
    console.log('\nUser-related tables:');
    tables.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Sample data from users table
    const sampleUsers = await pool.query('SELECT * FROM users LIMIT 3');
    console.log('\nSample users:');
    sampleUsers.rows.forEach(user => {
      console.log(`  ${JSON.stringify(user)}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersTableSchema();