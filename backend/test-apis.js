/**
 * Test Multi-Tenant API Endpoints
 * Run this while server is running to test organizations and case assignments
 */

async function testAPIs() {
  const baseURL = 'http://localhost:4000';
  
  console.log('\n🧪 Testing Multi-Tenant API Endpoints\n');
  console.log('='.repeat(60));
  
  // First, get an admin token (assuming you have admin login)
  console.log('\n1. Getting admin auth token...');
  console.log('   ⚠️  You need to login as admin first');
  console.log('   Visit: http://localhost:5173');
  console.log('   Login with: ceo@stabilistc.co.za');
  console.log('   Then copy token from browser DevTools Application > Local Storage\n');
  
  const token = 'YOUR_TOKEN_HERE'; // Replace with actual token
  
  if (token === 'YOUR_TOKEN_HERE') {
    console.log('⏸️  Paused - Please add your auth token to this script');
    console.log('\nTo get your token:');
    console.log('1. Open http://localhost:5173 in browser');
    console.log('2. Login as admin (ceo@stabilistc.co.za)');
    console.log('3. Open DevTools (F12) > Application > Local Storage');
    console.log('4. Copy the token value');
    console.log('5. Paste it in this script where it says YOUR_TOKEN_HERE\n');
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  try {
    // Test 1: List all organizations
    console.log('\n2. GET /api/organizations - List all organizations');
    const orgsResponse = await fetch(`${baseURL}/api/organizations`, { headers });
    const orgs = await orgsResponse.json();
    
    if (orgsResponse.ok) {
      console.log(`   ✅ Found ${orgs.length} organization(s):`);
      orgs.forEach(org => {
        console.log(`      - ${org.display_name} (${org.subscription_tier})`);
        console.log(`        Users: ${org.user_count}, Cases: ${org.case_count}`);
      });
    } else {
      console.log(`   ❌ Error: ${orgs.error}`);
    }
    
    // Test 2: Get default organization details
    if (orgs.length > 0) {
      const defaultOrgId = orgs[0].id;
      
      console.log(`\n3. GET /api/organizations/${defaultOrgId.substring(0, 8)}... - Get details`);
      const orgResponse = await fetch(`${baseURL}/api/organizations/${defaultOrgId}`, { headers });
      const org = await orgResponse.json();
      
      if (orgResponse.ok) {
        console.log(`   ✅ Organization: ${org.display_name}`);
        console.log(`      Status: ${org.subscription_status}`);
        console.log(`      Tier: ${org.subscription_tier}`);
        console.log(`      Users: ${org.user_count}`);
        console.log(`      Active Cases: ${org.active_case_count}`);
        console.log(`      Storage: ${org.storage_used_mb}MB / ${org.storage_limit_mb}MB`);
      } else {
        console.log(`   ❌ Error: ${org.error}`);
      }
      
      // Test 3: Get organization users
      console.log(`\n4. GET /api/organizations/${defaultOrgId.substring(0, 8)}.../users - List users`);
      const usersResponse = await fetch(`${baseURL}/api/organizations/${defaultOrgId}/users`, { headers });
      const users = await usersResponse.json();
      
      if (usersResponse.ok) {
        console.log(`   ✅ Found ${users.length} user(s):`);
        users.slice(0, 5).forEach(user => {
          console.log(`      - ${user.email || user.name || 'No name'} (${user.role})`);
        });
        if (users.length > 5) {
          console.log(`      ... and ${users.length - 5} more`);
        }
      } else {
        console.log(`   ❌ Error: ${users.error}`);
      }
      
      // Test 4: Get organization cases
      console.log(`\n5. GET /api/organizations/${defaultOrgId.substring(0, 8)}.../cases - List cases`);
      const casesResponse = await fetch(`${baseURL}/api/organizations/${defaultOrgId}/cases`, { headers });
      const cases = await casesResponse.json();
      
      if (casesResponse.ok) {
        console.log(`   ✅ Found ${cases.length} case(s):`);
        cases.slice(0, 5).forEach(c => {
          console.log(`      - Case ${c.id.substring(0, 8)}... (${c.status})`);
        });
        if (cases.length > 5) {
          console.log(`      ... and ${cases.length - 5} more`);
        }
      } else {
        console.log(`   ❌ Error: ${cases.error}`);
      }
    }
    
    // Test 5: Get unassigned cases
    console.log('\n6. GET /api/case-assignments/unassigned - Cases without mediator');
    const unassignedResponse = await fetch(`${baseURL}/api/case-assignments/unassigned`, { headers });
    const unassigned = await unassignedResponse.json();
    
    if (unassignedResponse.ok) {
      console.log(`   ✅ Found ${unassigned.length} unassigned case(s):`);
      unassigned.slice(0, 3).forEach(c => {
        console.log(`      - Case ${c.id.substring(0, 8)}... (${c.status})`);
      });
    } else {
      console.log(`   ❌ Error: ${unassigned.error}`);
    }
    
    // Test 6: Get mediator workload
    console.log('\n7. GET /api/case-assignments/mediator-workload - Capacity analysis');
    const workloadResponse = await fetch(`${baseURL}/api/case-assignments/mediator-workload`, { headers });
    const workload = await workloadResponse.json();
    
    if (workloadResponse.ok) {
      console.log(`   ✅ Mediator workload analysis:`);
      workload.forEach(m => {
        console.log(`      - ${m.mediator_name || m.mediator_email}: ${m.case_count} case(s)`);
      });
    } else {
      console.log(`   ❌ Error: ${workload.error}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ API Testing Complete!');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

testAPIs();
