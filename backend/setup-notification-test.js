import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function setupTestDataForNotifications() {
  try {
    console.log('🚀 Setting up test data for requirement notifications...');
    
    // Use the existing test user ID
    const testUserId = '7f66f2e3-719e-430d-ac8b-77497ce89aec';
    console.log(`📧 Using existing test user: ${testUserId}`);
    
    // Step 1: Create an upload for this user associated with case 4
    console.log('\n1. Creating test upload for case 4...');
    const { data: uploadData, error: uploadError } = await supabase
      .from('uploads')
      .insert([{
        user_id: testUserId,
        case_id: 4,
        doc_type: 'id_document',
        status: 'pending'
      }])
      .select()
      .single();
      
    if (uploadError) {
      if (uploadError.code === '23505') { // Unique constraint violation
        console.log('📄 Test upload already exists, checking existing uploads...');
        
        // Check if there are uploads for this case and user
        const { data: existingUploads } = await supabase
          .from('uploads')
          .select('*')
          .eq('case_id', 4)
          .eq('user_id', testUserId);
          
        if (existingUploads && existingUploads.length > 0) {
          console.log(`✅ Found ${existingUploads.length} existing uploads for case 4`);
        } else {
          console.log('❌ No existing uploads found for case 4');
          return;
        }
      } else {
        console.error('Error creating test upload:', uploadError);
        return;
      }
    } else {
      console.log('✅ Created test upload:', uploadData.id);
    }
    
    console.log('\n🎯 Test data setup complete!');
    console.log(`📧 Test user ID: ${testUserId}`);
    console.log('� Case ID: 4');
    console.log('\n🔔 Ready to test notifications!');
    console.log('📝 You can now create/update/delete requirements for case 4');
    console.log(`� Check notifications with: GET /api/notifications?userId=${testUserId}`);
    
    return testUserId;
    
  } catch (err) {
    console.error('Error setting up test data:', err);
  }
}

// Run the setup
setupTestDataForNotifications().then(userId => {
  if (userId) {
    console.log(`\n🔔 Ready to test notifications for user: ${userId}`);
    console.log('📝 You can now create/update/delete requirements for case 4 and check for notifications');
  }
  process.exit(0);
});