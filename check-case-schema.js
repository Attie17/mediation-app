import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres.kjmwaoainmyzbmvalizu:d8ScTSlTB6e5jmvS@aws-1-eu-west-2.pooler.supabase.com:6543/postgres'
});

async function checkCases() {
  console.log('\n=== CHECKING CASES TABLE ===\n');
  
  try {
    // Get table schema
    const schemaResult = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'cases' 
       ORDER BY ordinal_position`
    );
    
    console.log('Cases table schema:');
    schemaResult.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    // Get all cases
    const casesResult = await pool.query(`SELECT * FROM cases LIMIT 10`);
    
    console.log(`\n\nCases in database (${casesResult.rows.length}):`);
    casesResult.rows.forEach(c => {
      console.log(`\nID: ${c.id}`);
      console.log(`Title: ${c.title || c.case_title || 'N/A'}`);
      console.log(`Status: ${c.status}`);
    });
    
    // Check case_participants schema
    const cpSchemaResult = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'case_participants' 
       ORDER BY ordinal_position`
    );
    
    console.log('\n\nCase_participants table schema:');
    cpSchemaResult.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkCases();
