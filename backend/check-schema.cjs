require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('supabase') ? { rejectUnauthorized: false } : undefined
});

(async () => {
  try {
    console.log('📊 Checking Supabase Schema...\n');
    
    // List all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' 
      ORDER BY table_name
    `);
    
    console.log('✅ Existing Tables:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    console.log('\n📋 Checking app_users columns...');
    const appUsersColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema='public' AND table_name='app_users' 
      ORDER BY ordinal_position
    `);
    
    console.log('app_users columns:');
    appUsersColumns.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type})`);
    });
    
    // Check for missing tables that code references
    const requiredTables = [
      'app_users',
      'test_users',
      'cases',
      'case_participants',
      'case_requirements',
      'case_notes',
      'case_children',
      'uploads',
      'upload_audit',
      'notifications',
      'chat_channels',
      'chat_messages',
      'ai_insights',
      'settlement_sessions',
      'session_form_sections',
      'section_approvals',
      'section_conflicts',
      'session_chat_logs'
    ];
    
    const existingTables = tablesResult.rows.map(r => r.table_name);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.log('\n⚠️  Missing Tables (referenced in code):');
      missingTables.forEach(table => {
        console.log(`  - ${table}`);
      });
    } else {
      console.log('\n✅ All required tables exist!');
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
