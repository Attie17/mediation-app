const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🔍 Finding cases with no divorcee participants...\n');
  
  // Get all cases for Attie Nel
  const { data: cases, error: casesError } = await supabase
    .from('cases')
    .select('id, status')
    .eq('mediator_id', '44d32632-d369-5263-9111-334e03253f94')
    .eq('status', 'open');
  
  if (casesError) {
    console.error('❌ Error fetching cases:', casesError.message);
    return;
  }
  
  console.log(`📋 Found ${cases.length} total cases\n`);
  
  const casesToDelete = [];
  
  // Check each case for divorcee participants
  for (const caseItem of cases) {
    const { data: divorcees } = await supabase
      .from('case_participants')
      .select('user_id')
      .eq('case_id', caseItem.id)
      .eq('role', 'divorcee');
    
    if (!divorcees || divorcees.length === 0) {
      console.log(`❌ Case ${caseItem.id.slice(0, 8)}... has NO divorcee participants`);
      casesToDelete.push(caseItem.id);
    } else {
      console.log(`✅ Case ${caseItem.id.slice(0, 8)}... has ${divorcees.length} divorcee(s)`);
    }
  }
  
  console.log(`\n🗑️  Found ${casesToDelete.length} cases to delete\n`);
  
  if (casesToDelete.length === 0) {
    console.log('✅ No cases to delete!');
    return;
  }
  
  // Delete the cases
  for (const caseId of casesToDelete) {
    console.log(`   Deleting ${caseId.slice(0, 8)}...`);
    
    const { error: deleteError } = await supabase
      .from('cases')
      .delete()
      .eq('id', caseId);
    
    if (deleteError) {
      console.log(`   ❌ Error: ${deleteError.message}`);
    } else {
      console.log(`   ✅ Deleted`);
    }
  }
  
  console.log('\n✅ Cleanup complete!\n');
  
  // Show remaining cases
  const { data: remaining } = await supabase
    .from('cases')
    .select('id')
    .eq('mediator_id', '44d32632-d369-5263-9111-334e03253f94')
    .eq('status', 'open');
  
  console.log(`📊 Remaining cases: ${remaining?.length || 0}\n`);
}

main();
