// test-db-connection.cjs

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase')
    ? { rejectUnauthorized: false }
    : undefined,
});

(async () => {
  try {
    const nowRes = await pool.query('SELECT NOW() AS now');
    console.log(`✅ DB connected, server time: ${nowRes.rows[0].now}`);

    const userRes = await pool.query('SELECT current_user AS user');
    console.log(`✅ Current user: ${userRes.rows[0].user}`);

    const dbRes = await pool.query('SELECT current_database() AS db');
    console.log(`✅ Current database: ${dbRes.rows[0].db}`);
  } catch (err) {
    console.error('❌ DB check failed:', err.message);
  } finally {
    await pool.end();
  }
})();
