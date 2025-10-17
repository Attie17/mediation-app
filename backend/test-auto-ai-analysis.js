/**
 * Test automatic AI analysis on chat message creation
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4000';
const DEV_TOKEN = 'dev-fake-token-123';
const DEV_HEADERS = {
  'x-dev-email': 'dev@example.com',
  'x-dev-user-id': '01234567-89ab-cdef-0123-456789abcdef',
  'x-dev-role': 'mediator'
};

async function testAutoAIAnalysis() {
  console.log('🧪 Testing automatic AI analysis on message creation...\n');
  
  try {
    // Step 1: Create a test message that should trigger AI analysis
    console.log('📝 Creating message with emotional content...');
    
    const messageData = {
      content: "I can't believe they're being so unreasonable! This is getting really frustrating and I don't think we can work this out.",
    };
    
    const messageResponse = await fetch(`${BASE_URL}/api/chat/channels/channel-1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEV_TOKEN}`,
        ...DEV_HEADERS,
      },
      body: JSON.stringify(messageData),
    });
    
    if (!messageResponse.ok) {
      throw new Error(`Message creation failed: ${messageResponse.status} ${messageResponse.statusText}`);
    }
    
    const messageResult = await messageResponse.json();
    console.log('✅ Message created:', messageResult.message.id);
    console.log('📄 Content:', messageResult.message.content.substring(0, 50) + '...');
    
    // Step 2: Wait a moment for AI analysis to complete
    console.log('\n⏳ Waiting for AI analysis to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 3: Check if AI insights were generated
    console.log('🔍 Checking for AI insights...');
    
    const insightsResponse = await fetch(`${BASE_URL}/api/ai/insights/case-1`, {
      headers: {
        'Authorization': `Bearer ${DEV_TOKEN}`,
        ...DEV_HEADERS,
      },
    });
    
    if (!insightsResponse.ok) {
      throw new Error(`Insights fetch failed: ${insightsResponse.status} ${insightsResponse.statusText}`);
    }
    
    const insightsResult = await insightsResponse.json();
    
    // Filter insights that were auto-generated after message creation
    const messageTimestamp = new Date(messageResult.message.created_at);
    const autoInsights = insightsResult.insights.filter(insight => {
      const insightTime = new Date(insight.created_at);
      return insightTime > messageTimestamp && 
             insight.metadata?.auto_generated === true &&
             insight.metadata?.message_id === messageResult.message.id;
    });
    
    console.log(`📊 Found ${autoInsights.length} auto-generated insights for this message:`);
    
    autoInsights.forEach(insight => {
      console.log(`  • ${insight.insight_type.toUpperCase()}`);
      if (insight.insight_type === 'tone_analysis') {
        console.log(`    - Emotional tone: ${insight.content.emotional_tone || 'N/A'}`);
        console.log(`    - Intensity: ${insight.content.intensity || 'N/A'}/10`);
      } else if (insight.insight_type === 'risk_assessment') {
        console.log(`    - Risk level: ${insight.content.risk_level || 'N/A'}`);
        console.log(`    - Confidence: ${insight.content.confidence || 'N/A'}`);
      }
    });
    
    // Verify expected insights were generated
    const hasToneAnalysis = autoInsights.some(i => i.insight_type === 'tone_analysis');
    const hasRiskAssessment = autoInsights.some(i => i.insight_type === 'risk_assessment');
    
    console.log('\n🎯 Test Results:');
    console.log(`  ✅ Message created successfully`);
    console.log(`  ${hasToneAnalysis ? '✅' : '❌'} Tone analysis generated`);
    console.log(`  ${hasRiskAssessment ? '✅' : '❌'} Risk assessment generated`);
    
    if (hasToneAnalysis && hasRiskAssessment) {
      console.log('\n🎉 SUCCESS: Automatic AI analysis is working!');
      return true;
    } else {
      console.log('\n⚠️  PARTIAL: Some AI analysis missing');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testAutoAIAnalysis().then(success => {
  process.exit(success ? 0 : 1);
});