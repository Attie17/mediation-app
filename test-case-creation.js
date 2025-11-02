// Test case creation with auto-conversation generation
import fetch from 'node-fetch';

const API_URL = 'http://localhost:4000';

async function testCaseCreation() {
  console.log('\n🧪 Testing Case Creation with Auto-Conversations\n');

  // Test user credentials
  const testUser = {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'bob@example.com'
  };

  const caseData = {
    title: 'Test Case - Auto Conversations',
    description: 'Testing automatic conversation creation',
    personalInfo: {
      name: 'Bob Test',
      dateOfBirth: '1985-05-15',
      email: 'bob@example.com',
      phone: '555-0123',
      address: '123 Test St'
    },
    marriageDetails: {
      dateOfMarriage: '2010-06-20',
      separationDate: '2024-01-15'
    },
    children: [],
    financialSituation: {},
    preferences: {},
    status: 'open'
  };

  try {
    // Create case
    console.log('📝 Creating new case...');
    const createResponse = await fetch(`${API_URL}/api/cases`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-fake-token',
        'x-dev-user-id': testUser.id,
        'x-dev-email': testUser.email
      },
      body: JSON.stringify(caseData)
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error('❌ Case creation failed:', error);
      return;
    }

    const caseResult = await createResponse.json();
    console.log('✅ Case created:', caseResult.case_id);
    console.log('   Participants:', caseResult.participants.length);

    // Wait a moment for conversations to be created
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check conversations for the new case
    console.log('\n💬 Checking conversations...');
    const convResponse = await fetch(`${API_URL}/api/conversations/case/${caseResult.case_id}`, {
      headers: {
        'Authorization': 'Bearer dev-fake-token',
        'x-dev-user-id': testUser.id,
        'x-dev-email': testUser.email
      }
    });

    if (!convResponse.ok) {
      console.error('❌ Failed to fetch conversations');
      return;
    }

    const convResult = await convResponse.json();
    console.log(`✅ Found ${convResult.conversations?.length || 0} conversation(s):`);
    
    if (convResult.conversations) {
      convResult.conversations.forEach((conv, i) => {
        console.log(`\n${i + 1}. ${conv.title} (${conv.conversation_type})`);
        console.log(`   Participants: ${conv.participants?.length || 0}`);
        conv.participants?.forEach(p => {
          console.log(`     - ${p.email} (${p.role})`);
        });
      });
    }

    console.log('\n✨ Test complete!\n');

    // Note about cleanup
    console.log('💡 Note: Test case created with ID:', caseResult.case_id);
    console.log('   You may want to delete this test case from the database.\n');

  } catch (err) {
    console.error('❌ Test error:', err.message);
  }
}

testCaseCreation();
