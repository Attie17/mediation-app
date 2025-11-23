/**
 * Cleanup and Seed Single Test User (Direct PostgreSQL)
 * 
 * Usage: node cleanup-users-pg.js
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const { Client } = pg;

const TEST_USER = {
  user_id: '11111111-1111-1111-1111-111111111111',
  email: 'test@mediation.app',
  name: 'Test Developer',
  role: 'admin'
};

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected');

    // Temporarily disable triggers to allow cleanup
    console.log('🧹 Cleaning up all data...');
    await client.query('SET session_replication_role = replica');
    
    // Delete cases and users
    const casesResult = await client.query('DELETE FROM cases');
    console.log(`✅ Deleted ${casesResult.rowCount} cases`);
    
    const usersResult = await client.query('DELETE FROM app_users');
    console.log(`✅ Deleted ${usersResult.rowCount} users`);
    
    // Re-enable triggers
    await client.query('SET session_replication_role = DEFAULT');

    // Insert test user
    console.log('🌱 Creating test user...');
    await client.query(
      `INSERT INTO app_users (user_id, email, name, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [TEST_USER.user_id, TEST_USER.email, TEST_USER.name, TEST_USER.role]
    );
    console.log('✅ Test user created');

    console.log('\n✨ DONE! You can now use:');
    console.log('   Email: test@mediation.app');
    console.log('   ID: 11111111-1111-1111-1111-111111111111');
    console.log('   Role: admin (full access to all dashboards)');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
