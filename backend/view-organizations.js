#!/usr/bin/env node
/**
 * View organizations in the database
 * Usage: node view-organizations.js
 */

import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mediation_dev';

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : false
});

async function viewOrganizations() {
  const client = await pool.connect();
  
  try {
    console.log('📋 Organizations in Database:\n');
    
    const result = await client.query(`
      SELECT 
        id,
        display_name,
        email,
        phone,
        subscription_tier,
        subscription_status,
        max_active_cases,
        max_mediators,
        ROUND(storage_used_mb::numeric / storage_limit_mb * 100, 1) || '%' as storage_usage,
        website,
        address
      FROM organizations
      WHERE deleted_at IS NULL
      ORDER BY created_at
    `);
    
    result.rows.forEach((org, idx) => {
      console.log(`${idx + 1}. ${org.display_name}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Email: ${org.email}`);
      console.log(`   Phone: ${org.phone}`);
      console.log(`   Tier: ${org.subscription_tier} (${org.subscription_status})`);
      console.log(`   Limits: ${org.max_active_cases} cases, ${org.max_mediators} mediators`);
      console.log(`   Storage: ${org.storage_usage} used`);
      console.log(`   Website: ${org.website}`);
      console.log(`   Address: ${org.address}`);
      console.log('');
    });
    
    console.log(`Total: ${result.rows.length} organizations\n`);
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

viewOrganizations().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
