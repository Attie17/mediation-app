#!/usr/bin/env node

// create-mediator.js
// Usage: node create-mediator.js [--recreate] [--cleanup] [--caseId <id>] [--email <email>] [--debug] [--help]

const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

const argv = yargs(hideBin(process.argv))
  .option('recreate', { type: 'boolean', default: false, describe: 'Delete and recreate the mediator user' })
  .option('cleanup', { type: 'boolean', default: false, describe: 'Delete mediator user and clear from case' })
  .option('caseId', { type: 'number', default: 9102, describe: 'Case ID to link mediator to' })
  .option('email', { type: 'string', default: 'mediator.fresh@example.com', describe: 'Mediator email' })
  .option('debug', { type: 'boolean', default: false, describe: 'Enable verbose SQL logging' })
  .option('help', { type: 'boolean', default: false, describe: 'Show help' })
  .argv;

if (argv.help) {
  console.log(`\nUsage: node create-mediator.js [--recreate] [--cleanup] [--caseId <id>] [--email <email>] [--debug]\n`);
  console.log('Flags:');
  console.log('  --recreate   Delete and recreate the mediator user');
  console.log('  --cleanup    Delete mediator user and clear from case');
  console.log('  --caseId     Case ID to link mediator to (default: 9102)');
  console.log('  --email      Mediator email (default: mediator.fresh@example.com)');
  console.log('  --debug      Enable verbose SQL logging');

  // create-mediator.js
  // Usage: node create-mediator.js [--recreate] [--cleanup] [--caseId <id>] [--email <email>] [--debug] [--help]

  import { createClient } from '@supabase/supabase-js';
  import pg from 'pg';
  import minimist from 'minimist';

  const args = minimist(process.argv.slice(2));
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (args.help) {
    console.log(`\nUsage: node create-mediator.js [--recreate] [--cleanup] [--caseId <id>] [--email <email>] [--debug] [--help]\n`);
    console.log('Flags:');
    console.log('  --recreate   Delete and recreate the mediator user');
    console.log('  --cleanup    Delete mediator user and clear from case');
    console.log('  --caseId     Case ID to link mediator to (default: 9102)');
    console.log('  --email      Mediator email (default: mediator.fresh@example.com)');
    console.log('  --debug      Enable verbose SQL logging');
    console.log('  --help       Show this help menu');
    process.exit(0);
  }

  if (!supabaseUrl || !serviceRoleKey || !databaseUrl) {
    console.error('❌ Missing SUPABASE_URL, SERVICE_ROLE_KEY, or DATABASE_URL in env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const pool = new pg.Pool({ connectionString: databaseUrl });

  const defaultEmail = args.email || 'mediator.fresh@example.com';
  const defaultPassword = 'FreshMediatorPass123!';
  const caseId = args.caseId || 9102;
  const recreate = args.recreate || false;
  const cleanup = args.cleanup || false;
  const debug = args.debug || false;

  async function run() {
    try {
      if (cleanup) {
        console.log(`🧹 Cleaning up mediator ${defaultEmail}...`);
        await deleteMediator(defaultEmail, caseId);
        console.log('✅ Cleanup complete.');
        process.exit(0);
      }

      let mediatorId;

      if (recreate) {
        #!/usr/bin/env node
        await deleteMediator(defaultEmail, caseId);
