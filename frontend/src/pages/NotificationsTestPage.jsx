import React from 'react';
import NotificationsList from '../components/NotificationsList';
import SupabaseTest from '../components/SupabaseTest';

export default function NotificationsTestPage() {
  // Use the seeded test user ID
  const testUserId = '7f66f2e3-719e-430d-ac8b-77497ce89aec';

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Notifications Test Page</h1>
      
      {/* Supabase Connection Test */}
      <SupabaseTest />
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">Testing Instructions:</h3>
        <ol className="text-yellow-700 text-sm space-y-1 list-decimal list-inside">
          <li>First, run the SQL migration in Supabase to create the notifications table</li>
          <li>Run: <code className="bg-yellow-100 px-1 rounded">node backend/create-test-notification.js</code> to create test data</li>
          <li>The test user ID is: <code className="bg-yellow-100 px-1 rounded">{testUserId}</code></li>
          <li>Upload a document to trigger notifications for mediators</li>
          <li>Confirm or reject documents to trigger notifications for divorcees</li>
          <li>Check the browser console for notification creation logs</li>
        </ol>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-800">
          Test User Notifications
        </h2>
        <NotificationsList userId={testUserId} />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-800">No User ID (should use default test user)</h2>
        <NotificationsList userId={null} />
      </div>
    </div>
  );
}