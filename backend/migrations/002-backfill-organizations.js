/**
 * Backfill Organizations for Existing Data
 * 
 * This script creates a default organization for all existing data
 * and links all current users, cases, and uploads to it.
 * 
 * Run this AFTER running 001-create-organizations-schema.sql
 */

import dotenv from 'dotenv';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function backfillOrganizations() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting organization backfill migration...\n');
    
    await client.query('BEGIN');
    
    // Step 1: Create default organization
    console.log('Step 1: Creating default organization...');
    const defaultOrgResult = await client.query(`
      INSERT INTO organizations (
        name,
        display_name,
        subscription_tier,
        subscription_status,
        max_active_cases,
        max_mediators,
        storage_limit_mb,
        trial_ends_at
      ) VALUES (
        'Default Organization',
        'Default Mediation Practice',
        'pro',
        'active',
        1000,
        10,
        50000,
        NOW() + INTERVAL '1 year'
      )
      ON CONFLICT DO NOTHING
      RETURNING id, name
    `);
    
    const defaultOrgId = defaultOrgResult.rows[0]?.id;
    
    if (!defaultOrgId) {
      throw new Error('Failed to create default organization');
    }
    
    console.log(`✅ Created organization: ${defaultOrgResult.rows[0].name} (${defaultOrgId})\n`);
    
    // Step 2: Link all existing users to default organization
    console.log('Step 2: Linking users to default organization...');
    const usersResult = await client.query(`
      UPDATE app_users
      SET organization_id = $1
      WHERE organization_id IS NULL
      RETURNING user_id, email, role
    `, [defaultOrgId]);
    
    console.log(`✅ Linked ${usersResult.rowCount} users to default organization`);
    usersResult.rows.slice(0, 5).forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });
    if (usersResult.rowCount > 5) {
      console.log(`   ... and ${usersResult.rowCount - 5} more users`);
    }
    console.log('');
    
    // Step 3: Link all existing cases to default organization
    console.log('Step 3: Linking cases to default organization...');
    const casesResult = await client.query(`
      UPDATE cases
      SET organization_id = $1
      WHERE organization_id IS NULL
      RETURNING id
    `, [defaultOrgId]);
    
    console.log(`✅ Linked ${casesResult.rowCount} cases to default organization`);
    console.log('');
    
    // Step 4: Link all existing uploads to default organization
    console.log('Step 4: Linking uploads to default organization...');
    const uploadsResult = await client.query(`
      UPDATE uploads
      SET organization_id = $1
      WHERE organization_id IS NULL
      RETURNING id
    `, [defaultOrgId]);
    
    console.log(`✅ Linked ${uploadsResult.rowCount} uploads to default organization`);
    console.log('');
    
    // Step 5: Calculate and update storage usage for default org
    console.log('Step 5: Calculating storage usage...');
    // Skip storage calculation for now - column names vary
    const storageMb = 0;
    
    await client.query(`
      UPDATE organizations
      SET storage_used_mb = $1
      WHERE id = $2
    `, [storageMb, defaultOrgId]);
    
    console.log(`✅ Storage usage set to ${storageMb} MB (will be calculated later)\n`);
    
    // Step 6: Create default subscription
    console.log('Step 6: Creating default subscription...');
    
    // Get pro plan ID
    const planResult = await client.query(`
      SELECT id FROM subscription_plans WHERE name = 'pro' LIMIT 1
    `);
    
    if (planResult.rows.length > 0) {
      const planId = planResult.rows[0].id;
      
      await client.query(`
        INSERT INTO subscriptions (
          organization_id,
          plan_id,
          billing_cycle,
          amount_cents,
          currency,
          status,
          current_period_start,
          current_period_end,
          payment_provider
        ) VALUES (
          $1,
          $2,
          'annual',
          999000,
          'ZAR',
          'active',
          CURRENT_DATE,
          CURRENT_DATE + INTERVAL '1 year',
          'manual'
        )
        ON CONFLICT DO NOTHING
      `, [defaultOrgId, planId]);
      
      console.log(`✅ Created Pro annual subscription for default organization\n`);
    }
    
    // Step 7: Summary
    console.log('Step 7: Migration Summary');
    const summary = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM organizations) as total_organizations,
        (SELECT COUNT(*) FROM app_users WHERE organization_id = $1) as linked_users,
        (SELECT COUNT(*) FROM cases WHERE organization_id = $1) as linked_cases,
        (SELECT COUNT(*) FROM uploads WHERE organization_id = $1) as linked_uploads,
        (SELECT COUNT(*) FROM subscriptions WHERE organization_id = $1) as subscriptions
    `, [defaultOrgId]);
    
    const stats = summary.rows[0];
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('                  MIGRATION COMPLETE                    ');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Organizations Created:  ${stats.total_organizations}`);
    console.log(`  Users Linked:           ${stats.linked_users}`);
    console.log(`  Cases Linked:           ${stats.linked_cases}`);
    console.log(`  Uploads Linked:         ${stats.linked_uploads}`);
    console.log(`  Subscriptions Created:  ${stats.subscriptions}`);
    console.log(`  Storage Usage:          ${storageMb} MB`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('✅ All existing data has been linked to the default organization');
    console.log('✅ Your app will continue to work exactly as before');
    console.log('✅ You can now create additional organizations for multi-tenant setup');
    console.log('');
    
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
backfillOrganizations()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
