// Fix Bob's missing role
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixBobRole() {
  console.log('🔍 Checking Bob\'s current record...');
  
  const { data: bob, error: selectError } = await supabase
    .from('app_users')
    .select('user_id, email, name, role')
    .eq('email', 'bob@example.com')
    .single();
  
  if (selectError) {
    console.error('❌ Error finding Bob:', selectError.message);
    return;
  }
  
  console.log('📋 Current Bob record:', bob);
  
  if (!bob.role) {
    console.log('⚠️  Role is NULL! Fixing...');
    
    const { data: updated, error: updateError } = await supabase
      .from('app_users')
      .update({ role: 'divorcee' })
      .eq('email', 'bob@example.com')
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating:', updateError.message);
      return;
    }
    
    console.log('✅ Updated Bob record:', updated);
  } else {
    console.log('✅ Bob already has role:', bob.role);
  }
}

fixBobRole().catch(console.error);
