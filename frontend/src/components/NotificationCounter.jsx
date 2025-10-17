import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const NotificationCounter = forwardRef(({ onCountChange }, ref) => {
  const { session } = useAuth();
  const accessToken = session?.access_token;
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    if (!accessToken) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const payload = await response.json();
      const items = Array.isArray(payload.data) ? payload.data : [];
      const count = items.filter((notification) => notification.status !== 'read').length;
      setUnreadCount(count);
      if (onCountChange) {
        onCountChange(count);
      }
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [accessToken, onCountChange]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    const handleExternalUpdate = () => fetchUnreadCount();
    window.addEventListener('notifications:changed', handleExternalUpdate);
    return () => {
      window.removeEventListener('notifications:changed', handleExternalUpdate);
    };
  }, [fetchUnreadCount]);

  useImperativeHandle(ref, () => ({
    refresh: fetchUnreadCount,
  }));

  if (loading) {
    return (
      <div className="relative inline-block">
        <span className="text-xl">🔔</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <span className="text-xl">🔔</span>
      {unreadCount > 0 && (
        <span className="absolute -top-2 -right-2 rounded-full bg-red-500 text-white text-xs px-2 py-0.5 min-w-[1.25rem] text-center">
          {unreadCount}
        </span>
      )}
    </div>
  );
});

export default NotificationCounter;