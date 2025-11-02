const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kjmwaoainmyzbmvalizu.supabase.co',
  'sb_secret_rp99nfaT-WK7P2LLLUVoEw_B7xQtSCt'
);

async function checkConversations() {
  const caseId = '3bcb2937-0e55-451a-a9fd-659187af84d4';
  const userId = '22222222-2222-2222-2222-222222222222';

  console.log('\n🔍 Checking conversations for Bob\'s case...\n');
  console.log('Case ID:', caseId);
  console.log('User ID:', userId);
  console.log('');

  // Check conversations for this case
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('case_id', caseId);

  if (convError) {
    console.error('❌ Error fetching conversations:', convError);
    return;
  }

  console.log(`📋 Found ${conversations.length} conversation(s) for this case:\n`);
  conversations.forEach((conv, i) => {
    console.log(`${i + 1}. ID: ${conv.id}`);
    console.log(`   Type: ${conv.conversation_type}`);
    console.log(`   Title: ${conv.title}`);
    console.log(`   Created: ${conv.created_at}`);
    console.log('');
  });

  // Check participants for each conversation
  for (const conv of conversations) {
    const { data: participants, error: partError } = await supabase
      .from('conversation_participants')
      .select(`
        user_id,
        joined_at,
        app_users (
          user_id,
          email,
          role
        )
      `)
      .eq('conversation_id', conv.id);

    if (partError) {
      console.error(`❌ Error fetching participants for ${conv.id}:`, partError);
      continue;
    }

    console.log(`👥 Participants in "${conv.title}" (${conv.conversation_type}):`);
    participants.forEach(p => {
      const isCurrentUser = p.user_id === userId;
      console.log(`   ${isCurrentUser ? '👉' : '  '} ${p.app_users?.email || 'Unknown'} (${p.user_id})`);
    });
    console.log('');
  }

  // Test the exact query from the backend
  console.log('\n🧪 Testing backend query logic...\n');
  
  const { data: accessibleConvs, error: accessError } = await supabase
    .from('conversations')
    .select(`
      id,
      case_id,
      conversation_type,
      title,
      created_at,
      conversation_participants!inner (
        user_id
      )
    `)
    .eq('case_id', caseId)
    .eq('conversation_participants.user_id', userId);

  if (accessError) {
    console.error('❌ Query error:', accessError);
  } else {
    console.log(`✅ Backend query returned ${accessibleConvs.length} accessible conversation(s)`);
    accessibleConvs.forEach(c => {
      console.log(`   - ${c.title} (${c.conversation_type})`);
    });
  }
}

checkConversations().then(() => {
  console.log('\n✨ Check complete!\n');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
