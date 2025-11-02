const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('📝 Updating name to Donald Trump...\n');
  
  const { error } = await supabase
    .from('app_users')
    .update({ name: 'Donald Trump' })
    .eq('user_id', '44d32632-d369-5263-9111-334e03253f94');
  
  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Name updated to Donald Trump');
  }
  
  // Now check which cases you're mediator for
  console.log('\n📋 Checking cases where you are mediator:\n');
  
  const { data: cases } = await supabase
    .from('cases')
    .select('id, status, mediator_id')
    .eq('mediator_id', '44d32632-d369-5263-9111-334e03253f94')
    .eq('status', 'open');
  
  console.log(`Found ${cases?.length || 0} cases:\n`);
  cases?.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.id.slice(0, 12)}...`);
  });
}

main();
