import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const migrationArg = process.argv[2];
  if (!migrationArg) {
    console.error('❌ Please provide a migration file to apply.');
    console.error('   Usage: node scripts/apply-migration.js migrations/your_migration.sql');
    process.exit(1);
  }

  const migrationPath = path.resolve(process.cwd(), migrationArg);

  try {
    await fs.access(migrationPath);
  } catch (error) {
    console.error(`❌ Migration file not found at ${migrationPath}`);
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set. Please configure it in the .env file.');
    process.exit(1);
  }

  console.log(`🛠️  Applying migration: ${migrationPath}`);

  const psqlExecutable = process.env.PSQL_PATH && process.env.PSQL_PATH.trim()
    ? process.env.PSQL_PATH.trim()
    : 'psql';

  const useShell = process.platform === 'win32' && psqlExecutable === 'psql';
  const args = ['-d', databaseUrl, '-f', migrationPath];

  const child = spawn(psqlExecutable, args, {
    stdio: 'inherit',
    shell: useShell,
  });

  child.on('exit', (code) => {
    if (code === 0) {
      console.log('✅ Migration applied successfully');
      process.exit(0);
    } else {
      console.error(`❌ Migration failed with exit code ${code}`);
      process.exit(code ?? 1);
    }
  });

  child.on('error', (error) => {
    console.error('❌ Failed to start psql process:', error.message);
    process.exit(1);
  });
}

main();
