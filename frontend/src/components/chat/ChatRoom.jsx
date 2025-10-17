import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChatInput from './ChatInput';
import { supabase } from '../../lib/supabase';
import { apiFetch } from '../../lib/apiClient';

function roleBubbleClasses(role) {
  switch ((role || '').toLowerCase()) {
    case 'mediator':
      return 'bg-blue-100 text-blue-900';
    case 'divorcee':
      return 'bg-green-100 text-green-900';
    case 'lawyer':
      return 'bg-yellow-100 text-yellow-900';
    case 'admin':
      return 'bg-gray-200 text-gray-900';
    default:
      return 'bg-muted text-foreground';
  }
}

export default function ChatRoom({ channelId, currentUser, onMessagesChange }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const userId = currentUser?.id;
  const userRole = (currentUser?.role || '').toLowerCase();

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!channelId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/api/chat/channels/${channelId}/messages`);
      const items = Array.isArray(data) ? data : data.messages || [];
      setMessages(items);
      onMessagesChange?.(items); // Notify parent of messages
      setTimeout(scrollToBottom, 0);
    } catch (e) {
      console.error('Failed to fetch messages:', e);
      setError(e.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [channelId, scrollToBottom, onMessagesChange]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!channelId) return;

    // Ensure we have a single channel name per chat channel
    const channel = supabase
      .channel(`chat_messages:channel:${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `channel_id=eq.${channelId}`,
      }, (payload) => {
        const newMsg = payload?.new;
        if (!newMsg) return;
        setMessages((prev) => {
          // Only append if not already present
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          const next = [...prev, newMsg];
          onMessagesChange?.(next); // Notify parent of updated messages
          return next;
        });
        setTimeout(scrollToBottom, 0);
      })
      .subscribe((status) => {
        // console.log('Realtime status', status);
      });

    return () => {
      try { supabase.removeChannel(channel); } catch (_e) {}
    };
  }, [channelId, scrollToBottom]);

  const rendered = useMemo(() => (
    <div className="flex flex-col gap-3">
      {messages.map((msg) => {
        const isOwn = userId && (msg.user_id === userId || msg.sender_id === userId || msg.author_id === userId);
        const role = (msg.sender_role || msg.role || '').toLowerCase();
        const ts = msg.created_at ? new Date(msg.created_at) : null;
        return (
          <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[78%]">
              {role && (
                <div className="text-[10px] uppercase tracking-wide opacity-70 mb-0.5">{role}</div>
              )}
              <div className={`rounded-lg px-3 py-2 ${roleBubbleClasses(role)}`}>
                {msg.content}
              </div>
              <div className="text-[10px] text-white/70 mt-0.5">
                {ts ? ts.toLocaleString() : ''}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  ), [messages, userId]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto pr-2">
        {loading ? (
          <div className="text-sm opacity-80">Loading…</div>
        ) : error ? (
          <div className="text-sm text-red-200">{error}</div>
        ) : (
          rendered
        )}
      </div>
      <ChatInput channelId={channelId} currentUser={currentUser} />
    </div>
  );
}
