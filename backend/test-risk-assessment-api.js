// Test risk assessment API endpoints
import { pool } from './src/db.js';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';

// Use development auth for testing
const DEV_TOKEN = 'dev-fake-token';
const DEV_HEADERS = {
  'x-dev-email': 'alice@test.com',
  'x-dev-role': 'divorcee'
};

async function testRiskAssessment() {
  try {
    console.log('🧪 Testing Risk Assessment API\n');
    
    // Test 1: POST risk assessment
    console.log('Test 1: POST /api/users/risk-assessment');
    const testData = {
      safetyFearDuringConflict: 'sometimes',
      safetyPhysicalViolence: 'no',
      safetyThreatsOrIntimidation: 'rarely',
      safetyFinancialControl: 'sometimes',
      safetySocialIsolation: 'no',
      safetyDecisionControl: 'sometimes',
      safetyEmotionalAbuse: 'rarely',
      safetyChildrenWitness: 'no',
      safetyCurrentlySafe: 'yes, i feel safe',
      safetyNeedSupport: 'no, thank you'
    };
    
    const postResponse = await fetch(`${BASE_URL}/api/users/risk-assessment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEV_TOKEN}`,
        'Content-Type': 'application/json',
        ...DEV_HEADERS
      },
      body: JSON.stringify(testData)
    });
    
    if (!postResponse.ok) {
      const error = await postResponse.text();
      console.log(`❌ POST failed (${postResponse.status}):`, error);
      return false;
    }
    
    const postResult = await postResponse.json();
    console.log('✅ POST successful');
    console.log('   IPV Flags:', postResult.assessment?.ipvFlags);
    console.log('   Power Imbalance:', postResult.assessment?.powerImbalance);
    console.log('   Suitability:', postResult.assessment?.suitability);
    console.log('   Recommendation:', postResult.assessment?.recommendation);
    
    // Test 2: GET risk assessment
    console.log('\nTest 2: GET /api/users/risk-assessment');
    const getResponse = await fetch(`${BASE_URL}/api/users/risk-assessment`, {
      headers: {
        'Authorization': `Bearer ${DEV_TOKEN}`,
        ...DEV_HEADERS
      }
    });
    
    if (!getResponse.ok) {
      const error = await getResponse.text();
      console.log(`❌ GET failed (${getResponse.status}):`, error);
      return false;
    }
    
    const getResult = await getResponse.json();
    console.log('✅ GET successful');
    console.log('   Assessment found:', getResult.assessment ? 'Yes' : 'No');
    console.log('   Assessed at:', getResult.assessment?.assessedAt);
    
    console.log('\n✅ All tests passed!');
    console.log('\n📊 Risk Assessment Summary:');
    console.log(`   - Risk Level: ${postResult.assessment?.suitability}`);
    console.log(`   - Process: ${postResult.assessment?.recommendation}`);
    console.log(`   - Adaptations: ${postResult.assessment?.processAdaptations?.length || 0} recommendations`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run tests
testRiskAssessment()
  .then(success => process.exit(success ? 0 : 1))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
