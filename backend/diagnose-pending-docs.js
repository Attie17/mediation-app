import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

const userId = '44d32632-d369-5263-9111-334e03253f94';

async function deepDive() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  DEEP DIVE: Pending Documents API Investigation');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log('📋 USER CONTEXT');
  console.log('─────────────────────────────────────────────────────────');
  const { data: user } = await supabase
    .from('app_users')
    .select('*')
    .eq('user_id', userId)
    .single();
  console.log(`User ID: ${userId}`);
  console.log(`Name: ${user?.name}`);
  console.log(`Email: ${user?.email}`);
  console.log(`Role: ${user?.role}\n`);

  console.log('🔍 STEP 1: Check cases table (using mediator_id)');
  console.log('─────────────────────────────────────────────────────────');
  try {
    const casesQuery = `
      SELECT id as case_id, mediator_id, status, description
      FROM cases
      WHERE mediator_id = $1
    `;
    const casesResult = await pool.query(casesQuery, [userId]);
    console.log(`✅ Found ${casesResult.rows.length} cases where user is mediator:`);
    casesResult.rows.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.case_id.slice(0, 12)}... (${c.status}) - ${c.description}`);
    });
    
    if (casesResult.rows.length === 0) {
      console.log('\n❌ PROBLEM: No cases found! API would return empty array.');
      return;
    }

    const caseIds = casesResult.rows.map(r => r.case_id);
    console.log(`\nCase IDs array: [${caseIds.map(id => id.slice(0, 8)).join(', ')}...]\n`);

    console.log('🔍 STEP 2: Check uploads table');
    console.log('─────────────────────────────────────────────────────────');
    
    // Check ALL uploads for these cases
    const allUploadsQuery = `
      SELECT id, case_id, user_id, doc_type, status, uploaded_at, original_filename
      FROM uploads
      WHERE case_id = ANY($1::uuid[])
      ORDER BY uploaded_at DESC
    `;
    const allUploads = await pool.query(allUploadsQuery, [caseIds]);
    console.log(`Found ${allUploads.rows.length} total uploads across all cases:`);
    
    if (allUploads.rows.length === 0) {
      console.log('   (none)\n');
    } else {
      allUploads.rows.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.original_filename} - Status: ${u.status} - Case: ${u.case_id.slice(0, 8)}...`);
      });
    }

    // Check PENDING uploads specifically
    const pendingUploadsQuery = `
      SELECT id, case_id, user_id, doc_type, status, uploaded_at, original_filename
      FROM uploads
      WHERE case_id = ANY($1::uuid[])
        AND status = 'pending'
      ORDER BY uploaded_at DESC
    `;
    const pendingUploads = await pool.query(pendingUploadsQuery, [caseIds]);
    console.log(`\nFound ${pendingUploads.rows.length} PENDING uploads:\n`);
    
    if (pendingUploads.rows.length === 0) {
      console.log('   ✅ No pending uploads (this is correct!)\n');
    } else {
      pendingUploads.rows.forEach((u, i) => {
        console.log(`   ${i + 1}. ${u.original_filename} - ${u.doc_type}`);
      });
    }

    console.log('🔍 STEP 3: Test the EXACT query used by API');
    console.log('─────────────────────────────────────────────────────────');
    
    const apiQuery = `
      SELECT u.id, u.case_id, u.user_id, u.doc_type, u.original_filename, 
             u.storage_path, u.status, u.uploaded_at, u.created_at,
             au.email as uploader_email, au.name as uploader_name
      FROM uploads u
      LEFT JOIN app_users au ON u.user_id = au.user_id
      WHERE u.case_id = ANY($1::uuid[])
        AND u.status = 'pending'
      ORDER BY u.uploaded_at DESC
      LIMIT 50
    `;
    
    const apiResult = await pool.query(apiQuery, [caseIds]);
    console.log(`API Query Result: ${apiResult.rows.length} rows`);
    
    if (apiResult.rows.length === 0) {
      console.log('✅ Query executes successfully, returns 0 rows (no pending docs)\n');
    } else {
      console.log('Found rows:');
      apiResult.rows.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.original_filename} by ${r.uploader_name}`);
      });
    }

    console.log('🔍 STEP 4: Check app_users join');
    console.log('─────────────────────────────────────────────────────────');
    
    const joinTestQuery = `
      SELECT u.id, u.user_id, au.user_id as joined_user_id, au.name, au.email
      FROM uploads u
      LEFT JOIN app_users au ON u.user_id = au.user_id
      WHERE u.case_id = ANY($1::uuid[])
      LIMIT 5
    `;
    
    const joinTest = await pool.query(joinTestQuery, [caseIds]);
    console.log(`Join test with ${joinTest.rows.length} uploads:`);
    if (joinTest.rows.length === 0) {
      console.log('   No uploads to test join\n');
    } else {
      joinTest.rows.forEach((r, i) => {
        console.log(`   ${i + 1}. Upload user_id: ${r.user_id?.slice(0, 12)}... -> Joined: ${r.name || '(null)'} / ${r.email || '(null)'}`);
      });
    }

    console.log('\n🔍 STEP 5: Simulate API Response');
    console.log('─────────────────────────────────────────────────────────');
    const apiResponse = { uploads: apiResult.rows };
    console.log('API would return:');
    console.log(JSON.stringify(apiResponse, null, 2));

    console.log('\n📊 FINAL DIAGNOSIS');
    console.log('═══════════════════════════════════════════════════════════');
    
    if (casesResult.rows.length === 0) {
      console.log('❌ ISSUE: No cases found for mediator');
      console.log('   → API returns empty array, but this should work fine');
    } else if (apiResult.rows.length === 0) {
      console.log('✅ EXPECTED: No pending documents');
      console.log('   → API returns { uploads: [] }');
      console.log('   → Frontend should show "All Clear!" message');
      console.log('\n❓ If frontend still shows error, check:');
      console.log('   1. Authentication: Is req.user?.id set correctly?');
      console.log('   2. Response handling: Does frontend expect "uploads" array?');
      console.log('   3. Browser console: Check for fetch errors');
    } else {
      console.log(`✅ Found ${apiResult.rows.length} pending documents`);
      console.log('   → API should return them successfully');
    }

  } catch (error) {
    console.error('\n❌ ERROR during query execution:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    console.error('\nFull error:', error);
  } finally {
    await pool.end();
  }
}

deepDive().catch(console.error);
