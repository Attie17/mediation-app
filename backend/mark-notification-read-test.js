import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Mark the first unread notification as read to test realtime updates
async function markFirstNotificationAsRead() {
  const testUserId = '7f66f2e3-719e-430d-ac8b-77497ce89aec';
  
  try {
    console.log('Finding first unread notification...');
    
    // Get the first unread notification
    const { data: notifications, error: selectError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', testUserId)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(1);
      
    if (selectError) {
      console.error('Error finding notifications:', selectError);
      return;
    }
    
    if (!notifications || notifications.length === 0) {
      console.log('No unread notifications found');
      return;
    }
    
    const notification = notifications[0];
    console.log('Found unread notification:', {
      id: notification.id,
      message: notification.message.substring(0, 50) + '...',
      type: notification.type
    });
    
    // Mark it as read
    const { data, error: updateError } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notification.id)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error marking notification as read:', updateError);
      return;
    }
    
    console.log('✅ Notification marked as read:', {
      id: data.id,
      read: data.read,
      updated_at: new Date().toLocaleTimeString()
    });
    
    console.log('\n🔔 Check the frontend - the counter should decrease automatically!');
    console.log('👀 Watch the browser console for realtime update logs');
    
  } catch (err) {
    console.error('❌ Mark as read test failed:', err);
  }
}

markFirstNotificationAsRead();