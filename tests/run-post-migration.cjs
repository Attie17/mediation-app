const path = require('path');
const { spawn } = require('child_process');
const dotenv = require('dotenv');

dotenv.config();


if (!process.env.TEST_JWT) {
  console.error('[runner] ❌ Missing TEST_JWT in .env – run setup-mediator.ps1 first');
  process.exit(1);
}

const scripts = [
  {
    label: 'tests/test-case-participants.cjs',
    file: path.resolve(__dirname, 'test-case-participants.cjs'),
    logPrefix: 'participants',
  },
  {
    label: 'tests/test-case-dashboard.cjs',
    file: path.resolve(__dirname, 'test-case-dashboard.cjs'),
    logPrefix: 'dashboard',
  },
  {
    label: 'tests/test-uploads.cjs',
    file: path.resolve(__dirname, 'test-uploads.cjs'),
    logPrefix: 'uploads',
  },
  {
    label: 'tests/test-notifications.cjs',
    file: path.resolve(__dirname, 'test-notifications.cjs'),
  },
];

function runScript(script) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script.file], {
      env: process.env,
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    const prefix = script.logPrefix || script.label;

    child.stdout.on('data', (data) => {
      process.stdout.write(`[${prefix}] ${data}`);
    });

    child.stderr.on('data', (data) => {
      process.stderr.write(`[${prefix}] ${data}`);
    });

    child.on('error', (error) => {
      console.error(`[${prefix}] Failed to start: ${error.message}`);
      resolve({ code: 1 });
    });

    child.on('close', (code) => {
      resolve({ code });
    });
  });
}

async function main() {
  const results = [];

  for (const script of scripts) {
    console.log(`\n▶️  Running ${script.label}`);
    const result = await runScript(script);
    results.push({ script, code: result.code });

    if (result.code === 0) {
      console.log(`✅ ${script.label}`);
    } else {
      console.log(`❌ ${script.label} (exit code ${result.code})`);
    }
  }

  const failed = results.filter((result) => result.code !== 0);

  if (failed.length === 0) {
    console.log('\n✅ All post-migration tests passed');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed (see logs above)');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error while running post-migration tests:', error);
  console.log('\n❌ Some tests failed (see logs above)');
  process.exit(1);
});
