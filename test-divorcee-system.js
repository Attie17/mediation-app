const http = require('http');

const BASE_URL = 'http://localhost:4000';
const TEST_USER_ID = '22222222-2222-2222-2222-222222222222'; // Bob Divorcee

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          json: async () => JSON.parse(data),
          text: async () => data
        });
      });
    }).on('error', reject);
  });
}

async function testDivorceeEndpoints() {
  console.log('🧪 Testing Divorcee System Endpoints\n');
  console.log('═'.repeat(60));
  
  // Wait for server to be ready
  console.log('\n⏳ Waiting for server to start...');
  await wait(3000);
  
  try {
    // Test 1: Dashboard Stats
    console.log('\n\n1️⃣  Testing: GET /dashboard/stats/divorcee/:userId');
    console.log('─'.repeat(60));
    const statsResponse = await fetch(`${BASE_URL}/dashboard/stats/divorcee/${TEST_USER_ID}`);
    
    if (!statsResponse.ok) {
      console.log(`❌ Status: ${statsResponse.status}`);
      const errorText = await statsResponse.text();
      console.log(`❌ Error: ${errorText}`);
    } else {
      const stats = await statsResponse.json();
      console.log('✅ Status: 200 OK');
      console.log('📊 Stats Response:');
      console.log(JSON.stringify(stats, null, 2));
    }
    
    // Test 2: Get User Cases
    console.log('\n\n2️⃣  Testing: GET /api/cases/user/:userId');
    console.log('─'.repeat(60));
    const casesResponse = await fetch(`${BASE_URL}/api/cases/user/${TEST_USER_ID}`);
    
    if (!casesResponse.ok) {
      console.log(`❌ Status: ${casesResponse.status}`);
      const errorText = await casesResponse.text();
      console.log(`❌ Error: ${errorText}`);
    } else {
      const cases = await casesResponse.json();
      console.log('✅ Status: 200 OK');
      console.log('📋 Cases Response:');
      console.log(JSON.stringify(cases, null, 2));
      
      // Test 3: Get uploads for first case
      if (cases.cases && cases.cases.length > 0) {
        const firstCaseId = cases.cases[0].id;
        console.log(`\n\n3️⃣  Testing: GET /api/cases/${firstCaseId}/uploads`);
        console.log('─'.repeat(60));
        
        const uploadsResponse = await fetch(`${BASE_URL}/api/cases/${firstCaseId}/uploads`);
        
        if (!uploadsResponse.ok) {
          console.log(`❌ Status: ${uploadsResponse.status}`);
          const errorText = await uploadsResponse.text();
          console.log(`❌ Error: ${errorText}`);
        } else {
          const uploads = await uploadsResponse.json();
          console.log('✅ Status: 200 OK');
          console.log('📁 Uploads Response:');
          console.log(JSON.stringify(uploads, null, 2));
        }
      } else {
        console.log('\n⚠️  No cases found for user, skipping uploads test');
      }
    }
    
    // Test 4: Dashboard test user
    console.log('\n\n4️⃣  Testing: Dashboard Test Divorcee User');
    console.log('─'.repeat(60));
    const dashUserID = '33333333-3333-4333-8333-333333333333';
    const dashStatsResponse = await fetch(`${BASE_URL}/dashboard/stats/divorcee/${dashUserID}`);
    
    if (!dashStatsResponse.ok) {
      console.log(`❌ Status: ${dashStatsResponse.status}`);
    } else {
      const dashStats = await dashStatsResponse.json();
      console.log('✅ Status: 200 OK');
      console.log('📊 Stats for dashboard.divorcee@example.com:');
      console.log(JSON.stringify(dashStats, null, 2));
    }
    
    console.log('\n\n═'.repeat(60));
    console.log('✅ All tests completed!');
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    console.error(error);
  }
  
  process.exit(0);
}

testDivorceeEndpoints();
