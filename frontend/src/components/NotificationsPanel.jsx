import React from 'react';

export default function NotificationsPanel({ items = [], onClose, onMarkAll }) {
  return (
    <div className="absolute right-0 mt-2 w-80 bg-white text-blue-900 rounded-md shadow-lg z-20 p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold">Notifications</div>
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
          </div>
        ))}
      </div>
      <div className="mt-2 text-right">
        <button className="text-sm underline" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
