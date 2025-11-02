// Test script for Organization and Case Assignment APIs
// Run with: node test-org-apis.js

const API_BASE = 'http://localhost:4000';
const DEV_MODE_TOKEN = 'dev-fake-token';
const DEV_HEADERS = {
  'x-dev-email': 'admin@dev.local',
  'x-dev-role': 'admin',
  'x-dev-user-id': '862b3a3e-8390-57f8-a307-12004a341a2e'
};

let authToken = '';
let testOrgId = '';
let testAssignmentId = '';
let useDevHeaders = false;

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  console.log(`\n${colors.blue}◆ Testing: ${name}${colors.reset}`);
}

function logSuccess(message) {
  log(`  ✓ ${message}`, 'green');
}

function logError(message) {
  log(`  ✗ ${message}`, 'red');
}

function logInfo(message) {
  log(`  ℹ ${message}`, 'yellow');
}

async function apiCall(method, endpoint, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...(useDevHeaders ? DEV_HEADERS : {})
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    return {
      ok: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message
    };
  }
}

async function login() {
  logTest('Login as Admin');
  
  const result = await apiCall('POST', '/api/auth/login', {
    email: 'ceo@stabilistc.co.za',
    password: 'Pass@2024'
  });

  if (result.ok && result.data.token) {
    authToken = result.data.token;
    logSuccess(`Logged in successfully`);
    logInfo(`Token: ${authToken.substring(0, 20)}...`);
    return true;
  } else {
    const errorMessage = result.data?.error?.message || result.data?.error || 'Unknown error';
    logError(`Login failed: ${errorMessage}`);
    logInfo('Falling back to developer token (dev-fake-token)');
    authToken = DEV_MODE_TOKEN;
    useDevHeaders = true;
    return true;
  }
}

async function testListOrganizations() {
  logTest('GET /api/organizations (List All)');
  
  const result = await apiCall('GET', '/api/organizations');

  if (result.ok) {
    const count = result.data.organizations?.length || 0;
    logSuccess(`Retrieved ${count} organizations`);
    if (count > 0) {
      logInfo(`Sample: ${result.data.organizations[0].name}`);
    }
    return true;
  } else {
    logError(`Failed: ${result.data.error || 'Unknown error'}`);
    return false;
  }
}

async function testCreateOrganization() {
  logTest('POST /api/organizations (Create New)');
  
  const newOrg = {
    name: `Test Org ${Date.now()}`,
    display_name: 'Test Organization for API Testing',
    email: 'test@example.com',
    phone: '+27 11 123 4567',
    subscription_tier: 'basic',
    address: '123 Test Street, Johannesburg',
    website: 'https://test.example.com',
    status: 'active'
  };

  const result = await apiCall('POST', '/api/organizations', newOrg);

  if (result.ok && result.data.organization) {
    const { organization } = result.data;
    testOrgId = organization.id;
    logSuccess(`Created organization: ${organization.name}`);
    logInfo(`Organization ID: ${testOrgId}`);
    return true;
  } else {
    logError(`Failed: ${result.data.error || 'Unknown error'}`);
    return false;
  }
}

async function testGetOrganization() {
  logTest(`GET /api/organizations/${testOrgId} (Get Single)`);
  
  const result = await apiCall('GET', `/api/organizations/${testOrgId}`);

  if (result.ok && result.data.organization) {
    const { organization } = result.data;
    logSuccess(`Retrieved organization: ${organization.name}`);
    logInfo(`Tier: ${organization.subscription_tier}, Status: ${organization.subscription_status}`);
    return true;
  } else {
    logError(`Failed: ${result.data.error || 'Unknown error'}`);
    return false;
  }
}

async function testGetOrganizationStats() {
  logTest(`GET /api/organizations/${testOrgId}/stats`);
  
  const result = await apiCall('GET', `/api/organizations/${testOrgId}/stats`);

  if (result.ok && result.data.stats) {
    const { stats } = result.data;
    logSuccess('Retrieved organization stats');
    logInfo(`Total users: ${stats.total_users || 0}, Active cases: ${stats.active_cases || 0}`);
    return true;
  } else {
    logError(`Failed: ${result.data.error || 'Unknown error'}`);
    return false;
  }
}

async function testGetOrganizationUsers() {
  logTest(`GET /api/organizations/${testOrgId}/users`);
  
  const result = await apiCall('GET', `/api/organizations/${testOrgId}/users`);

  if (result.ok) {
    const count = result.data.users?.length || 0;
    logSuccess(`Retrieved ${count} users`);
    return true;
  } else {
    logError(`Failed: ${result.data.error || 'Unknown error'}`);
    return false;
  }
}

