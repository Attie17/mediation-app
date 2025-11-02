import React from 'react';

export default function MessageBubble({ message, isOwnMessage }) {
  const timestamp = new Date(message.created_at);
  const timeString = timestamp.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit' 
  });
  
  const dateString = timestamp.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: timestamp.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
  
  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        max-w-[70%] rounded-lg p-3 shadow-lg
        ${isOwnMessage 
          ? 'bg-teal-500 text-white' 
          : 'bg-slate-700 text-slate-100'
        }
      `}>
        {/* Sender name (only for received messages) */}
        {!isOwnMessage && message.sender_email && (
          <div className="text-xs font-semibold mb-1 opacity-80">
            {message.sender_email}
          </div>
        )}
        
        {/* Message content */}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        
        {/* Timestamp and read receipt */}
        <div className="flex items-center justify-end gap-2 text-xs opacity-70 mt-2">
          <span title={dateString}>{timeString}</span>
          {isOwnMessage && (
            <span title={message.read_at ? 'Read' : 'Delivered'}>
              {message.read_at ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
