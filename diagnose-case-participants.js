// Diagnostic script to check case participants
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function diagnose() {
  console.log('🔍 Diagnosing case participants...\n');

  // Get all cases
  const { data: cases, error: casesError } = await supabase
    .from('cases')
    .select('id, title, status')
    .order('created_at', { ascending: false });

  if (casesError) {
    console.error('❌ Error fetching cases:', casesError);
    return;
  }

  console.log(`📋 Found ${cases.length} cases\n`);

  for (const caseItem of cases) {
    console.log(`\n📁 Case: ${caseItem.title || 'Untitled'} (${caseItem.id.slice(0, 8)}...)`);
    console.log(`   Status: ${caseItem.status}`);

    // Get participants for this case
    const { data: participants, error: pError } = await supabase
      .from('case_participants')
      .select('user_id')
      .eq('case_id', caseItem.id);

    if (pError) {
      console.error('   ❌ Error fetching participants:', pError);
      continue;
    }

    if (!participants || participants.length === 0) {
      console.log('   ⚠️  NO PARTICIPANTS FOUND');
      continue;
    }

    console.log(`   👥 ${participants.length} participant(s):`);

    // Get user details
    const participantIds = participants.map(p => p.user_id);
    const { data: users, error: uError } = await supabase
      .from('users')
      .select('id, full_name, email, role')
      .in('id', participantIds);

    if (uError) {
      console.error('   ❌ Error fetching users:', uError);
      continue;
    }

    if (!users || users.length === 0) {
      console.log('   ⚠️  NO USER DATA FOUND');
      continue;
    }

    users.forEach(user => {
      const surname = user.full_name?.trim().split(' ').pop() || 'No surname';
      console.log(`      • ${user.full_name || 'No name'} (${user.role})`);
      console.log(`        Email: ${user.email}`);
      console.log(`        Surname: ${surname}`);
    });

    // Show what the couple_name would be
    const surnames = users
      .map(u => u.full_name?.trim().split(' ').pop())
      .filter(Boolean);
    
    let coupleName;
    if (surnames.length === 0) {
      coupleName = caseItem.title || 'Untitled Case';
    } else if (surnames.length === 1) {
      coupleName = surnames[0];
    } else {
      coupleName = surnames.join(' & ');
    }
    
    console.log(`   ✅ Couple Name: "${coupleName}"`);
  }
}

diagnose()
  .then(() => {
    console.log('\n✅ Diagnosis complete');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });
