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
  console.log('🚀 Adding divorce participants to your cases...\n');
  
  // Get Attie's cases
  const { data: cases, error: casesError } = await supabase
    .from('cases')
    .select('id, status')
    .eq('mediator_id', '44d32632-d369-5263-9111-334e03253f94')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(2);
  
  if (casesError) {
    console.error('❌ Error fetching cases:', casesError.message);
    return;
  }
  
  console.log(`📋 Found ${cases.length} cases\n`);
  
  for (let i = 0; i < cases.length && i < testCouples.length; i++) {
    const caseItem = cases[i];
    const testCouple = testCouples[i];
    
    console.log(`📁 Case ${i + 1}: ${caseItem.id.slice(0, 8)}...`);
    console.log(`   Adding: ${testCouple.couple[0]} & ${testCouple.couple[1]}\n`);
    
    // Add both people in the couple
    for (let j = 0; j < 2; j++) {
      const personName = testCouple.couple[j];
      const personEmail = testCouple.emails[j];
      const userId = uuidv5(personEmail, UUID_NAMESPACE);
      
      console.log(`   👤 ${personName} (${personEmail})`);
      
      // Create/update user in app_users
      const { error: userError } = await supabase
        .from('app_users')
        .upsert({
          user_id: userId,
          email: personEmail,
          name: personName,
          role: 'divorcee',
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });
      
      if (userError) {
        console.log(`      ❌ User error: ${userError.message}`);
        continue;
      }
      
      // Check if already a participant
      const { data: existing } = await supabase
        .from('case_participants')
        .select('user_id')
        .eq('case_id', caseItem.id)
        .eq('user_id', userId)
        .single();
      
      if (existing) {
        console.log(`      ℹ️  Already a participant`);
        continue;
      }
      
      // Insert as new participant
      const { error: participantError } = await supabase
        .from('case_participants')
        .insert({
          case_id: caseItem.id,
          user_id: userId,
          role: 'divorcee'
        });
      
      if (participantError) {
        console.log(`      ❌ Participant error: ${participantError.message}`);
      } else {
        console.log(`      ✅ Added to case`);
      }
    }
    
    // Verify
    const { data: participants } = await supabase
      .from('case_participants')
      .select('user_id')
      .eq('case_id', caseItem.id);
    
    const userIds = participants.map(p => p.user_id);
    const { data: users } = await supabase
      .from('app_users')
      .select('name')
      .in('user_id', userIds);
    
    console.log(`\n   📊 Total participants: ${participants.length}`);
    console.log(`   👥 Names: ${users.map(u => u.name).join(', ')}`);
    console.log('\n' + '='.repeat(60) + '\n');
  }
  
  console.log('✅ Done!\n');
}

main();
