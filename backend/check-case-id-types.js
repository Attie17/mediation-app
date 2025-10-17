import { pool } from './src/db.js';

(async () => {
  try {
    // Check cases.id type
    const casesIdType = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'cases' AND column_name = 'id'
    `);
    console.log('cases.id type:', casesIdType.rows[0]?.data_type || 'NOT FOUND');
    
    // Check chat_messages.case_id type  
    const chatCaseIdType = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'chat_messages' AND column_name = 'case_id'
    `);
    console.log('chat_messages.case_id type:', chatCaseIdType.rows[0]?.data_type || 'NOT FOUND');
    
    // Check if cases table exists and has data
    const casesCheck = await pool.query(`SELECT id FROM public.cases LIMIT 1`);
    console.log('Sample case ID:', casesCheck.rows[0]?.id);
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
})();
