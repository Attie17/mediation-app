import React from 'react';
import { apiFetch } from '../lib/apiClient';

export function useNotifications(pollMs = 20000) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const fetchItems = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiFetch('/api/notifications');
      setItems(Array.isArray(data) ? data : data.notifications || []);
    } catch (e) {
      // 401 errors are handled globally by apiFetch (auto-logout)
      // Other errors we track silently
      setError(e.message || 'Failed to load notifications');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let t;
    fetchItems();
    if (pollMs > 0) {
      t = setInterval(fetchItems, pollMs);
    }
    return () => t && clearInterval(t);
  }, [fetchItems, pollMs]);

  const markAllRead = async () => {
    try {
      setItems(prev => prev.map(n => ({ ...n, read: true })));
      await apiFetch('/api/notifications/read-all', {
        method: 'POST',
      }).catch(() => {});
    } catch {}
  };

  const unreadCount = items.filter(n => !n.read).length;

  return { items, unreadCount, loading, error, markAllRead };
}
