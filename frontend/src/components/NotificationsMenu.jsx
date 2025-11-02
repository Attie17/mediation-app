import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import config from '../config';

const API_BASE_URL = config.api.baseUrl;

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

const NotificationsMenu = () => {
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = useMemo(
    () => notifications.filter((notification) => notification.status !== 'read').length,
    [notifications],
  );

  const fetchNotifications = useCallback(async () => {
    if (!accessToken) {
      setNotifications([]);
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
        setError('Authentication expired');
        setNotifications([]);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load notifications.');
      }

    const payload = await response.json();
    const items = Array.isArray(payload.data) ? payload.data : payload.notifications || [];
      setNotifications(items);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError(err.message || 'Unable to load notifications');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const handleGlobalUpdate = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    window.addEventListener('notifications:changed', handleGlobalUpdate);
    return () => {
      window.removeEventListener('notifications:changed', handleGlobalUpdate);
    };
  }, [handleGlobalUpdate]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const markAsRead = useCallback(async (id) => {
    if (!accessToken || !id) return;

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
  }, [accessToken]);

  const handleItemClick = async (notification) => {
    if (!notification) return;
    if (notification.status !== 'read') {
      await markAsRead(notification.id);
    }
    setOpen(false);
    navigate('/notifications');
  };

  const handleToggleMenu = () => {
    if (!accessToken) {
      navigate('/login');
      return;
    }
    setOpen((prev) => !prev);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={handleToggleMenu}
        aria-label="Notifications"
      >
        <span aria-hidden>🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-80 origin-top-right rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
            <button
              type="button"
              onClick={() => fetchNotifications()}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Refresh
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-gray-500">
                Loading…
              </div>
            ) : error ? (
              <div className="px-4 py-6 text-sm text-red-600">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500 text-center">
                You're all caught up!
              </div>
            ) : (
              notifications.slice(0, 8).map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleItemClick(notification)}
                  className={`block w-full px-4 py-3 text-left text-sm transition-colors ${
                    notification.status === 'read'
                      ? 'bg-white hover:bg-gray-50'
                      : 'bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <p className={`pr-3 ${notification.status === 'read' ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                      {notification.message}
                    </p>
                    {notification.status !== 'read' && (
                      <span className="mt-1 inline-block h-2 w-2 rounded-full bg-blue-500" aria-hidden />
                    )}
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{formatTimestamp(notification.created_at)}</p>
                </button>
              ))
            )}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2">
            <span className="text-xs text-gray-500">
              {unreadCount} unread / {notifications.length} total
            </span>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/notifications');
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsMenu;
