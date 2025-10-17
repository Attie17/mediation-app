import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Create a single test notification for realtime testing
async function createRealtimeTestNotification() {
  const testUserId = '7f66f2e3-719e-430d-ac8b-77497ce89aec';
  
  try {
    console.log('Creating realtime test notification...');
    
    const notification = {
      user_id: testUserId,
      message: `Realtime CONFIRM notification created at ${new Date().toLocaleTimeString()}`,
      type: 'confirm'
    };

    const { data, error } = await supabase
      .from('notifications')
      .insert([notification])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating realtime test notification:', error);
      return;
    }
    
    console.log('✅ Realtime test notification created:', {
      id: data.id,
      type: data.type,
      message: data.message,
      created_at: data.created_at
    });
    
    console.log('\n🔔 Check the frontend - the notification should appear automatically!');
    console.log('👀 Watch the browser console for realtime event logs');
    
  } catch (err) {
    console.error('❌ Realtime test notification creation failed:', err);
  }
}

createRealtimeTestNotification();