import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

async function applyCaseParticipantsMigration() {
  try {
    console.log('🚀 Applying case_participants migration...');
    
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'migrations', 'create-case-participants.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          if (error.message.includes('already exists')) {
            console.log('✅ Table already exists, skipping creation');
          } else {
            console.error('❌ Error executing statement:', error);
            throw error;
          }
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }
    
    // Test the table by selecting from it
    console.log('\n🧪 Testing case_participants table...');
    const { data, error } = await supabase
      .from('case_participants')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error testing table:', error);
    } else {
      console.log('✅ Table is working! Sample data:', data);
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

applyCaseParticipantsMigration();