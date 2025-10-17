import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Check current uploads table structure
async function checkSchema() {
  try {
    // Try to select a sample row to see what columns exist
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Sample upload record structure:');
      console.log(data[0] ? Object.keys(data[0]) : 'No records found');
    }
  } catch (err) {
    console.error('Error checking schema:', err);
  }
}

checkSchema();