// DEPRECATED: Legacy NotificationsPanel preserved for reference.
// Prefer the unified NotificationCenter component in components/notifications/.
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPanel({ items = [], onClose, onMarkAll }) {
  const navigate = useNavigate();

  const handleReply = (notification) => {
    const metadata = notification.metadata || {};
    const conversationId = metadata.conversation_id || metadata.conversationId;
    const caseId = metadata.case_id || metadata.caseId;
    if (notification.action_url) {
      navigate(notification.action_url); onClose(); return; }
    if (conversationId) { navigate(`/communications?conversation=${conversationId}`); onClose(); return; }
    if (caseId) { navigate(`/communications?case=${caseId}`); onClose(); return; }
    navigate('/communications'); onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-white text-blue-900 rounded-md shadow-lg z-20 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Notifications (legacy)</div>
        <button className="text-sm underline" onClick={onMarkAll}>Mark all read</button>
      </div>
      <div className="space-y-2 max-h-80 overflow-auto">
        {items.length === 0 ? (
          <div className="text-sm opacity-70">Nothing new right now.</div>
        ) : items.map(n => (
          <div key={n.id} className={`rounded p-2 ${n.read ? 'bg-gray-100' : 'bg-blue-50'}`}>
            <div className="text-sm font-medium">{n.title || 'Update'}</div>
            <div className="text-xs opacity-80">{n.body || ''}</div>
            <div className="text-[10px] opacity-60 mt-1">{new Date(n.created_at || Date.now()).toLocaleString()}</div>
            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => handleReply(n)}
                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
              >
                Reply
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-right">
        <button className="text-sm underline" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
