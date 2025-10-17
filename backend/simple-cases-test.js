import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Simple test to check uploads table and test the endpoint
async function testCasesEndpoint() {
  try {
    console.log('Testing cases endpoint...');
    
    // Step 1: Check existing uploads
    console.log('1. Checking existing uploads...');
    const { data: uploads, error: uploadsError } = await supabase
      .from('uploads')
      .select('*')
      .limit(5);
      
    if (uploadsError) {
      console.error('Error fetching uploads:', uploadsError);
      return;
    }
    
    console.log(`Found ${uploads?.length || 0} uploads in the database`);
    if (uploads && uploads.length > 0) {
      console.log('Sample upload:', uploads[0]);
    }
    
    // Step 2: Create a test case
    console.log('\n2. Creating test case...');
    const { data: testCase, error: caseError } = await supabase
      .from('cases')
      .insert([{
        // Only include required fields
      }])
      .select()
      .single();
      
    if (caseError) {
      console.error('Error creating test case:', caseError);
      return;
    }
    
    console.log('✅ Test case created:', { id: testCase.id, title: testCase.title });
    const caseId = testCase.id;
    
    // Step 3: Update an existing upload with case_id (if any uploads exist)
    if (uploads && uploads.length > 0) {
      console.log('\n3. Updating upload with case_id...');
      const uploadToUpdate = uploads[0];
      
      const { data: updatedUpload, error: updateError } = await supabase
        .from('uploads')
        .update({ case_id: caseId })
        .eq('id', uploadToUpdate.id)
        .select()
        .single();
        
      if (updateError) {
        console.error('Error updating upload:', updateError);
        return;
      }
      
      console.log('✅ Updated upload with case_id:', updatedUpload.id);
    } else {
      console.log('\n3. No existing uploads found, skipping update...');
    }
    
    // Step 4: Test the endpoint
    console.log(`\n4. Testing GET /api/cases/${caseId}/uploads...`);
    
    const response = await fetch(`http://localhost:4000/api/cases/${caseId}/uploads`);
    
    if (!response.ok) {
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    console.log(`\n🎉 Test completed successfully!`);
    console.log(`📂 Case ID: ${caseId}`);
    console.log(`📄 Uploads found: ${data.uploads?.length || 0}`);
    console.log(`🔗 Test URL: http://localhost:4000/api/cases/${caseId}/uploads`);
    
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testCasesEndpoint();