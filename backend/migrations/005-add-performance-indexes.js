/**
 * Database Performance Optimization Migration
 * Adds indexes to frequently queried columns for better performance
 * 
 * Run with: node migrations/005-add-performance-indexes.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mediation_dev'
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
  console.log('Starting database performance optimization migration...\n');
    
    await client.query('BEGIN');
    
    // ========================================
    // APP_USERS TABLE INDEXES
    // ========================================
  console.log('Creating indexes on app_users table...');
    
    // Index on email for login lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_app_users_email 
      ON app_users(email);
    `);
  console.log('  [ok] idx_app_users_email');
    
    // Index on role for filtering users by role
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_app_users_role 
      ON app_users(role);
    `);
  console.log('  [ok] idx_app_users_role');
    
    // Index on organization_id for filtering users by organization
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_app_users_organization_id 
      ON app_users(organization_id) 
      WHERE organization_id IS NOT NULL;
    `);
  console.log('  [ok] idx_app_users_organization_id');
    
    // Index on created_at for sorting/filtering by date
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_app_users_created_at 
      ON app_users(created_at DESC);
    `);
  console.log('  [ok] idx_app_users_created_at\n');
    
    // ========================================
    // TEST_USERS TABLE INDEXES
    // ========================================
  console.log('Creating indexes on test_users table...');
    
    // Index on email for authentication
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_test_users_email 
      ON test_users(email);
    `);
  console.log('  [ok] idx_test_users_email\n');
    
    // ========================================
    // ORGANIZATIONS TABLE INDEXES
    // ========================================
  console.log('Creating indexes on organizations table...');
    
    // Index on subscription_status for filtering active orgs
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status 
      ON organizations(subscription_status);
    `);
  console.log('  [ok] idx_organizations_subscription_status');
    
    // Index on subscription_tier for filtering by plan
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_organizations_subscription_tier 
      ON organizations(subscription_tier);
    `);
  console.log('  [ok] idx_organizations_subscription_tier');
    
    // Index on created_at for sorting
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_organizations_created_at 
      ON organizations(created_at DESC);
    `);
  console.log('  [ok] idx_organizations_created_at');
    
    // Index on deleted_at for soft delete filtering
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_organizations_deleted_at 
      ON organizations(deleted_at) 
      WHERE deleted_at IS NULL;
    `);
  console.log('  [ok] idx_organizations_deleted_at\n');
    
    // ========================================
    // CASES TABLE INDEXES
    // ========================================
  console.log('Creating indexes on cases table...');
    
    // Index on organization_id for filtering cases by organization
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cases_organization_id 
      ON cases(organization_id) 
      WHERE organization_id IS NOT NULL;
    `);
  console.log('  [ok] idx_cases_organization_id');
    
    // Index on mediator_id for filtering cases by mediator
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cases_mediator_id 
      ON cases(mediator_id) 
      WHERE mediator_id IS NOT NULL;
    `);
  console.log('  [ok] idx_cases_mediator_id');
    
    // Index on status for filtering cases by status
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cases_status 
      ON cases(status);
    `);
  console.log('  [ok] idx_cases_status');
    
    // Composite index on organization_id + status for common queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cases_org_status 
      ON cases(organization_id, status) 
      WHERE organization_id IS NOT NULL;
    `);
  console.log('  [ok] idx_cases_org_status');
    
    // Index on created_at for sorting
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cases_created_at 
      ON cases(created_at DESC);
    `);
  console.log('  [ok] idx_cases_created_at');
    
    // Index on updated_at for recent activity
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_cases_updated_at 
      ON cases(updated_at DESC);
    `);
  console.log('  [ok] idx_cases_updated_at\n');
    
    // ========================================
    // UPLOADS TABLE INDEXES
    // ========================================
  console.log('Creating indexes on uploads table...');
    
    // Index on case_id for fetching case documents
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_uploads_case_id 
      ON uploads(case_id) 
      WHERE case_id IS NOT NULL;
    `);
  console.log('  [ok] idx_uploads_case_id');
    
    // Index on user_id for fetching user uploads
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_uploads_user_id 
      ON uploads(user_id) 
      WHERE user_id IS NOT NULL;
    `);
  console.log('  [ok] idx_uploads_user_id');
    
    // Index on status for filtering by upload status
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_uploads_status 
      ON uploads(status);
    `);
  console.log('  [ok] idx_uploads_status');
    
    // Index on created_at for sorting
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_uploads_created_at 
      ON uploads(created_at DESC);
    `);
  console.log('  [ok] idx_uploads_created_at\n');
    
    // ========================================
    // USER_INVITATIONS TABLE INDEXES
    // ========================================
  console.log('Creating indexes on user_invitations table...');
    
    // Index on token for invitation lookup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_invitations_token 
      ON user_invitations(token);
    `);
  console.log('  [ok] idx_user_invitations_token');
    
    // Index on organization_id for listing org invitations
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_invitations_organization_id 
      ON user_invitations(organization_id);
    `);
  console.log('  [ok] idx_user_invitations_organization_id');
    
    // Index on status for filtering by status
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_invitations_status 
      ON user_invitations(status);
    `);
  console.log('  [ok] idx_user_invitations_status');
    
    // Index on email for checking existing invitations
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_invitations_email 
      ON user_invitations(email);
    `);
  console.log('  [ok] idx_user_invitations_email');
    
    // Index on expires_at for cleanup and validation
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_user_invitations_expires_at 
      ON user_invitations(expires_at);
    `);
  console.log('  [ok] idx_user_invitations_expires_at\n');
    
    // ========================================
    // MESSAGES TABLE INDEXES (if exists)
    // ========================================
    const messagesTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'messages'
      );
    `);
    
    if (messagesTableCheck.rows[0].exists) {
  console.log('Creating indexes on messages table...');
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
        ON messages(conversation_id);
      `);
  console.log('  [ok] idx_messages_conversation_id');
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_messages_sender_id 
        ON messages(sender_id);
      `);
  console.log('  [ok] idx_messages_sender_id');
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_messages_created_at 
        ON messages(created_at DESC);
      `);
  console.log('  [ok] idx_messages_created_at\n');
    }
    
    // ========================================
    // SESSIONS TABLE INDEXES (if exists)
    // ========================================
    const sessionsTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sessions'
      );
    `);
    
    if (sessionsTableCheck.rows[0].exists) {
  console.log('Creating indexes on sessions table...');
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_sessions_case_id 
        ON sessions(case_id);
      `);
  console.log('  [ok] idx_sessions_case_id');
      
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_sessions_scheduled_at 
        ON sessions(scheduled_at);
      `);
  console.log('  [ok] idx_sessions_scheduled_at\n');
    }
    
    await client.query('COMMIT');
    
  console.log('Performance optimization migration completed successfully!\n');
  console.log('Performance improvements:');
  console.log('   - Faster user lookups by email, role, organization');
  console.log('   - Improved case filtering and sorting');
  console.log('   - Optimized document queries');
  console.log('   - Better invitation management');
  console.log('   - Enhanced message and session queries\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
  console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
