import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Create test notification for seeded user
async function createTestNotification() {
  const testUserId = '7f66f2e3-719e-430d-ac8b-77497ce89aec';
  
  try {
    console.log('Creating test notifications...');
    
    // Create multiple test notifications to show different badge types
    const notifications = [
      {
        user_id: testUserId,
        message: 'Test notification: upload successful',
        type: 'upload'
      },
      {
        user_id: testUserId,
        message: 'Your Marriage Certificate has been confirmed.',
        type: 'confirm'
      },
      {
        user_id: testUserId,
        message: 'Your Bank Statement has been rejected. Reason: Document unclear, please resubmit.',
        type: 'reject'
      }
    ];

    for (const notification of notifications) {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single();
        
      if (error) {
        console.error('Error creating notification:', error);
        
        // If the table doesn't exist, show the migration SQL
        if (error.message.includes('relation "notifications" does not exist')) {
          console.log('\n❌ Notifications table does not exist!');
          console.log('\n📋 Please run this SQL in your Supabase SQL editor:');
          console.log(`
-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('upload', 'confirm', 'reject', 'general')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read BOOLEAN DEFAULT FALSE
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, read, created_at DESC);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
          `);
          return;
        }
        continue;
      }
      
      console.log('✅ Test notification created:', {
        id: data.id,
        type: data.type,
        message: data.message.substring(0, 50) + '...'
      });
    }
    
    console.log('\n🎉 All test notifications created successfully!');
    console.log('👤 User ID:', testUserId);
    console.log('🔗 Test at: http://localhost:5173/notifications-test');
    
  } catch (err) {
    console.error('❌ Test notification creation failed:', err);
  }
}

createTestNotification();