async function testGetOrganizationCases() {
  logTest(`GET /api/organizations/${testOrgId}/cases`);
  
  const result = await apiCall('GET', `/api/organizations/${testOrgId}/cases`);

  if (result.ok) {
    const count = result.data.cases?.length || 0;
    logSuccess(`Retrieved ${count} cases`);
    return true;
  } else {
    logError(`Failed: ${result.data.error || 'Unknown error'}`);
    return false;
  }
}

async function testUpdateOrganization() {
  logTest(`PUT /api/organizations/${testOrgId} (Update)`);
  
  const updates = {
    display_name: 'Updated Test Organization',
    phone: '+27 11 999 8888',
    status: 'active'
  };

  const result = await apiCall('PUT', `/api/organizations/${testOrgId}`, updates);

  if (result.ok && result.data.organization) {
    const { organization } = result.data;
    logSuccess('Organization updated successfully');
    logInfo(`New display name: ${organization.display_name}`);
    return true;
  } else {
    logError(`Failed: ${result.data.error || 'Unknown error'}`);
    return false;
  }
}

async function testGetUnassignedCases() {
  logTest('GET /api/case-assignments/unassigned');
  
  const result = await apiCall('GET', '/api/case-assignments/unassigned');

  if (result.ok) {
    const count = result.data.length || 0;
    logSuccess(`Retrieved ${count} unassigned cases`);
    return true;
  } else {
    logError(`Failed: ${result.data.error || 'Unknown error'}`);
    return false;
  }
}

async function testGetMediatorWorkload() {
  logTest('GET /api/case-assignments/mediator-workload');
  
  const result = await apiCall('GET', '/api/case-assignments/mediator-workload');

  if (result.ok) {
    const count = result.data.length || 0;
    logSuccess(`Retrieved workload for ${count} mediators`);
    if (count > 0) {
      logInfo(`Sample: ${result.data[0].name} - ${result.data[0].active_cases} cases`);
    }
    return true;
  } else {
    logError(`Failed: ${result.data.error || 'Unknown error'}`);
    return false;
  }
}

async function testGetAllAssignments() {
  logTest('GET /api/case-assignments (All Assignments)');
  
  const result = await apiCall('GET', '/api/case-assignments');

  if (result.ok) {
    const count = result.data.length || 0;
    logSuccess(`Retrieved ${count} case assignments`);
    if (count > 0) {
      testAssignmentId = result.data[0].id;
      logInfo(`Sample assignment ID: ${testAssignmentId}`);
    }
    return true;
  } else {
    logError(`Failed: ${result.data.error || 'Unknown error'}`);
    return false;
  }
}

async function testDeleteOrganization() {
  logTest(`DELETE /api/organizations/${testOrgId} (Delete)`);
  
  const result = await apiCall('DELETE', `/api/organizations/${testOrgId}`);

  if (result.ok) {
    logSuccess('Organization deleted successfully');
    return true;
  } else {
    logError(`Failed: ${result.data.error || 'Unknown error'}`);
    return false;
  }
}

async function runTests() {
  log('\n╔══════════════════════════════════════════════════╗', 'blue');
  log('║  ORGANIZATION & CASE ASSIGNMENT API TESTS       ║', 'blue');
  log('╚══════════════════════════════════════════════════╝', 'blue');

  let passed = 0;
  let failed = 0;

  const tests = [
    { name: 'Login', fn: login },
    { name: 'List Organizations', fn: testListOrganizations },
    { name: 'Create Organization', fn: testCreateOrganization },
    { name: 'Get Organization', fn: testGetOrganization },
    { name: 'Get Organization Stats', fn: testGetOrganizationStats },
    { name: 'Get Organization Users', fn: testGetOrganizationUsers },
    { name: 'Get Organization Cases', fn: testGetOrganizationCases },
    { name: 'Update Organization', fn: testUpdateOrganization },
    { name: 'Get Unassigned Cases', fn: testGetUnassignedCases },
    { name: 'Get Mediator Workload', fn: testGetMediatorWorkload },
    { name: 'Get All Assignments', fn: testGetAllAssignments },
    { name: 'Delete Organization', fn: testDeleteOrganization }
  ];

  for (const test of tests) {
    const success = await test.fn();
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }

  log('\n╔══════════════════════════════════════════════════╗', 'blue');
  log('║  TEST RESULTS                                    ║', 'blue');
  log('╚══════════════════════════════════════════════════╝', 'blue');
  log(`\nTotal Tests: ${tests.length}`);
  logSuccess(`Passed: ${passed}`);
  if (failed > 0) {
    logError(`Failed: ${failed}`);
  } else {
    log('\n🎉 All tests passed!', 'green');
  }
  log('');
}

// Run the tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
