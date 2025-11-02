/**
 * Clean up test participants from cases
 * Business Rule: Each case should have 1 mediator + 2 divorcees (the couple)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CASE_ID = '3bcb2937-0e55-451a-a9fd-659187af84d4';

async function cleanupTestParticipants() {
  console.log('🔍 Checking participants in case...\n');
  
  // Get all participants
  const { data: participants, error: fetchError } = await supabase
    .from('case_participants')
    .select(`
      user_id,
      role,
      created_at,
      app_users!inner(name, email)
    `)
    .eq('case_id', CASE_ID)
    .order('created_at', { ascending: true });
  
  if (fetchError) {
    console.error('❌ Error fetching participants:', fetchError);
    return;
  }
  
  console.log('Current participants:');
  participants.forEach((p, idx) => {
    console.log(`  ${idx + 1}. ${p.app_users.name} (${p.app_users.email}) - ${p.role}`);
  });
  
  // Identify test participants to remove
  const testEmails = [
    'uploads.mediator@example.com',
    'dashboard.divorcee@example.com'
  ];
  
  const toRemove = participants.filter(p => 
    testEmails.includes(p.app_users.email)
  );
  
  if (toRemove.length === 0) {
    console.log('\n✅ No test participants found to remove!');
    return;
  }
  
  console.log(`\n⚠️  Found ${toRemove.length} test participant(s) to remove:`);
  toRemove.forEach(p => {
    console.log(`  - ${p.app_users.name} (${p.app_users.email})`);
  });
  
  console.log('\n🔧 Removing test participants...\n');
  
  // Remove test participants
  for (const participant of toRemove) {
    const { error: deleteError } = await supabase
      .from('case_participants')
      .delete()
      .eq('case_id', CASE_ID)
      .eq('user_id', participant.user_id);
    
    if (deleteError) {
      console.error(`❌ Failed to remove ${participant.app_users.name}:`, deleteError);
    } else {
      console.log(`✅ Removed ${participant.app_users.name} (${participant.app_users.email})`);
    }
  }
  
  // Verify final state
  console.log('\n🔍 Verifying final participants...\n');
  
  const { data: finalParticipants } = await supabase
    .from('case_participants')
    .select(`
      user_id,
      role,
      app_users!inner(name, email)
    `)
    .eq('case_id', CASE_ID)
    .order('role', { ascending: false });
  
  console.log('Final participants:');
  finalParticipants.forEach((p, idx) => {
    console.log(`  ${idx + 1}. ${p.app_users.name} (${p.app_users.email}) - ${p.role}`);
  });
  
  // Check if we have the correct structure
  const mediators = finalParticipants.filter(p => p.role === 'mediator');
  const divorcees = finalParticipants.filter(p => p.role === 'divorcee');
  
  console.log('\n📊 Final count:');
  console.log(`  Mediators: ${mediators.length}`);
  console.log(`  Divorcees: ${divorcees.length}`);
  
  if (mediators.length === 1 && divorcees.length === 2) {
    console.log('\n✅ Perfect! Case now has correct structure: 1 mediator + 2 divorcees');
  } else if (mediators.length === 1 && divorcees.length === 1) {
    console.log('\n⚠️  Note: You have 1 mediator and 1 divorcee. You may need to add the second divorcee (spouse).');
  } else {
    console.log('\n⚠️  Warning: Case structure may need adjustment.');
    console.log('   Expected: 1 mediator + 2 divorcees (the divorcing couple)');
  }
  
  console.log('\n✅ Cleanup complete!');
}

cleanupTestParticipants().catch(console.error);
