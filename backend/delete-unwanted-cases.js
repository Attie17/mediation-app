import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const userId = '44d32632-d369-5263-9111-334e03253f94';
const keepCases = [
  '8bca1d25-ae36-4f8b-a83f-acf08d1943b1', // Smith & Johnson
  '8fdeac58-03e4-4411-bb8f-61bd9aaca02c'  // Williams & Williams
];

async function main() {
  console.log('=== CHECKING ALL CASES ===\n');
  
  // Get all cases where user is mediator
  const { data: allCases, error } = await supabase
    .from('cases')
    .select('id, status, description, created_at')
    .eq('mediator_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cases:', error);
    return;
  }

  console.log(`Found ${allCases?.length || 0} cases with you as mediator:\n`);

  // Check each case
  for (const caseItem of allCases) {
    const isGood = keepCases.includes(caseItem.id);
    
    // Get divorcee participants
    const { data: participants } = await supabase
      .from('case_participants')
      .select('user_id, role')
      .eq('case_id', caseItem.id)
      .eq('role', 'divorcee');

    console.log(`${isGood ? '✅ KEEP' : '❌ DELETE'} ${caseItem.id.slice(0, 12)}...`);
    console.log(`   Status: ${caseItem.status}`);
    console.log(`   Created: ${new Date(caseItem.created_at).toLocaleDateString()}`);
    console.log(`   Description: ${caseItem.description || '(none)'}`);
    console.log(`   Divorcees: ${participants?.length || 0}`);
    console.log('');
  }

  // Cases to delete
  const toDelete = allCases.filter(c => !keepCases.includes(c.id));
  
  console.log('\n=== DELETING UNWANTED CASES ===');
  console.log(`Will delete ${toDelete.length} cases:\n`);

  for (const caseItem of toDelete) {
    console.log(`Deleting ${caseItem.id.slice(0, 12)}...`);
    
    // Delete participants first (foreign key constraint)
    const { error: partError } = await supabase
      .from('case_participants')
      .delete()
      .eq('case_id', caseItem.id);
    
    if (partError) {
      console.error(`  ❌ Error deleting participants:`, partError.message);
      continue;
    }
    
    // Delete the case
    const { error: caseError } = await supabase
      .from('cases')
      .delete()
      .eq('id', caseItem.id);
    
    if (caseError) {
      console.error(`  ❌ Error deleting case:`, caseError.message);
    } else {
      console.log(`  ✅ Deleted successfully`);
    }
  }

  console.log('\n=== VERIFICATION ===');
  const { data: remainingCases } = await supabase
    .from('cases')
    .select('id')
    .eq('mediator_id', userId);
  
  console.log(`\n✅ ${remainingCases?.length || 0} cases remaining (should be 2)`);
  if (remainingCases?.length === 2) {
    console.log('✅ SUCCESS! Only your 2 cases with divorce couples remain.');
  }
}

main().catch(console.error);
