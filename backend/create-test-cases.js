// Create test data: 2 divorcee cases with realistic data
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestCases() {
  console.log('🚀 Creating test data for 2 divorcee cases...\n');

  try {
    // Get existing divorcee users
    const { data: divorceeUsers, error: usersError } = await supabase
      .from('app_users')
      .select('user_id, email, name')
      .eq('role', 'divorcee')
      .limit(2);

    if (usersError) {
      console.error('❌ Error fetching divorcee users:', usersError);
      return;
    }

    if (!divorceeUsers || divorceeUsers.length === 0) {
      console.log('❌ No divorcee users found. Please create divorcee users first.');
      return;
    }

    console.log(`✅ Found ${divorceeUsers.length} divorcee user(s)`);

    // Get a mediator user
    const { data: mediatorUsers, error: mediatorError } = await supabase
      .from('app_users')
      .select('user_id, email, name')
      .eq('role', 'mediator')
      .limit(1);

    const mediatorId = mediatorUsers?.[0]?.user_id;
    console.log(`✅ Found mediator: ${mediatorUsers?.[0]?.email || 'None'}\n`);

    // Create cases for each divorcee
    for (let i = 0; i < divorceeUsers.length; i++) {
      const divorcee = divorceeUsers[i];
      console.log(`\n📋 Creating case ${i + 1} for ${divorcee.email}...`);

      // Create a case
      const { data: newCase, error: caseError } = await supabase
        .from('cases')
        .insert({
          status: i === 0 ? 'open' : 'in_progress',
          description: `Mediation case for ${divorcee.name || divorcee.email || 'Divorcee'}`,
          mediator_id: mediatorId || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (caseError) {
        console.error('❌ Error creating case:', caseError);
        continue;
      }

      console.log(`   ✅ Case created: ${newCase.id}`);
      const caseId = newCase.id;

      // Add divorcee as participant
      const { error: participantError1 } = await supabase
        .from('case_participants')
        .insert({
          case_id: caseId,
          user_id: divorcee.user_id,
          role: 'divorcee'
        });

      if (participantError1) {
        console.log('   ⚠️ Could not add divorcee as participant:', participantError1.message);
      } else {
        console.log(`   ✅ Added divorcee as participant`);
      }

      // Add mediator if available
      if (mediatorId) {
        const { error: participantError2 } = await supabase
          .from('case_participants')
          .insert({
            case_id: caseId,
            user_id: mediatorId,
            role: 'mediator'
          });

        if (participantError2) {
          console.log('   ⚠️ Could not add mediator as participant:', participantError2.message);
        } else {
          console.log(`   ✅ Added mediator as participant`);
        }
      }

      // Create some test documents
      const documents = [
        { name: 'Marriage Certificate', tier: 'public' },
        { name: 'Financial Statement', tier: 'private' },
        { name: 'Property List', tier: 'public' }
      ];

      for (const doc of documents) {
        const { error: uploadError } = await supabase
          .from('uploads')
          .insert({
            case_id: caseId,
            user_id: divorcee.user_id,
            file_name: `${doc.name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
            file_path: `/uploads/${caseId}/${doc.name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
            privacy_tier: doc.tier,
            uploaded_at: new Date().toISOString()
          });

        if (!uploadError) {
          console.log(`   ✅ Created document: ${doc.name}`);
        }
      }

      // Create some requirements
      const requirements = [
        { title: 'Income Tax Returns (Last 2 Years)', status: i === 0 ? 'completed' : 'pending' },
        { title: 'Bank Statements', status: 'pending' },
        { title: 'Child Custody Agreement Draft', status: 'pending' }
      ];

      for (const req of requirements) {
        const { error: reqError } = await supabase
          .from('case_requirements')
          .insert({
            case_id: caseId,
            title: req.title,
            status: req.status,
            created_at: new Date().toISOString()
          });

        if (!reqError) {
          console.log(`   ✅ Created requirement: ${req.title} (${req.status})`);
        }
      }

      // Create some messages
      const messages = [
        'Welcome to your mediation case! I\'ll be guiding you through the process.',
        'Please upload your financial documents when you get a chance.',
        'I\'ve reviewed your initial submissions. Everything looks good so far!'
      ];

      if (mediatorId) {
        for (const msg of messages) {
          const { error: msgError } = await supabase
            .from('messages')
            .insert({
              case_id: caseId,
              sender_id: mediatorId,
              recipient_id: divorcee.user_id,
              content: msg,
              read: i === 1 ? false : true, // Make some unread for second user
              created_at: new Date().toISOString()
            });

          if (!msgError) {
            console.log(`   ✅ Created message`);
          }
        }
      }

      console.log(`\n   🎉 Case ${i + 1} complete! Case ID: ${caseId}`);
      console.log(`   📝 Set this as active case: localStorage.setItem('activeCaseId', '${caseId}')`);
    }

    console.log('\n\n✨ Test data creation complete!');
    console.log('\n📋 Summary:');
    console.log(`   - Created ${divorceeUsers.length} cases`);
    console.log(`   - Added participants (divorcees + mediator)`);
    console.log(`   - Created 3 documents per case`);
    console.log(`   - Created 3 requirements per case`);
    console.log(`   - Created 3 messages per case`);
    console.log('\n💡 Next steps:');
    console.log('   1. Login as divorcee@test.com');
    console.log('   2. The dashboard should now show real numbers');
    console.log('   3. Case Overview and Case Details will have data\n');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

createTestCases();
