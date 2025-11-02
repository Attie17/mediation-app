// Populate test cases with divorce participants
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const { v5: uuidv5 } = require('uuid');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

console.log('🔧 Config check:');
console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Loaded' : '❌ Missing');
console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Loaded' : '❌ Missing');
console.log('');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Namespace for consistent UUID generation
const NS = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

// Test couples data
const testCouples = [
  {
    couple: ['John Smith', 'Mary Johnson'],
    caseTitle: 'Smith & Johnson Divorce',
    emails: ['john.smith@test.com', 'mary.johnson@test.com']
  },
  {
    couple: ['David Williams', 'Sarah Williams'],
    caseTitle: 'Williams Divorce',
    emails: ['david.williams@test.com', 'sarah.williams@test.com']
  },
  {
    couple: ['Michael Brown', 'Jennifer Davis'],
    caseTitle: 'Brown & Davis Divorce',
    emails: ['michael.brown@test.com', 'jennifer.davis@test.com']
  },
  {
    couple: ['Robert Miller', 'Linda Wilson'],
    caseTitle: 'Miller & Wilson Divorce',
    emails: ['robert.miller@test.com', 'linda.wilson@test.com']
  },
  {
    couple: ['James Moore', 'Patricia Taylor'],
    caseTitle: 'Moore & Taylor Divorce',
    emails: ['james.moore@test.com', 'patricia.taylor@test.com']
  },
  {
    couple: ['William Anderson', 'Barbara Thomas'],
    caseTitle: 'Anderson & Thomas Divorce',
    emails: ['william.anderson@test.com', 'barbara.thomas@test.com']
  }
];

async function populateCases() {
  console.log('🚀 Starting to populate test cases...\n');

  try {
    // 1. Get all existing cases
    const { data: cases, error: casesError } = await supabase
      .from('cases')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(6);

    if (casesError) {
      console.error('❌ Error fetching cases:', casesError);
      return;
    }

    if (!cases || cases.length === 0) {
      console.log('⚠️  No open cases found. Please create some cases first.');
      return;
    }

    console.log(`📋 Found ${cases.length} open cases`);
    console.log(`📊 First case structure:`, Object.keys(cases[0]));
    console.log('');

    // 2. For each case, create and add participants
    for (let i = 0; i < Math.min(cases.length, testCouples.length); i++) {
      const caseItem = cases[i];
      const testData = testCouples[i];

      console.log(`\n📁 Processing Case ${i + 1}: ${caseItem.id.slice(0, 8)}...`);
      console.log(`   Current title: "${caseItem.title || 'Untitled'}"`);
      console.log(`   New title: "${testData.caseTitle}"`);
      console.log(`   Couple: ${testData.couple.join(' & ')}`);

      // Update case title
      const { error: updateError } = await supabase
        .from('cases')
        .update({ title: testData.caseTitle })
        .eq('id', caseItem.id);

      if (updateError) {
        console.error(`   ❌ Error updating case title:`, updateError);
        continue;
      }
      console.log(`   ✅ Case title updated`);

      // Create/upsert participants
      for (let j = 0; j < testData.couple.length; j++) {
        const name = testData.couple[j];
        const email = testData.emails[j];
        const userId = uuidv5(email, NS);

        console.log(`\n   👤 Creating participant: ${name}`);
        console.log(`      Email: ${email}`);
        console.log(`      User ID: ${userId.slice(0, 8)}...`);

        // Upsert to app_users
        const { error: userError } = await supabase
          .from('app_users')
          .upsert({
            user_id: userId,
            email: email,
            name: name,
            role: 'divorcee'
          }, { onConflict: 'user_id' });

        if (userError) {
          console.error(`      ❌ Error creating user:`, userError);
          continue;
        }
        console.log(`      ✅ User created/updated in app_users`);

        // Check if already a participant
        const { data: existingParticipant } = await supabase
          .from('case_participants')
          .select('id')
          .eq('case_id', caseItem.id)
          .eq('user_id', userId)
          .maybeSingle();

        if (existingParticipant) {
          console.log(`      ℹ️  Already a participant in this case`);
          continue;
        }

        // Add to case_participants
        const { error: participantError } = await supabase
          .from('case_participants')
          .insert({
            case_id: caseItem.id,
            user_id: userId,
            role: 'participant'
          });

        if (participantError) {
          console.error(`      ❌ Error adding participant:`, participantError);
          continue;
        }
        console.log(`      ✅ Added as participant to case`);
      }

      // Verify participants
      const { data: participants, error: verifyError } = await supabase
        .from('case_participants')
        .select('user_id')
        .eq('case_id', caseItem.id);

      if (!verifyError && participants) {
        console.log(`\n   📊 Case now has ${participants.length} participant(s)`);
        
        // Get participant names
        const userIds = participants.map(p => p.user_id);
        const { data: users } = await supabase
          .from('app_users')
          .select('name, role')
          .in('user_id', userIds);

        if (users) {
          console.log(`   👥 Participants:`);
          users.forEach(u => {
            console.log(`      • ${u.name} (${u.role})`);
          });
        }
      }
    }

    console.log('\n\n✅ Test cases populated successfully!');
    console.log('\n📌 Next steps:');
    console.log('   1. Refresh the Documents Library page');
    console.log('   2. You should now see couple surnames like "Smith & Johnson" instead of "Nel"');
    console.log('   3. The 6 cases should display different couple names');

  } catch (err) {
    console.error('\n❌ Fatal error:', err);
  }
}

populateCases()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Script failed:', err);
    process.exit(1);
  });
