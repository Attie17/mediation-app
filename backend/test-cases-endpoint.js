import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Create test case and update uploads with case_id
async function setupCaseTestData() {
  const testUserId = '7f66f2e3-719e-430d-ac8b-77497ce89aec';
  
  try {
    console.log('Setting up test case data...');
    
    // Step 1: Create a test case
    console.log('1. Creating test case...');
    const { data: testCase, error: caseError } = await supabase
      .from('cases')
      .insert([{
        // Add any required case fields here based on your schema
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
      
    if (caseError) {
      console.error('Error creating test case:', caseError);
      console.log('\n❌ Cases table might not exist or case creation failed');
      console.log('\n📋 If the cases table doesn\'t exist, create it in Supabase:');
      console.log(`
CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  title TEXT,
  description TEXT
);
      `);
      return;
    }
    
    console.log('✅ Test case created:', { id: testCase.id });
    const caseId = testCase.id;
    
    // Step 2: Find some existing uploads to update with the case_id
    console.log('2. Finding existing uploads...');
    const { data: existingUploads, error: uploadsError } = await supabase
      .from('uploads')
      .select('*')
      .eq('user_id', testUserId)
      .limit(3);
      
    if (uploadsError) {
      console.error('Error finding uploads:', uploadsError);
      return;
    }
    
    if (!existingUploads || existingUploads.length === 0) {
      console.log('⚠️ No existing uploads found. Creating test uploads...');
      
      // Create test uploads
      const testUploads = [
        {
          user_id: testUserId,
          file_name: 'test-document-1.pdf',
          file_path: '/uploads/test-document-1.pdf',
          privacy_tier: 'public',
          case_id: caseId
        },
        {
          user_id: testUserId,
          file_name: 'test-document-2.pdf', 
          file_path: '/uploads/test-document-2.pdf',
          privacy_tier: 'private',
          case_id: caseId
        }
      ];
      
      const { data: newUploads, error: createError } = await supabase
        .from('uploads')
        .insert(testUploads)
        .select();
        
      if (createError) {
        console.error('Error creating test uploads:', createError);
        return;
      }
      
      console.log(`✅ Created ${newUploads.length} test uploads for case ${caseId}`);
    } else {
      // Step 3: Update existing uploads with the case_id
      console.log(`3. Updating ${existingUploads.length} uploads with case_id ${caseId}...`);
      
      const uploadIds = existingUploads.map(upload => upload.id);
      const { data: updatedUploads, error: updateError } = await supabase
        .from('uploads')
        .update({ case_id: caseId })
        .in('id', uploadIds)
        .select();
        
      if (updateError) {
        console.error('Error updating uploads:', updateError);
        return;
      }
      
      console.log(`✅ Updated ${updatedUploads.length} uploads with case_id ${caseId}`);
    }
    
    // Step 4: Test the new endpoint
    console.log(`\n4. Testing the /api/cases/${caseId}/uploads endpoint...`);
    
    const response = await fetch(`http://localhost:4000/api/cases/${caseId}/uploads`);
    
    if (!response.ok) {
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API Response:', JSON.stringify(data, null, 2));
    
    console.log(`\n🎉 Test completed successfully!`);
    console.log(`📂 Case ID: ${caseId}`);
    console.log(`📄 Uploads found: ${data.uploads?.length || 0}`);
    console.log(`🔗 Test URL: http://localhost:4000/api/cases/${caseId}/uploads`);
    
  } catch (err) {
    console.error('❌ Test setup failed:', err);
  }
}

setupCaseTestData();