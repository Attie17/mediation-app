import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

export default function MessageInput({ onSend, disabled = false, value = '', onChange }) {
  const [content, setContent] = useState(value);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);
  
  // Sync with external value (for AI suggestions)
  useEffect(() => {
    if (value !== content) {
      setContent(value);
    }
  }, [value]);
  
  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange(content);
    }
  }, [content]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);
  
  async function handleSubmit(e) {
    e.preventDefault();
    
    if (content.trim().length === 0 || sending || disabled) return;
    
    setSending(true);
    try {
      await onSend(content.trim());
      setContent('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  }
  
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }
  
  return (
    <form 
      onSubmit={handleSubmit}
      className="bg-slate-800 border-t border-slate-700 p-4"
    >
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          className="flex-1 bg-slate-700 text-slate-100 rounded-lg px-4 py-2 
                     min-h-[44px] max-h-[120px] resize-none
                     focus:outline-none focus:ring-2 focus:ring-teal-500
                     placeholder:text-slate-400"
          disabled={sending || disabled}
          rows={1}
        />
        
        <button
          type="submit"
          disabled={content.trim().length === 0 || sending || disabled}
          className="bg-teal-500 hover:bg-teal-600 disabled:bg-slate-600 
                     disabled:cursor-not-allowed
                     text-white rounded-lg px-4 py-2 h-[44px]
                     transition-colors flex items-center gap-2
                     focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-800"
        >
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>Send</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
