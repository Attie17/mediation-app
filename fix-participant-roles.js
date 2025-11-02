/**
 * Fix incorrect participant roles in the database
 * Issue: Some participants showing as 'divorcee' when they should be 'mediator'
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CASE_ID = '3bcb2937-0e55-451a-a9fd-659187af84d4';

async function fixParticipantRoles() {
  console.log('🔍 Checking current participant roles...\n');
  
  // First, check current state
  const { data: currentParticipants, error: fetchError } = await supabase
    .from('case_participants')
    .select(`
      user_id,
      role,
      app_users!inner(name, email)
    `)
    .eq('case_id', CASE_ID);
  
  if (fetchError) {
    console.error('❌ Error fetching participants:', fetchError);
    return;
  }
  
  console.log('Current participants:');
  currentParticipants.forEach(p => {
    console.log(`  - ${p.app_users.name} (${p.app_users.email}): ${p.role}`);
  });
  
  // Find participants that need fixing based on their email/name
  const fixes = [];
  
  for (const participant of currentParticipants) {
    const email = participant.app_users.email;
    const name = participant.app_users.name;
    let correctRole = participant.role;
    
    // Determine correct role based on email patterns
    if (email.includes('mediator@') || name.toLowerCase().includes('mediator')) {
      correctRole = 'mediator';
    } else if (email.includes('lawyer@') || name.toLowerCase().includes('lawyer')) {
      correctRole = 'lawyer';
    } else if (email.includes('divorcee@') || email === 'bob@example.com' || name.toLowerCase().includes('divorcee')) {
      correctRole = 'divorcee';
    }
    
    if (correctRole !== participant.role) {
      fixes.push({
        userId: participant.user_id,
        email: email,
        name: name,
        currentRole: participant.role,
        correctRole: correctRole
      });
    }
  }
  
  if (fixes.length === 0) {
    console.log('\n✅ All participants have correct roles!');
    return;
  }
  
  console.log(`\n⚠️  Found ${fixes.length} participant(s) with incorrect roles:`);
  fixes.forEach(fix => {
    console.log(`  - ${fix.name} (${fix.email}): ${fix.currentRole} → ${fix.correctRole}`);
  });
  
  console.log('\n🔧 Applying fixes...\n');
  
  // Apply fixes
  for (const fix of fixes) {
    const { error: updateError } = await supabase
      .from('case_participants')
      .update({ role: fix.correctRole })
      .eq('case_id', CASE_ID)
      .eq('user_id', fix.userId);
    
    if (updateError) {
      console.error(`❌ Failed to update ${fix.name}:`, updateError);
    } else {
      console.log(`✅ Updated ${fix.name}: ${fix.currentRole} → ${fix.correctRole}`);
    }
  }
  
  // Verify fixes
  console.log('\n🔍 Verifying fixes...\n');
  
  const { data: updatedParticipants } = await supabase
    .from('case_participants')
    .select(`
      user_id,
      role,
      app_users!inner(name, email)
    `)
    .eq('case_id', CASE_ID);
  
  console.log('Updated participants:');
  updatedParticipants.forEach(p => {
    console.log(`  - ${p.app_users.name} (${p.app_users.email}): ${p.role}`);
  });
  
  console.log('\n✅ Done!');
}

fixParticipantRoles().catch(console.error);
