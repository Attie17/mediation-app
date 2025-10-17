import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const filters = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
];

const formatDate = (value) => {
  if (!value) return 'Unknown time';
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
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

const NotificationsPage = () => {
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) {
      setError('You need to sign in to view notifications.');
      setNotifications([]);
      setLoading(false);
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
        throw new Error('Authentication failed. Please sign in again.');
      }

      if (!response.ok) {
        throw new Error('Failed to load notifications.');
      }

      const payload = await response.json();
      const items = Array.isArray(payload.data) ? payload.data : payload.notifications || [];
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

  const handleMarkAsRead = useCallback(async (id) => {
    if (!accessToken || !id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update notification.');
      }

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification,
        ),
      );
      broadcastUpdate();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, [accessToken]);

  const handleDelete = useCallback(async (id) => {
    if (!accessToken || !id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification.');
      }

      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
      broadcastUpdate();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  }, [accessToken]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') {
      return notifications.filter((notification) => !notification.read);
    }
    return notifications;
  }, [notifications, filter]);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            Stay on top of participant updates and case activity in real time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filter === item.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {unreadCount} unread
          </span>
          <button
            type="button"
            onClick={fetchNotifications}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Refresh
          </button>
        </div>
      </header>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-sm text-gray-500">Loading notifications…</p>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
          <p className="font-medium">{error}</p>
          <button
            type="button"
            onClick={fetchNotifications}
            className="mt-3 inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="text-5xl">🎉</div>
          <p className="mt-4 text-lg font-medium text-gray-900">You're all caught up!</p>
          <p className="mt-2 text-sm text-gray-500">
            {filter === 'unread'
              ? 'No unread notifications at the moment.'
              : 'Check back later for new case activity.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-lg border p-5 shadow-sm transition-colors ${
                notification.read
                  ? 'border-gray-200 bg-white hover:border-gray-300'
                  : 'border-blue-200 bg-blue-50 hover:border-blue-300'
              }`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3">
                    {!notification.read && (
                      <span className="inline-flex h-2 w-2 rounded-full bg-blue-500" aria-hidden />
                    )}
                    <p className={`text-sm ${notification.read ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                      {notification.message}
                    </p>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-wide text-gray-400">
                    {notification.type?.replace(/_/g, ' ')} • {formatDate(notification.created_at)}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {!notification.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(notification.id)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default NotificationsPage;
