/**
 * Setup proper case structure: 1 Mediator + 2 Divorcees (the couple)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CASE_ID = '3bcb2937-0e55-451a-a9fd-659187af84d4';
const BOB_USER_ID = '22222222-2222-2222-2222-222222222222';

async function setupProperCase() {
  console.log('🔧 Setting up proper case structure...\n');
  
  // Step 1: Update Bob's name to "Bob Jones"
  console.log('1️⃣ Updating Bob Divorcee to Bob Jones...');
  const { error: bobUpdateError } = await supabase
    .from('app_users')
    .update({ name: 'Bob Jones' })
    .eq('user_id', BOB_USER_ID);
  
  if (bobUpdateError) {
    console.error('❌ Failed to update Bob:', bobUpdateError);
  } else {
    console.log('✅ Updated: Bob Divorcee → Bob Jones\n');
  }
  
  // Step 2: Create Jill Jones user
  console.log('2️⃣ Creating Jill Jones user...');
  const JILL_USER_ID = '33333333-3333-3333-3333-333333333333';
  const JILL_EMAIL = 'jill@example.com';
  
  // Check if Jill already exists
  const { data: existingJill } = await supabase
    .from('app_users')
    .select('user_id, name, email')
    .eq('user_id', JILL_USER_ID)
    .single();
  
  if (existingJill) {
    console.log('ℹ️  Jill Jones already exists:', existingJill);
  } else {
    const { error: jillCreateError } = await supabase
      .from('app_users')
      .insert({
        user_id: JILL_USER_ID,
        email: JILL_EMAIL,
        name: 'Jill Jones',
        role: 'divorcee',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (jillCreateError) {
      console.error('❌ Failed to create Jill:', jillCreateError);
    } else {
      console.log('✅ Created Jill Jones user\n');
    }
  }
  
  // Step 3: Add Jill as case participant
  console.log('3️⃣ Adding Jill Jones to case as divorcee...');
  
  // Check if already a participant
  const { data: existingParticipant } = await supabase
    .from('case_participants')
    .select('*')
    .eq('case_id', CASE_ID)
    .eq('user_id', JILL_USER_ID)
    .single();
  
  if (existingParticipant) {
    console.log('ℹ️  Jill is already a participant in this case');
  } else {
    const { error: participantError } = await supabase
      .from('case_participants')
      .insert({
        case_id: CASE_ID,
        user_id: JILL_USER_ID,
        role: 'divorcee',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (participantError) {
      console.error('❌ Failed to add Jill as participant:', participantError);
    } else {
      console.log('✅ Added Jill Jones as case participant\n');
    }
  }
  
  // Step 4: Verify final case structure
  console.log('4️⃣ Verifying case structure...\n');
  
  const { data: participants } = await supabase
    .from('case_participants')
    .select(`
      user_id,
      role,
      app_users!inner(name, email)
    `)
    .eq('case_id', CASE_ID)
    .order('role', { ascending: false }); // mediator first, then divorcees
  
  console.log('📋 Final Case Participants:');
  console.log('═══════════════════════════════════════════════════════');
  
  const mediators = participants.filter(p => p.role === 'mediator');
  const divorcees = participants.filter(p => p.role === 'divorcee');
  
  console.log('\n👔 Mediator(s):');
  mediators.forEach(p => {
    console.log(`   ✓ ${p.app_users.name} (${p.app_users.email})`);
  });
  
  console.log('\n💔 Divorcee(s):');
  divorcees.forEach(p => {
    console.log(`   ✓ ${p.app_users.name} (${p.app_users.email})`);
  });
  
  console.log('\n═══════════════════════════════════════════════════════');
  
  // Validation
  if (mediators.length === 1 && divorcees.length === 2) {
    console.log('\n✅ SUCCESS! Proper case structure:');
    console.log('   • 1 Mediator ✓');
    console.log('   • 2 Divorcees (the couple) ✓');
  } else {
    console.log('\n⚠️  WARNING: Case structure is not correct:');
    console.log(`   • Mediators: ${mediators.length} (should be 1)`);
    console.log(`   • Divorcees: ${divorcees.length} (should be 2)`);
  }
  
  console.log('\n✨ Done!\n');
}

setupProperCase().catch(console.error);
