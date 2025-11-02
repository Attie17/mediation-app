import { supabase } from './src/db.js';

const ATTIE_USER_ID = '44d32632-d369-5263-9111-334e03253f94';

console.log('🔍 Checking cases for Attie...\n');

const { data: cases, error } = await supabase
  .from('cases')
  .select('*')
  .eq('mediator_id', ATTIE_USER_ID);

if (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

if (!cases || cases.length === 0) {
  console.log('❌ No cases found!');
  console.log('Run: node seed-attie-data.js');
  process.exit(1);
}

console.log(`✅ Found ${cases.length} cases:\n`);
cases.forEach((c, i) => {
  console.log(`${i + 1}. ${c.description}`);
  console.log(`   ID: ${c.id}`);
  console.log(`   Status: ${c.status}\n`);
});

console.log('━'.repeat(60));
console.log('🎯 QUICK FIX - Paste this in browser console:');
console.log('━'.repeat(60));
console.log(`\nlocalStorage.setItem('activeCaseId', '${cases[0].id}');\nlocation.reload();\n`);
console.log('━'.repeat(60));
console.log('Or open this file in browser:');
console.log('file:///c:/mediation-app/set-active-case.html');
console.log('━'.repeat(60));
