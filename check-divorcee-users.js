const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDivorceeUsers() {
  console.log('🔍 Checking for divorcee users...\n');
  
  // Get divorcee users
  const { data: users, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('role', 'divorcee')
    .limit(10);
    
  if (error) {
    console.error('❌ Error fetching divorcee users:', error);
    return;
  }
  
  console.log(`Found ${users.length} divorcee users:\n`);
  users.forEach(user => {
    console.log(`  - ${user.email} (${user.user_id})`);
    console.log(`    Name: ${user.name || 'N/A'}`);
    console.log(`    Created: ${user.created_at}`);
    console.log('');
  });
  
  // Check if they have cases
  if (users.length > 0) {
    console.log('📋 Checking cases for divorcee users...\n');
    
    for (const user of users) {
      const { data: cases, error: caseError } = await supabase
        .from('case_participants')
        .select('case_id, role')
        .eq('user_id', user.user_id)
        .eq('role', 'divorcee');
        
      if (caseError) {
        console.error(`  ❌ Error for ${user.email}:`, caseError.message);
      } else {
        console.log(`  ${user.email}: ${cases.length} case(s)`);
        cases.forEach(c => {
          console.log(`    - Case ${c.case_id}`);
        });
      }
    }
  }
  
  process.exit(0);
}

checkDivorceeUsers();
