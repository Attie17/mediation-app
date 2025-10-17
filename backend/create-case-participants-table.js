import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function createCaseParticipantsTable() {
  try {
    console.log('🚀 Creating case_participants table...');
    
    // First, let's try to query the table to see if it exists
    console.log('Checking if table exists...');
    const { data: existingData, error: checkError } = await supabase
      .from('case_participants')
      .select('*')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ case_participants table already exists!');
      console.log('Sample data:', existingData);
      return;
    }
    
    console.log('❌ Table does not exist:', checkError.message);
    console.log('\n📋 Please run this SQL in your Supabase SQL Editor:');
    console.log('');
    console.log(`-- Create case_participants table
CREATE TABLE case_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('mediator', 'divorcee')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a user cannot be linked twice to the same case
    UNIQUE(case_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_case_participants_case_id ON case_participants(case_id);
CREATE INDEX idx_case_participants_user_id ON case_participants(user_id);
CREATE INDEX idx_case_participants_role ON case_participants(role);

-- Insert test data for case 4
INSERT INTO case_participants (case_id, user_id, role) 
VALUES (4, '7f66f2e3-719e-430d-ac8b-77497ce89aec', 'divorcee')
ON CONFLICT (case_id, user_id) DO NOTHING;`);
    
    console.log('\n🔗 Then run this script again to verify the table was created.');
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

createCaseParticipantsTable();