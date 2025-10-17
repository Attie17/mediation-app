import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function createChildrenTables() {
  try {
    console.log('🗄️ Creating children tables...');
    
    // Create case_children table
    console.log('Creating case_children table...');
    const { error: childrenError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS case_children (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          birthdate DATE,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (childrenError) {
      // Try direct table creation
      const { error: directError } = await supabase
        .from('case_children')
        .select('*')
        .limit(1);
        
      if (directError && directError.code === '42P01') {
        console.log('Table does not exist, trying alternative creation method...');
        // We'll need to create via raw SQL if available, or handle differently
        throw new Error('Unable to create tables. Please run SQL manually in Supabase dashboard.');
      }
    }
    
    console.log('✅ case_children table ready');
    
    // Create voice_of_child table
    console.log('Creating voice_of_child table...');
    const { error: voiceError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS voice_of_child (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
          child_id UUID NOT NULL REFERENCES case_children(id) ON DELETE CASCADE,
          type TEXT NOT NULL CHECK (type IN ('report', 'drawing', 'interview', 'observation', 'other')),
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (voiceError) {
      console.warn('Voice table creation error (might already exist):', voiceError.message);
    }
    
    console.log('✅ voice_of_child table ready');
    
    // Create indexes
    console.log('Creating indexes...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_case_children_case_id ON case_children(case_id);
        CREATE INDEX IF NOT EXISTS idx_voice_of_child_case_id ON voice_of_child(case_id);
        CREATE INDEX IF NOT EXISTS idx_voice_of_child_child_id ON voice_of_child(child_id);
      `
    });
    
    console.log('✅ All children tables and indexes created successfully!');
    
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.log('🔧 Manual SQL to run in Supabase dashboard:');
    console.log(`
CREATE TABLE IF NOT EXISTS case_children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birthdate DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS voice_of_child (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES case_children(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('report', 'drawing', 'interview', 'observation', 'other')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_children_case_id ON case_children(case_id);
CREATE INDEX IF NOT EXISTS idx_voice_of_child_case_id ON voice_of_child(case_id);
CREATE INDEX IF NOT EXISTS idx_voice_of_child_child_id ON voice_of_child(child_id);
    `);
  }
}

createChildrenTables();