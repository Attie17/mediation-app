import { pool } from './src/db.js';

async function createTestNotifications() {
  try {
    const bobId = '22222222-2222-2222-2222-222222222222';
    const aliceId = '11111111-1111-4111-8111-111111111111';
    
    const notifications = [
      {
        user_id: bobId,
        type: 'document_uploaded',
        priority: 'high',
        title: 'New Document Uploaded',
        message: 'Alice uploaded "Financial Statement Q3" for review',
        metadata: { document_name: 'Financial Statement Q3', case_id: '3bcb2937-0e55-451a-a9fd-659187af84d4' }
      },
      {
        user_id: bobId,
        type: 'session_scheduled',
        priority: 'urgent',
        title: 'Session Scheduled',
        message: 'Mediation session scheduled for tomorrow at 2:00 PM',
        metadata: { session_date: '2025-10-26', session_time: '14:00' }
      },
      {
        user_id: bobId,
        type: 'message',
        priority: 'normal',
        title: 'New Message',
        message: 'You have a new message from Jill in the group conversation',
        metadata: { conversation_id: '0a690773-3da9-4577-8cc1-5e2ee79821de' }
      },
      {
        user_id: aliceId,
        type: 'review_required',
        priority: 'high',
        title: 'Document Review Required',
        message: '3 documents pending your review',
        metadata: { pending_count: 3 }
      },
      {
        user_id: aliceId,
        type: 'case_update',
        priority: 'normal',
        title: 'Case Update',
        message: 'Bob updated the case notes',
        metadata: { case_id: '3bcb2937-0e55-451a-a9fd-659187af84d4' }
      }
    ];

    for (const notif of notifications) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, priority, title, message, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [notif.user_id, notif.type, notif.priority, notif.title, notif.message, JSON.stringify(notif.metadata)]
      );
    }

    console.log(`✅ Created ${notifications.length} test notifications`);
    console.log('   - Bob (divorcee): 3 notifications');
    console.log('   - Alice (mediator): 2 notifications');
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating test notifications:', err.message);
    process.exit(1);
  }
}

createTestNotifications();
