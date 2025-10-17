
const path = require('path');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');

// Color helpers
const colors = {
  red: (msg) => `\x1b[31m${msg}\x1b[0m`,
  green: (msg) => `\x1b[32m${msg}\x1b[0m`,
  yellow: (msg) => `\x1b[33m${msg}\x1b[0m`,
  cyan: (msg) => `\x1b[36m${msg}\x1b[0m`,
  bold: (msg) => `\x1b[1m${msg}\x1b[0m`,
};

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, 'backend', '.env') });
dotenv.config({ path: path.resolve(__dirname, 'tests', '.env') });

const DEFAULT_CASE_ID = '9102';
const DEFAULT_PARTICIPANT_ID = '6750b742-4bce-458d-a02c-953daa8ca32a';
const DEFAULT_MEDIATOR_ID = '91029102-0000-4000-8000-000000000001';
const DEFAULT_MEDIATOR_EMAIL = 'participants.mediator@example.com';

const [, , argParticipantId, argCaseId] = process.argv;

const caseId = argCaseId || process.env.TEMP_DELETE_CASE_ID || DEFAULT_CASE_ID;
const participantId = argParticipantId || process.env.TEMP_DELETE_PARTICIPANT_ID || DEFAULT_PARTICIPANT_ID;
const mediatorId = process.env.TEMP_DELETE_MEDIATOR_ID || DEFAULT_MEDIATOR_ID;
const mediatorEmail = process.env.TEMP_DELETE_MEDIATOR_EMAIL || DEFAULT_MEDIATOR_EMAIL;

function isValidUUID(uuid) {
  // UUID v4 regex (accepts lowercase, no braces)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid);
}

if (!isValidUUID(participantId)) {
  console.error(colors.red(`❌ Invalid UUID format: ${participantId}`));
  console.log(colors.yellow('HINT: Compare against temp-list-participants.js output.'));
  process.exit(1);
}

if (!process.env.TEST_JWT) {
  console.error(colors.red('TEST_JWT not set, run get-jwt.ps1'));
  process.exit(1);
}
const token = process.env.TEST_JWT;

(async () => {
  const url = `http://localhost:4000/api/cases/${caseId}/participants/${participantId}`;
  console.log(colors.cyan(`Raw participantId: ${participantId}`));
  console.log(colors.cyan(`DELETE URL: ${url}`));
  try {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const bodyText = await res.text();
    console.log(colors.yellow(`➡️  Status: ${res.status}`));
    if (bodyText) {
      console.log(colors.yellow('➡️  Body:'), bodyText);
    }

    if (res.ok) {
      console.log(colors.green('✅ Participant deleted successfully (status 200)'));
    } else if (res.status === 404) {
      console.error(colors.red('❌ Participant not found (status 404)'));
      console.log(colors.yellow('HINT: Check that the participantId matches the DB list exactly (no typos).'));
      process.exitCode = 1;
    } else {
      console.error(colors.red('❌ Participant delete endpoint returned an error'));
      process.exitCode = 1;
    }
  } catch (err) {
    console.error(colors.red('❌ Failed to call participant delete endpoint'));
    console.error(colors.red(err.message));
    process.exitCode = 1;
  }
})();
