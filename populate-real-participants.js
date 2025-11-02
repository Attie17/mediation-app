const { createClient } = require('@supabase/supabase-js');
const { v5: uuidv5 } = require('uuid');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Use the same namespace as your auth system
const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

const testCouples = [
  {
    couple: ['John Smith', 'Mary Johnson'],
    emails: ['john.smith@test.com', 'mary.johnson@test.com']
  },
  {
    couple: ['David Williams', 'Sarah Williams'],
    emails: ['david.williams@test.com', 'sarah.williams@test.com']
  }
];

async function main() {
  console.log('🚀 Populating real participants for Attie Nel cases...\n');
  
  // Get Attie's cases
  const { data: cases, error: casesError } = await supabase
    .from('cases')
    .select('id, status')
    .eq('mediator_id', '44d32632-d369-5263-9111-334e03253f94')
    .eq('status', 'open')
    .limit(2);
  
  if (casesError) {
    console.error('❌ Error fetching cases:', casesError.message);
    return;
  }
  
  console.log(`📋 Found ${cases.length} cases\n`);
  
  for (let i = 0; i < cases.length && i < testCouples.length; i++) {
    const caseItem = cases[i];
    const testCouple = testCouples[i];
    
    console.log(`📁 Processing Case ${i + 1}: ${caseItem.id.slice(0, 8)}...`);
    console.log(`   Couple: ${testCouple.couple[0]} & ${testCouple.couple[1]}\n`);
    
    // First, remove existing non-mediator participants from this case
    const { error: deleteError } = await supabase
      .from('case_participants')
      .delete()
      .eq('case_id', caseItem.id)
      .neq('user_id', '44d32632-d369-5263-9111-334e03253f94');
    
    if (deleteError) {
      console.log(`   ⚠️  Could not clear old participants:`, deleteError.message);
    }
    
    // Add both people in the couple
    for (let j = 0; j < 2; j++) {
      const personName = testCouple.couple[j];
      const personEmail = testCouple.emails[j];
      const userId = uuidv5(personEmail, UUID_NAMESPACE);
      
      console.log(`   👤 Creating participant: ${personName}`);
      console.log(`      Email: ${personEmail}`);
      console.log(`      User ID: ${userId.slice(0, 12)}...`);
      
      // Upsert user to app_users table
      const { error: userError } = await supabase
        .from('app_users')
        .upsert({
          user_id: userId,
          email: personEmail,
          name: personName,
          role: 'divorcee',
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
      if (userError) {
        console.log(`      ❌ Error creating user:`, userError.message);
        continue;
      }
      console.log(`      ✅ User created/updated in app_users`);
      
      // Add to case_participants
      const { error: participantError } = await supabase
        .from('case_participants')
        .upsert({
          case_id: caseItem.id,
          user_id: userId,
          role: 'divorcee'
        }, {
          onConflict: 'case_id,user_id'
        });
      
      if (participantError) {
        console.log(`      ❌ Error adding participant:`, participantError.message);
        continue;
      }
      console.log(`      ✅ Added as participant to case\n`);
    }
    
    // Verify participants
    const { data: participants } = await supabase
      .from('case_participants')
      .select('user_id')
      .eq('case_id', caseItem.id);
    
    console.log(`   📊 Case now has ${participants.length} participant(s)`);
    
    // Get names
    if (participants && participants.length > 0) {
      const userIds = participants.map(p => p.user_id);
      const { data: users } = await supabase
        .from('app_users')
        .select('name, email')
        .in('user_id', userIds);
      
      console.log(`   👥 Participants:`);
      users?.forEach(u => {
        console.log(`      • ${u.name || 'Unknown'} (${u.role || 'divorcee'})`);
      });
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }
  
  console.log('✅ Participant population complete!\n');
}

main();
