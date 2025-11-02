import React from 'react';
import { MessageSquare, Lock, Users, LifeBuoy, Circle } from 'lucide-react';

/**
 * ConversationsList - Displays list of conversations for a case
 * Shows conversation type, participants, unread count, and last message
 */
export default function ConversationsList({ 
  conversations = [], 
  selectedConversationId, 
  onSelect,
  currentUserId 
}) {
  
  // Get icon for conversation type
  const getConversationIcon = (type) => {
    switch(type) {
      case 'divorcee_to_divorcee':
      case 'divorcee_to_mediator':
        return <Lock className="w-4 h-4 text-blue-400" />;
      case 'group':
        return <Users className="w-4 h-4 text-green-400" />;
      case 'admin_support':
        return <LifeBuoy className="w-4 h-4 text-purple-400" />;
      default:
        return <MessageSquare className="w-4 h-4 text-slate-400" />;
    }
  };

  // Get display label for conversation type
  const getTypeLabel = (type) => {
    switch(type) {
      case 'divorcee_to_divorcee':
        return 'Private';
      case 'divorcee_to_mediator':
        return 'Private';
      case 'group':
        return 'Group';
      case 'admin_support':
        return 'Support';
      default:
        return type;
    }
  };

  // Get participant names (excluding current user)
  const getParticipantNames = (conversation) => {
    if (!conversation.participants || conversation.participants.length === 0) {
      return conversation.title || 'Conversation';
    }
    
    const otherParticipants = conversation.participants.filter(
      p => p.user_id !== currentUserId
    );
    
    if (otherParticipants.length === 0) {
      return conversation.title || 'You';
    }
    
    if (otherParticipants.length === 1) {
      return otherParticipants[0].first_name || 
             otherParticipants[0].email?.split('@')[0] || 
             'User';
    }
    
    return `${otherParticipants.length} participants`;
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center text-slate-400">
        <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-700">
      {conversations.map((conversation) => {
        const isSelected = conversation.id === selectedConversationId;
        const hasUnread = conversation.unread_count > 0;
        
        return (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation)}
            className={`w-full px-4 py-3 text-left transition-colors ${
              isSelected 
                ? 'bg-teal-500/20 border-l-4 border-teal-500' 
                : 'hover:bg-slate-700/50 border-l-4 border-transparent'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Conversation Icon */}
              <div className="mt-1 flex-shrink-0">
                {getConversationIcon(conversation.conversation_type)}
              </div>
              
              {/* Conversation Info */}
              <div className="flex-1 min-w-0">
                {/* Title/Participants */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-sm font-medium truncate ${
                    hasUnread ? 'text-slate-100' : 'text-slate-300'
                  }`}>
                    {getParticipantNames(conversation)}
                  </span>
                  
                  {/* Unread badge */}
                  {hasUnread && (
                    <span className="flex-shrink-0 bg-teal-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                    </span>
                  )}
                </div>
                
                {/* Type label and timestamp */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-400">
                    {getTypeLabel(conversation.conversation_type)}
                  </span>
                  {conversation.last_message_at && (
                    <>
                      <Circle className="w-1 h-1 fill-slate-500 text-slate-500" />
                      <span className="text-xs text-slate-500">
                        {formatTime(conversation.last_message_at)}
                      </span>
                    </>
                  )}
                </div>
                
                {/* Last message preview */}
                {conversation.last_message_content && (
                  <p className={`text-xs truncate ${
                    hasUnread ? 'text-slate-300 font-medium' : 'text-slate-500'
                  }`}>
                    {conversation.last_message_content}
                  </p>
                )}
                
                {/* Message count if no last message */}
                {!conversation.last_message_content && conversation.message_count > 0 && (
                  <p className="text-xs text-slate-500">
                    {conversation.message_count} {conversation.message_count === 1 ? 'message' : 'messages'}
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
