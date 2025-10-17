#!/usr/bin/env node
/* eslint-disable no-console */
const path = require('path');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const AUTH_TOKEN = process.env.AUTH_TOKEN;
const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';
const TEST_MESSAGE = 'Test notification lifecycle';

if (!AUTH_TOKEN) {
  console.error('❌ Missing AUTH_TOKEN in environment (.env)');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${AUTH_TOKEN}`,
  'Content-Type': 'application/json',
};

const stepResults = [];

async function runStep(label, fn) {
  try {
    const data = await fn();
    console.log(`✅ ${label}`);
    stepResults.push({ label, ok: true });
    return data;
  } catch (error) {
    console.error(`❌ ${label}`);
    console.error(error?.message || error);
    stepResults.push({ label, ok: false, error });
    throw error;
  }
}

async function main() {
  let targetNotification;

  await runStep('GET /api/notifications returns seeded notification', async () => {
    const response = await fetch(`${BASE_URL}/api/notifications`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when fetching notifications`);
    }

    const payload = await response.json();

    if (!payload.success || !Array.isArray(payload.data)) {
      throw new Error('Unexpected response shape from notifications endpoint');
    }

    const matches = payload.data.filter((item) => item.message === TEST_MESSAGE);

    if (matches.length === 0) {
      throw new Error(`No notifications found with message "${TEST_MESSAGE}"`);
    }

    targetNotification = matches[0];
    return matches;
  });

  await runStep('PATCH /api/notifications/:id/read marks notification as read', async () => {
    const response = await fetch(
      `${BASE_URL}/api/notifications/${targetNotification.id}/read`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when marking notification as read`);
    }

    const payload = await response.json();

    if (!payload.success || !payload.data?.read) {
      throw new Error('Notification was not marked as read');
    }

    return payload.data;
  });

  await runStep('DELETE /api/notifications/:id removes notification', async () => {
    const response = await fetch(
      `${BASE_URL}/api/notifications/${targetNotification.id}`,
      {
        method: 'DELETE',
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when deleting notification`);
    }

    const payload = await response.json();

    if (!payload.success) {
      throw new Error('Delete endpoint reported failure');
    }

    return payload;
  });

  await runStep('GET /api/notifications verifies cleanup', async () => {
    const response = await fetch(`${BASE_URL}/api/notifications`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} when fetching notifications after delete`);
    }

    const payload = await response.json();

    if (!payload.success || !Array.isArray(payload.data)) {
      throw new Error('Unexpected response shape during verification fetch');
    }

    const matches = payload.data.filter((item) => item.message === TEST_MESSAGE);

    if (matches.length !== 0) {
      throw new Error(
        `Expected 0 test notifications after delete, found ${matches.length}`
      );
    }

    return matches;
  });
}

main()
  .then(() => {
    const hasFailure = stepResults.some((result) => !result.ok);
    process.exit(hasFailure ? 1 : 0);
  })
  .catch(() => {
    process.exit(1);
  });
