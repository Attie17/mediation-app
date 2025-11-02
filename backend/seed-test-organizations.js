#!/usr/bin/env node
/**
 * Seed test organizations for development
 * Usage: node seed-test-organizations.js
 */

import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

// Use DATABASE_URL from .env or fallback to localhost
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mediation_dev';

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : false
});

const organizations = [
  {
    id: 'b325cbce-0a4c-4658-ac15-f6b4e8bbe62e',
    name: 'default-organization',
    display_name: 'Default Mediation Services',
    email: 'contact@defaultmediation.com',
    phone: '+27 11 123 4567',
    subscription_tier: 'pro',
    subscription_status: 'active',
    trial_ends_at: null,
    max_active_cases: 50,
    max_mediators: 10,
    storage_limit_mb: 5000,
    storage_used_mb: 120,
    website: 'https://defaultmediation.com',
    address: '123 Main Street, Johannesburg, 2000, South Africa',
    logo_url: null
  },
  {
    id: 'a1111111-1111-1111-1111-111111111111',
    name: 'family-matters-mediation',
    display_name: 'Family Matters Mediation',
    email: 'info@familymatters.co.za',
    phone: '+27 21 555 0001',
    subscription_tier: 'enterprise',
    subscription_status: 'active',
    trial_ends_at: null,
    max_active_cases: 100,
    max_mediators: 25,
    storage_limit_mb: 10000,
    storage_used_mb: 450,
    website: 'https://familymatters.co.za',
    address: '456 Long Street, Cape Town, 8001, South Africa',
    logo_url: null
  },
  {
    id: 'a2222222-2222-2222-2222-222222222222',
    name: 'quick-resolve',
    display_name: 'Quick Resolve Mediation Centre',
    email: 'hello@quickresolve.co.za',
    phone: '+27 31 555 0002',
    subscription_tier: 'basic',
    subscription_status: 'active',
    trial_ends_at: null,
    max_active_cases: 10,
    max_mediators: 3,
    storage_limit_mb: 1000,
    storage_used_mb: 85,
    website: 'https://quickresolve.co.za',
    address: '789 Smith Street, Durban, 4001, South Africa',
    logo_url: null
  },
  {
    id: 'a3333333-3333-3333-3333-333333333333',
    name: 'harmony-mediation',
    display_name: 'Harmony Mediation Services',
    email: 'support@harmonymediation.com',
    phone: '+27 12 555 0003',
    subscription_tier: 'trial',
    subscription_status: 'trialing',
    trial_ends_at: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
    max_active_cases: 5,
    max_mediators: 1,
    storage_limit_mb: 500,
    storage_used_mb: 12,
    website: 'https://harmonymediation.com',
    address: '321 Church Street, Pretoria, 0001, South Africa',
    logo_url: null
  },
  {
    id: 'a4444444-4444-4444-4444-444444444444',
    name: 'legal-bridge',
    display_name: 'Legal Bridge Mediation',
    email: 'admin@legalbridge.co.za',
    phone: '+27 41 555 0004',
    subscription_tier: 'pro',
    subscription_status: 'active',
    trial_ends_at: null,
    max_active_cases: 50,
    max_mediators: 10,
    storage_limit_mb: 5000,
    storage_used_mb: 890,
    website: 'https://legalbridge.co.za',
    address: '654 Main Road, Port Elizabeth, 6001, South Africa',
    logo_url: null
  },
  {
    id: 'a5555555-5555-5555-5555-555555555555',
    name: 'peaceful-solutions',
    display_name: 'Peaceful Solutions Inc.',
    email: 'contact@peacefulsolutions.com',
    phone: '+27 51 555 0005',
    subscription_tier: 'basic',
    subscription_status: 'past_due',
    trial_ends_at: null,
    max_active_cases: 10,
    max_mediators: 3,
    storage_limit_mb: 1000,
    storage_used_mb: 650,
    website: 'https://peacefulsolutions.com',
    address: '987 High Street, Bloemfontein, 9300, South Africa',
    logo_url: null
  }
];

async function seedOrganizations() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding test organizations...\n');
    
    for (const org of organizations) {
      const result = await client.query(`
        INSERT INTO organizations (
          id, name, display_name, email, phone,
          subscription_tier, subscription_status, trial_ends_at,
          max_active_cases, max_mediators, storage_limit_mb, storage_used_mb,
          website, address, logo_url,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          NOW() - INTERVAL '90 days', NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          subscription_tier = EXCLUDED.subscription_tier,
          subscription_status = EXCLUDED.subscription_status,
          trial_ends_at = EXCLUDED.trial_ends_at,
          max_active_cases = EXCLUDED.max_active_cases,
          max_mediators = EXCLUDED.max_mediators,
          storage_limit_mb = EXCLUDED.storage_limit_mb,
          storage_used_mb = EXCLUDED.storage_used_mb,
          website = EXCLUDED.website,
          address = EXCLUDED.address,
          updated_at = NOW()
        RETURNING id, display_name, subscription_tier, subscription_status
      `, [
        org.id, org.name, org.display_name, org.email, org.phone,
        org.subscription_tier, org.subscription_status, org.trial_ends_at,
        org.max_active_cases, org.max_mediators, org.storage_limit_mb, org.storage_used_mb,
        org.website, org.address, org.logo_url
      ]);
      
      console.log(`✅ ${result.rows[0].display_name} (${result.rows[0].subscription_tier}/${result.rows[0].subscription_status})`);
    }
    
    // Display summary
    console.log('\n📊 Summary:\n');
    const summary = await client.query(`
      SELECT 
        COUNT(*) as total_organizations,
        COUNT(*) FILTER (WHERE subscription_status = 'active') as active,
        COUNT(*) FILTER (WHERE subscription_status = 'trialing') as trialing,
        COUNT(*) FILTER (WHERE subscription_status = 'past_due') as past_due,
        COUNT(*) FILTER (WHERE subscription_tier = 'enterprise') as enterprise_tier,
        COUNT(*) FILTER (WHERE subscription_tier = 'pro') as pro_tier,
        COUNT(*) FILTER (WHERE subscription_tier = 'basic') as basic_tier,
        COUNT(*) FILTER (WHERE subscription_tier = 'trial') as trial_tier
      FROM organizations
      WHERE deleted_at IS NULL
    `);
    
    const stats = summary.rows[0];
    console.log(`Total Organizations: ${stats.total_organizations}`);
    console.log(`Status: ${stats.active} active, ${stats.trialing} trialing, ${stats.past_due} past_due`);
    console.log(`Tiers: ${stats.enterprise_tier} enterprise, ${stats.pro_tier} pro, ${stats.basic_tier} basic, ${stats.trial_tier} trial`);
    
    console.log('\n✨ Seeding complete!');
    
  } catch (err) {
    console.error('❌ Error seeding organizations:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedOrganizations().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
