import React, { useState } from 'react';
import { useToast } from '../../components/ui/toast';
import { apiFetch } from '../../lib/apiClient';

export default function ChatInput({ channelId, currentUser }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const toast = useToast();

  const onSubmit = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    if (!channelId) return;

    setSending(true);
    try {
      await apiFetch(`/api/chat/channels/${channelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });

      setText('');
    } catch (err) {
      console.error('Send message failed:', err);
      try { toast.show(err.message || 'Failed to send message', 'destructive'); } catch (_e) {}
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="mt-3 flex gap-2">
      <input
        type="text"
        className="flex-1 rounded-md border border-gray-300 bg-white/95 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Type a message…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={sending}
      />
      <button
        type="submit"
        disabled={sending || !text.trim()}
        className="rounded-md bg-white text-blue-700 font-semibold px-4 py-2 disabled:opacity-60"
      >
        {sending ? 'Sending…' : 'Send'}
      </button>
    </form>
  );
}
