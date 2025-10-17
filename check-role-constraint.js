// Quick script to check the app_users role constraint
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'backend/.env') });

import { pool } from './backend/src/db.js';

async function checkConstraint() {
  try {
    // Check the constraint definition
    const constraintQuery = `
      SELECT 
        con.conname as constraint_name,
        pg_get_constraintdef(con.oid) as constraint_definition
      FROM pg_constraint con
      INNER JOIN pg_class rel ON rel.oid = con.conrelid
      INNER JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE rel.relname = 'app_users' 
        AND con.contype = 'c'
        AND con.conname LIKE '%role%';
    `;
    
    const result = await pool.query(constraintQuery);
    console.log('=== app_users role constraint ===');
    console.log(JSON.stringify(result.rows, null, 2));
    
    // Also check what values are currently in the role column
    const rolesQuery = `SELECT DISTINCT role FROM app_users ORDER BY role;`;
    const rolesResult = await pool.query(rolesQuery);
    console.log('\n=== Current distinct roles in app_users ===');
    console.log(JSON.stringify(rolesResult.rows, null, 2));
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkConstraint();
