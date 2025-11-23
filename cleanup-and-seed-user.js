/**
 * Cleanup and Seed Single Test User
 * 
 * This script:
 * 1. Deletes all users from app_users table
 * 2. Creates ONE reusable test user for development
 * 
 * Usage:
 *   node cleanup-and-seed-user.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend env
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Single reusable test user
const TEST_USER = {
  user_id: '11111111-1111-1111-1111-111111111111',
  email: 'test@mediation.app',
  name: 'Test User',
  role: 'mediator',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

async function cleanup() {
  console.log('🧹 Cleaning up all users...');
  
  try {
    // Delete all users
    const { error: deleteError } = await supabase
      .from('app_users')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000'); // Delete everything (this condition is always true)

    if (deleteError) {
      console.error('❌ Error deleting users:', deleteError.message);
      return false;
    }

    console.log('✅ All users deleted');
    return true;
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
    return false;
  }
}

async function seedTestUser() {
  console.log('🌱 Creating single test user...');
  
  try {
    const { data, error } = await supabase
      .from('app_users')
      .insert(TEST_USER)
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating test user:', error.message);
      return false;
    }

    console.log('✅ Test user created successfully!');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 USE THIS USER FOR ALL TESTING:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('  Email:    test@mediation.app');
    console.log('  User ID:  11111111-1111-1111-1111-111111111111');
    console.log('  Role:     mediator');
    console.log('  Name:     Test User');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('💡 To login in dev mode:');
    console.log('   1. Use dev-login.html');
    console.log('   2. Enter email: test@mediation.app');
    console.log('   3. The app will auto-generate a dev token');
    console.log('');
    
    return true;
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    return false;
  }
}

async function main() {
  console.log('');
  console.log('🚀 Starting cleanup and seed process...');
  console.log('');

  const cleanupSuccess = await cleanup();
  if (!cleanupSuccess) {
    console.log('');
    console.log('❌ Cleanup failed. Exiting.');
    process.exit(1);
  }

  console.log('');
  
  const seedSuccess = await seedTestUser();
  if (!seedSuccess) {
    console.log('');
    console.log('❌ Seed failed. Exiting.');
    process.exit(1);
  }

  console.log('✅ All done! Database is clean with one test user ready.');
  console.log('');
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
