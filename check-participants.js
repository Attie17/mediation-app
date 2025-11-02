/**
 * Check all participants in the case
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CASE_ID = '3bcb2937-0e55-451a-a9fd-659187af84d4';

async function checkParticipants() {
  console.log('🔍 Checking ALL participants in case...\n');
  
  const { data: participants, error } = await supabase
    .from('case_participants')
    .select(`
      user_id,
      role,
      created_at,
      app_users!inner(name, email, created_at)
    `)
    .eq('case_id', CASE_ID)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('❌ Error:', error);
    return;
  }
  
  console.log(`Found ${participants.length} participants:\n`);
  participants.forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.app_users.name}`);
    console.log(`   Email: ${p.app_users.email}`);
    console.log(`   Role: ${p.role}`);
    console.log(`   User ID: ${p.user_id}`);
    console.log(`   Joined: ${new Date(p.created_at).toLocaleString()}`);
    console.log('');
  });
  
  const mediators = participants.filter(p => p.role === 'mediator');
  const divorcees = participants.filter(p => p.role === 'divorcee');
  const lawyers = participants.filter(p => p.role === 'lawyer');
  
  console.log('📊 Summary:');
  console.log(`   Mediators: ${mediators.length}`);
  console.log(`   Divorcees: ${divorcees.length}`);
  console.log(`   Lawyers: ${lawyers.length}`);
  console.log(`   Total: ${participants.length}`);
}

checkParticipants().catch(console.error);
