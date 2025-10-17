import React from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import NotificationsPanel from './NotificationsPanel';

export default function NotificationsBell() {
  const { items, unreadCount, markAllRead } = useNotifications(20000);
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button className="relative rounded-full bg-white/90 text-blue-800 p-2 hover:bg-white" onClick={() => setOpen(o => !o)}>
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <NotificationsPanel items={items} onClose={() => setOpen(false)} onMarkAll={() => markAllRead()} />)
      }
    </div>
  );
}
