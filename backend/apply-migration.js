import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Apply the version column migration
async function addVersionColumn() {
  try {
    console.log('Adding version column to uploads table...');
    
    // Note: This would normally be done in Supabase SQL editor
    // For now, we'll check if the column exists by trying to select it
    
    const { data, error } = await supabase
      .from('uploads')
      .select('version')
      .limit(1);
    
    if (error && error.message.includes('column "version" does not exist')) {
      console.log('Version column does not exist. Please run this SQL in your Supabase SQL editor:');
      console.log('');
      console.log('-- Add version column to uploads table');
      console.log('ALTER TABLE uploads ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;');
      console.log('');
      console.log('-- Update existing records to have version 1');
      console.log('UPDATE uploads SET version = 1 WHERE version IS NULL;');
      console.log('');
      console.log('-- Add a composite index for efficient querying');
      console.log('CREATE INDEX IF NOT EXISTS idx_uploads_user_doctype_version');
      console.log('ON uploads (user_id, doc_type, version DESC);');
      console.log('');
      console.log('-- Add constraint to ensure version is positive');
      console.log('ALTER TABLE uploads ADD CONSTRAINT check_version_positive CHECK (version > 0);');
    } else if (error) {
      console.error('Error checking version column:', error);
    } else {
      console.log('Version column already exists!');
      console.log('Sample data with version:', data);
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
}

addVersionColumn();