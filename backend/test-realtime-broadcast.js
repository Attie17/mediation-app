import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function testRealtimeBroadcast() {
  try {
    console.log('🧪 Testing Real-time Dashboard Sync...');
    
    const caseId = '4'; // Test case
    
    console.log('📡 Broadcasting test case_update event for case', caseId);
    
    // Create the same channel pattern used in the backend routes
    const channel = supabase.channel(`case-${caseId}-updates`);
    
    const payload = {
      case_id: caseId,
      event_type: 'test_update',
      doc_type: 'mortgage_statement',
      user_id: '7f66f2e3-719e-430d-ac8b-77497ce89aec',
      timestamp: new Date().toISOString()
    };
    
    await channel.send({
      type: 'broadcast',
      event: 'case_update',
      payload: payload
    });
    
    console.log('✅ Test broadcast sent successfully!');
    console.log('📊 Payload:', JSON.stringify(payload, null, 2));
    console.log('🎯 Now test the complete flow:');
    console.log('   1. Open http://localhost:5173/ in browser');
    console.log('   2. Navigate to Case Dashboard for case 4');
    console.log('   3. The dashboard should subscribe to case-4-updates channel');
    console.log('   4. Run upload confirm/reject actions to see real-time sync');
    
  } catch (error) {
    console.error('❌ Broadcast test failed:', error);
  }
}

testRealtimeBroadcast();