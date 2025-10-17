// Fix the app_users role constraint to include all roles
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'backend/.env') });

import { pool } from './backend/src/db.js';

async function fixRoleConstraint() {
  try {
    console.log('Dropping old constraint...');
    await pool.query(`
      ALTER TABLE app_users 
      DROP CONSTRAINT IF EXISTS app_users_role_check;
    `);
    
    console.log('Adding new constraint with all 4 roles...');
    await pool.query(`
      ALTER TABLE app_users 
      ADD CONSTRAINT app_users_role_check 
      CHECK (role IN ('divorcee', 'mediator', 'lawyer', 'admin'));
    `);
    
    console.log('✅ Successfully updated role constraint!');
    console.log('Allowed roles: divorcee, mediator, lawyer, admin');
    
    // Verify the new constraint
    const result = await pool.query(`
      SELECT pg_get_constraintdef(con.oid) as constraint_definition
      FROM pg_constraint con
      INNER JOIN pg_class rel ON rel.oid = con.conrelid
      WHERE rel.relname = 'app_users' 
        AND con.conname = 'app_users_role_check';
    `);
    
    console.log('\nNew constraint definition:');
    console.log(result.rows[0]?.constraint_definition);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

fixRoleConstraint();
