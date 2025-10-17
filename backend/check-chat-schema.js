import { pool } from './src/db.js';

(async () => {
  try {
    // Check if chat_messages table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ chat_messages table does NOT exist');
      process.exit(0);
    }
    
    console.log('✅ chat_messages table exists');
    
    // Get columns
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'chat_messages'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nColumns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });
    
    // Check if case_id exists
    const hasCaseId = columns.rows.some(col => col.column_name === 'case_id');
    console.log(`\n${hasCaseId ? '✅' : '❌'} case_id column ${hasCaseId ? 'EXISTS' : 'MISSING'}`);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
})();
