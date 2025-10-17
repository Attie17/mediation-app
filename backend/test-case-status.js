// Test script for case status lifecycle and forbidden transitions
// Usage: node test-case-status.js

import fetch from 'node-fetch';

const API_URL = 'http://localhost:4000/api/cases';
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with a valid JWT for a divorcee, then mediator

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function createCase() {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: authHeaders(AUTH_TOKEN),
    body: JSON.stringify({
      personalInfo: {
        name: 'Test User',
        dateOfBirth: '1990-01-01',
        email: 'test@example.com',
        phone: '1234567890',
        address: '123 Test St'
      },
      marriageDetails: {},
      children: [],
      financialSituation: {},
      uploads: [],
      preferences: {}
    })
  });
  const data = await res.json();
  console.log('Create Case:', data);
  return data.case_id;
}

async function assignMediator(caseId, mediatorId) {
  const res = await fetch(`${API_URL}/${caseId}`, {
    method: 'PUT',
    headers: authHeaders(AUTH_TOKEN),
    body: JSON.stringify({
      status: 'in_progress',
      mediator_id: mediatorId
    })
  });
  const data = await res.json();
  console.log('Assign Mediator:', data);
  return data;
}

async function closeCase(caseId) {
  const res = await fetch(`${API_URL}/${caseId}`, {
    method: 'PUT',
    headers: authHeaders(AUTH_TOKEN),
    body: JSON.stringify({ status: 'closed' })
  });
  const data = await res.json();
  console.log('Close Case:', data);
  return data;
}

async function archiveCase(caseId) {
  const res = await fetch(`${API_URL}/${caseId}`, {
    method: 'PUT',
    headers: authHeaders(AUTH_TOKEN),
    body: JSON.stringify({ status: 'archived' })
  });
  const data = await res.json();
  console.log('Archive Case:', data);
  return data;
}

async function invalidTransition(caseId) {
  const res = await fetch(`${API_URL}/${caseId}`, {
    method: 'PUT',
    headers: authHeaders(AUTH_TOKEN),
    body: JSON.stringify({ status: 'open' })
  });
  const data = await res.json();
  console.log('Invalid Transition (closed→open):', data);
  return data;
}

(async () => {
  // 1. Create case (should be open)
  const caseId = await createCase();
  // 2. Assign mediator (in_progress)
  // Replace with a real mediator_id for your test DB
  const mediatorId = 'YOUR_MEDIATOR_ID_HERE';
  await assignMediator(caseId, mediatorId);
  // 3. Close mediation (closed)
  await closeCase(caseId);
  // 4. Archive case (archived)
  await archiveCase(caseId);
  // 5. Try invalid move (closed→open)
  await invalidTransition(caseId);
})();
