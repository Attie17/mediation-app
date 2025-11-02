import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import config from '../config';

const API_BASE_URL = config.api.baseUrl;

const TYPE_META = {
  info: { label: 'Info', icon: 'ℹ️', classes: 'bg-slate-100 text-slate-700' },
  upload: { label: 'Upload', icon: '�', classes: 'bg-blue-100 text-blue-700' },
  participant: { label: 'Participants', icon: '🧑‍🤝‍🧑', classes: 'bg-purple-100 text-purple-700' },
  note: { label: 'Notes', icon: '📝', classes: 'bg-amber-100 text-amber-700' },
};

const formatTimestamp = (value) => {
  if (!value) return 'Just now';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (_err) {
    return value;
  }
};

const broadcastUpdate = () => {
  window.dispatchEvent(new CustomEvent('notifications:changed'));
};

const NotificationTypeBadge = ({ type }) => {
  const meta = TYPE_META[type] || TYPE_META.info;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.classes}`}>
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  );
};

export default function NotificationsList() {
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => notification.status !== 'read'),
    [notifications],
  );
  const readNotifications = useMemo(
    () => notifications.filter((notification) => notification.status === 'read'),
    [notifications],
  );

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) {
      setNotifications([]);
      setLoading(false);
      setError('Sign in to view notifications.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status === 401) {
        setError('Session expired. Please sign in again.');
        setNotifications([]);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load notifications.');
      }

      const payload = await response.json();
      const items = Array.isArray(payload.data) ? payload.data : [];
      setNotifications(items);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message || 'Unexpected error loading notifications.');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handleExternalUpdate = () => fetchNotifications();
    window.addEventListener('notifications:changed', handleExternalUpdate);
    return () => {
      window.removeEventListener('notifications:changed', handleExternalUpdate);
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (id) => {
      if (!accessToken) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to mark notification as read');
        }

        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === id ? { ...notification, status: 'read' } : notification,
          ),
        );
        broadcastUpdate();
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    },
    [accessToken],
  );

  const deleteNotification = useCallback(
    async (id) => {
      if (!accessToken) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete notification');
        }

        setNotifications((prev) => prev.filter((notification) => notification.id !== id));
        broadcastUpdate();
      } catch (err) {
        console.error('Failed to delete notification:', err);
      }
    },
    [accessToken],
  );

  const renderNotification = (notification, isUnread) => (
    <li
      key={notification.id}
      className={`rounded-lg border px-4 py-3 transition-colors ${
        isUnread ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <NotificationTypeBadge type={notification.type} />
            <span className="text-xs text-gray-500">{formatTimestamp(notification.created_at)}</span>
          </div>
          <p className={`text-sm ${isUnread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
            {notification.message}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {isUnread && (
            <button
              type="button"
              onClick={() => markAsRead(notification.id)}
              className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Mark read
            </button>
          )}
          <button
            type="button"
            onClick={() => deleteNotification(notification.id)}
            className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <p className="text-xs text-gray-500">Stay up to date with case activity.</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">{unreadNotifications.length} unread</div>
          <div className="text-xs text-gray-500">{notifications.length} total</div>
        </div>
      </div>

      {loading ? (
        <div className="px-5 py-10 text-center text-sm text-gray-500">Loading notifications…</div>
      ) : error ? (
        <div className="px-5 py-6 text-sm text-red-600">
          <p>{error}</p>
          <button
            type="button"
            onClick={fetchNotifications}
            className="mt-3 inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-500">No notifications</div>
      ) : (
        <div className="px-5 py-4 space-y-6">
          {unreadNotifications.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Unread</h3>
              <ul className="mt-3 space-y-3">
                {unreadNotifications.map((notification) => renderNotification(notification, true))}
              </ul>
            </section>
          )}

          {readNotifications.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Read</h3>
              <ul className="mt-3 space-y-3">
                {readNotifications.map((notification) => renderNotification(notification, false))}
              </ul>
            </section>
          )}

          <button
            type="button"
            onClick={fetchNotifications}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}