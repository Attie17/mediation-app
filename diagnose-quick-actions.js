/**
 * DIAGNOSTIC SCRIPT: Quick Action Cards Investigation
 * This script checks all aspects of the Quick Action cards functionality
 */

console.log('🔍 QUICK ACTION CARDS DIAGNOSTIC REPORT\n');
console.log('=' .repeat(60));

// 1. Check localStorage
console.log('\n1️⃣ LOCALSTORAGE CHECK:');
console.log('-'.repeat(60));
const authToken = localStorage.getItem('auth_token');
const activeCaseId = localStorage.getItem('activeCaseId');
console.log('✓ auth_token:', authToken ? `Present (${authToken.substring(0, 20)}...)` : '❌ MISSING');
console.log('✓ activeCaseId:', activeCaseId ? `Present (${activeCaseId})` : '❌ MISSING - THIS IS THE PROBLEM!');

// 2. Check if user is logged in
console.log('\n2️⃣ AUTHENTICATION CHECK:');
console.log('-'.repeat(60));
if (authToken) {
    fetch('http://localhost:4000/api/users/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(r => r.json())
    .then(user => {
        console.log('✓ User logged in:', user.email);
        console.log('✓ User role:', user.role);
        console.log('✓ User ID:', user.user_id || user.id);
    })
    .catch(err => console.log('❌ Auth check failed:', err.message));
} else {
    console.log('❌ No auth token - cannot check user');
}

// 3. Check if cases exist
console.log('\n3️⃣ CASES CHECK:');
console.log('-'.repeat(60));
if (authToken) {
    const userId = '44d32632-d369-5263-9111-334e03253f94'; // Attie's ID
    fetch(`http://localhost:4000/api/cases/user/${userId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
    })
    .then(r => r.json())
    .then(cases => {
        console.log(`✓ Found ${cases.length} cases`);
        if (cases.length > 0) {
            console.log('\nAvailable cases:');
            cases.forEach((c, i) => {
                console.log(`  ${i + 1}. ${c.description || c.case_name}`);
                console.log(`     ID: ${c.case_id}`);
                console.log(`     Status: ${c.status}`);
            });
            
            if (!activeCaseId && cases.length > 0) {
                console.log('\n⚠️  SOLUTION: Set activeCaseId to one of these case IDs');
                console.log(`   Run: localStorage.setItem('activeCaseId', '${cases[0].case_id}');`);
            }
        }
    })
    .catch(err => console.log('❌ Cases fetch failed:', err.message));
}

// 4. Check routes
console.log('\n4️⃣ ROUTES CONFIGURATION:');
console.log('-'.repeat(60));
console.log('Quick Action cards navigate to:');
console.log('  • My Cases: /case/{activeCaseId}');
console.log('  • Documents: /cases/{activeCaseId}/uploads');
console.log('  • Messages: /case/{activeCaseId}');
console.log('  • Contacts: /profile');
console.log('\nExpected routes in App.jsx:');
console.log('  ✓ /case/:caseId → CaseOverviewPage');
console.log('  ✓ /cases/:id/uploads → UploadsPage');
console.log('  ✓ /profile → ProfileSetup');

// 5. Check onClick handlers
console.log('\n5️⃣ EVENT HANDLERS CHECK:');
console.log('-'.repeat(60));
console.log('Looking for Quick Action cards...');
const quickActionCards = document.querySelectorAll('a[href="#"]');
console.log(`✓ Found ${quickActionCards.length} clickable links with href="#"`);

if (quickActionCards.length === 0) {
    console.log('❌ No Quick Action cards found! Are you on the homepage?');
} else {
    console.log('✓ Cards should have onClick handlers with e.preventDefault()');
}

// 6. Summary and recommendations
console.log('\n6️⃣ DIAGNOSIS SUMMARY:');
console.log('-'.repeat(60));
if (!activeCaseId && authToken) {
    console.log('❌ ROOT CAUSE: No activeCaseId in localStorage');
    console.log('');
    console.log('SOLUTION:');
    console.log('1. Open set-active-case.html in your browser');
    console.log('2. Click on any case to set it as active');
    console.log('3. Return to homepage and try the Quick Action buttons');
    console.log('');
    console.log('OR run in console:');
    console.log('  localStorage.setItem("activeCaseId", "<case-id-from-above>");');
} else if (!authToken) {
    console.log('❌ ROOT CAUSE: Not logged in');
    console.log('SOLUTION: Login at http://localhost:5173/signin');
} else {
    console.log('✅ All checks passed! Quick Action buttons should work.');
    console.log(`✓ Active case ID: ${activeCaseId}`);
}

console.log('\n' + '='.repeat(60));
console.log('📋 Paste this script in browser console on http://localhost:5173');
console.log('='.repeat(60));
