/**
 * Comprehensive AI Features Test Script
 * Tests all AI endpoints with sample data
 */

import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:4000';
const AUTH_TOKEN = process.env.TEST_JWT || 'your-test-jwt-token';

console.log('🤖 AI Features Test Suite\n');
console.log('Testing all AI endpoints with sample mediation data...\n');

// Helper function to make API requests
async function testEndpoint(name, method, endpoint, body = null) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 Testing: ${name}`);
  console.log(`   ${method} ${endpoint}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS');
      console.log('Response:', JSON.stringify(data, null, 2));
      return { success: true, data };
    } else {
      console.log('❌ FAILED');
      console.log('Status:', response.status);
      console.log('Error:', JSON.stringify(data, null, 2));
      return { success: false, error: data };
    }
  } catch (error) {
    console.log('❌ ERROR');
    console.log('Message:', error.message);
    return { success: false, error: error.message };
  }
}

// Sample test data
const sampleChatMessages = [
  {
    sender: 'Party A',
    message: 'I think we should split the assets 50/50. That seems fair to me.',
    timestamp: new Date().toISOString()
  },
  {
    sender: 'Party B',
    message: 'I disagree! I contributed more to our savings. This is unfair!',
    timestamp: new Date().toISOString()
  },
  {
    sender: 'Party A',
    message: 'I understand your perspective. Can we discuss this calmly?',
    timestamp: new Date().toISOString()
  }
];

const sampleSessionTranscript = `
Mediator: Good morning. Thank you both for being here today. Let's discuss the division of assets.

Party A: I believe a 50/50 split is fair. We built everything together.

Party B: I worked overtime for years while you were studying. I think I deserve more.

Mediator: I hear both of you. Let's look at the facts and find a solution that feels fair to both parties.

Party A: Maybe we can consider the time periods differently. I'm willing to discuss this.

Party B: Okay, I appreciate that. Let's try to work this out.
`;

// Run tests
async function runTests() {
  let passedTests = 0;
  let totalTests = 0;

  // Test 1: Health Check
  totalTests++;
  const healthResult = await testEndpoint(
    'AI Health Check',
    'GET',
    '/api/ai/health'
  );
  if (healthResult.success) passedTests++;

  await sleep(1000);

  // Test 2: Summarize Chat
  totalTests++;
  const summarizeResult = await testEndpoint(
    'Chat Summarization',
    'POST',
    '/api/ai/summarize',
    { messages: sampleChatMessages }
  );
  if (summarizeResult.success) passedTests++;

  await sleep(1000);

  // Test 3: Detect Emotional Tone
  totalTests++;
  const emotionResult = await testEndpoint(
    'Emotional Tone Detection',
    'POST',
    '/api/ai/analyze-emotion',
    { text: 'I disagree! I contributed more to our savings. This is unfair!' }
  );
  if (emotionResult.success) passedTests++;

  await sleep(1000);

  // Test 4: Extract Key Points
  totalTests++;
  const keyPointsResult = await testEndpoint(
    'Key Points Extraction',
    'POST',
    '/api/ai/extract-key-points',
    { transcript: sampleSessionTranscript }
  );
  if (keyPointsResult.success) passedTests++;

  await sleep(1000);

  // Test 5: Suggest Neutral Phrasing
  totalTests++;
  const neutralResult = await testEndpoint(
    'Neutral Phrasing Suggestion',
    'POST',
    '/api/ai/suggest-phrasing',
    { text: 'You always take more than your fair share!' }
  );
  if (neutralResult.success) passedTests++;

  await sleep(1000);

  // Test 6: Legal Guidance
  totalTests++;
  const legalResult = await testEndpoint(
    'Legal Guidance',
    'POST',
    '/api/ai/legal-guidance',
    { 
      question: 'How is marital property typically divided in South Africa?',
      context: 'divorce mediation, asset division'
    }
  );
  if (legalResult.success) passedTests++;

  // Final Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

  if (passedTests === totalTests) {
    console.log('🎉 All AI features are working correctly!\n');
  } else {
    console.log('⚠️  Some AI features need attention.\n');
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Wait for server to be ready
console.log('⏳ Waiting for server to be ready...\n');
setTimeout(runTests, 5000);
