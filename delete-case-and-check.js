const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🗑️  Deleting case 3fa96133-d9a3-4aee-91e3-9c86ce21663d...\n');
  
  const { error: deleteError } = await supabase
    .from('cases')
    .delete()
    .eq('id', '3fa96133-d9a3-4aee-91e3-9c86ce21663d');
  
  if (deleteError) {
    console.error('❌ Error deleting case:', deleteError.message);
  } else {
    console.log('✅ Case deleted successfully\n');
  }
  
  // Check remaining cases
  const { data: cases, error: casesError } = await supabase
    .from('cases')
    .select('id, status')
    .eq('status', 'open')
    .limit(10);
  
  console.log(`📊 Remaining open cases: ${cases?.length || 0}\n`);
  
  // Check case participants for each case
  if (cases && cases.length > 0) {
    console.log('👥 Checking participants for each case:\n');
    
    for (const caseItem of cases) {
      const { data: participants } = await supabase
        .from('case_participants')
        .select('user_id')
        .eq('case_id', caseItem.id);
      
      console.log(`  Case ${caseItem.id.slice(0, 8)}...`);
      console.log(`    Participants: ${participants?.length || 0}`);
      
      if (participants && participants.length > 0) {
        // Get user names
        const userIds = participants.map(p => p.user_id);
        const { data: users } = await supabase
          .from('app_users')
          .select('user_id, name, email')
          .in('user_id', userIds);
        
        users?.forEach(u => {
          console.log(`      - ${u.name} (${u.email})`);
        });
      }
      console.log('');
    }
  }
}

main();
