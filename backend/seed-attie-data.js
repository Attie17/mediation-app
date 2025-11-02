/**
 * Seed test data for Attie's mediator account
 * User ID: 44d32632-d369-5263-9111-334e03253f94
 * Email: attie@ngwaverley.co.za
 * Role: mediator
 */

import { supabase } from './src/db.js';

const ATTIE_USER_ID = '44d32632-d369-5263-9111-334e03253f94';

async function seedAttieData() {
  console.log('🌱 Seeding test data for Attie\'s account...\n');

  try {
    // Create 3 test cases assigned to Attie as mediator
    console.log('📋 Creating test cases...');
    
    const cases = [
      {
        description: 'Johnson Divorce - Property Settlement',
        status: 'open',
        mediator_id: ATTIE_USER_ID,
        created_at: new Date().toISOString()
      },
      {
        description: 'Smith Divorce - Child Custody',
        status: 'in_progress',
        mediator_id: ATTIE_USER_ID,
        created_at: new Date().toISOString()
      },
      {
        description: 'Brown Divorce - Asset Division',
        status: 'in_progress',
        mediator_id: ATTIE_USER_ID,
        created_at: new Date().toISOString()
      }
    ];

    const { data: createdCases, error: casesError } = await supabase
      .from('cases')
      .insert(cases)
      .select();

    if (casesError) {
      console.error('❌ Error creating cases:', casesError);
      throw casesError;
    }

    console.log(`✅ Created ${createdCases.length} cases`);

    // Create divorcee users for each case
    console.log('\n👥 Creating divorcee participants...');
    
    const divorcees = [
      { email: 'john.johnson@example.com', name: 'John Johnson', caseIndex: 0 },
      { email: 'mary.johnson@example.com', name: 'Mary Johnson', caseIndex: 0 },
      { email: 'bob.smith@example.com', name: 'Bob Smith', caseIndex: 1 },
      { email: 'alice.smith@example.com', name: 'Alice Smith', caseIndex: 1 },
      { email: 'charlie.brown@example.com', name: 'Charlie Brown', caseIndex: 2 },
      { email: 'diana.brown@example.com', name: 'Diana Brown', caseIndex: 2 }
    ];

    const participants = [];
    for (const divorcee of divorcees) {
      const caseId = createdCases[divorcee.caseIndex].id;
      
      // Create app_user
      const { data: appUser, error: appUserError } = await supabase
        .from('app_users')
        .upsert({
          email: divorcee.email,
          name: divorcee.name,
          role: 'divorcee'
        }, { onConflict: 'email' })
        .select()
        .single();

      if (appUserError) {
        console.warn(`⚠️  Warning creating app_user for ${divorcee.email}:`, appUserError.message);
        continue;
      }

      // Add as case participant
      participants.push({
        case_id: caseId,
        user_id: appUser.user_id,
        role: 'divorcee'
      });
    }

    // Add Attie as mediator to all cases
    for (const caseData of createdCases) {
      participants.push({
        case_id: caseData.id,
        user_id: ATTIE_USER_ID,
        role: 'mediator'
      });
    }

    const { error: participantsError } = await supabase
      .from('case_participants')
      .insert(participants);

    if (participantsError) {
      console.error('❌ Error creating participants:', participantsError);
      throw participantsError;
    }

    console.log(`✅ Created ${participants.length} case participants`);

    // Create pending document uploads for review
    console.log('\n📄 Creating pending document uploads...');
    
    const uploads = [
      {
        case_uuid: createdCases[0].id,
        user_uuid: participants.find(p => p.case_id === createdCases[0].id && p.role === 'divorcee')?.user_id,
        original_filename: 'marriage_certificate.pdf',
        storage_path: `cases/${createdCases[0].id}/marriage_certificate_${Date.now()}.pdf`,
        doc_type: 'marriage_certificate',
        file_size: 245760,
        mime_type: 'application/pdf',
        status: 'pending',
        uploaded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
      },
      {
        case_uuid: createdCases[0].id,
        user_uuid: participants.find(p => p.case_id === createdCases[0].id && p.role === 'divorcee')?.user_id,
        original_filename: 'financial_disclosure.pdf',
        storage_path: `cases/${createdCases[0].id}/financial_disclosure_${Date.now()}.pdf`,
        doc_type: 'financial_disclosure',
        file_size: 512000,
        mime_type: 'application/pdf',
        status: 'pending',
        uploaded_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
      },
      {
        case_uuid: createdCases[1].id,
        user_uuid: participants.find(p => p.case_id === createdCases[1].id && p.role === 'divorcee')?.user_id,
        original_filename: 'custody_proposal.pdf',
        storage_path: `cases/${createdCases[1].id}/custody_proposal_${Date.now()}.pdf`,
        doc_type: 'custody_agreement',
        file_size: 328000,
        mime_type: 'application/pdf',
        status: 'pending',
        uploaded_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
      },
      {
        case_uuid: createdCases[2].id,
        user_uuid: participants.find(p => p.case_id === createdCases[2].id && p.role === 'divorcee')?.user_id,
        original_filename: 'property_valuation.pdf',
        storage_path: `cases/${createdCases[2].id}/property_valuation_${Date.now()}.pdf`,
        doc_type: 'property_valuation',
        file_size: 890000,
        mime_type: 'application/pdf',
        status: 'approved',
        uploaded_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
      }
    ].filter(upload => upload.user_uuid); // Only include uploads with valid user IDs

    const { data: createdUploads, error: uploadsError } = await supabase
      .from('uploads')
      .insert(uploads)
      .select();

    if (uploadsError) {
      console.error('❌ Error creating uploads:', uploadsError);
      throw uploadsError;
    }

    console.log(`✅ Created ${createdUploads.length} document uploads (3 pending review)`);

    // Create mediation sessions
    console.log('\n📅 Creating mediation sessions...');
    
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const sessions = [
      {
        title: 'Initial Consultation - Johnson Case',
        session_date: tomorrow.toISOString().split('T')[0],
        session_time: '10:00:00',
        duration_minutes: 90,
        location: 'Conference Room A',
        case_id: createdCases[0].id,
        mediator_id: ATTIE_USER_ID,
        notes: 'First meeting to discuss property settlement terms',
        status: 'scheduled',
        created_by: ATTIE_USER_ID
      },
      {
        title: 'Follow-up Session - Smith Case',
        session_date: tomorrow.toISOString().split('T')[0],
        session_time: '14:00:00',
        duration_minutes: 60,
        location: 'Virtual Meeting',
        case_id: createdCases[1].id,
        mediator_id: ATTIE_USER_ID,
        notes: 'Review custody arrangement proposal',
        status: 'scheduled',
        created_by: ATTIE_USER_ID
      },
      {
        title: 'Asset Division Meeting - Brown Case',
        session_date: nextWeek.toISOString().split('T')[0],
        session_time: '11:00:00',
        duration_minutes: 120,
        location: 'Conference Room B',
        case_id: createdCases[2].id,
        mediator_id: ATTIE_USER_ID,
        notes: 'Final review of asset division agreement',
        status: 'scheduled',
        created_by: ATTIE_USER_ID
      }
    ];

    const { data: createdSessions, error: sessionsError } = await supabase
      .from('mediation_sessions')
      .insert(sessions)
      .select();

    if (sessionsError) {
      console.error('❌ Error creating sessions:', sessionsError);
      throw sessionsError;
    }

    console.log(`✅ Created ${createdSessions.length} mediation sessions`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Test data seeding completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   • Cases: ${createdCases.length}`);
    console.log(`   • Participants: ${participants.length}`);
    console.log(`   • Document Uploads: ${createdUploads.length} (3 pending review)`);
    console.log(`   • Mediation Sessions: ${createdSessions.length} (2 tomorrow, 1 next week)`);
    console.log('\n🎯 Your mediator dashboard should now show:');
    console.log(`   • Active Cases: ${createdCases.length}`);
    console.log(`   • Pending Reviews: 3`);
    console.log(`   • Today's Sessions: 2`);
    console.log('\n💡 Refresh your dashboard to see the new data!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    throw error;
  }
}

// Run the seed function
seedAttieData()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
