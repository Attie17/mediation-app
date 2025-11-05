import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/apiClient';
import MessageList from '../../components/messages/MessageList';
import MessageInput from '../../components/messages/MessageInput';
import AIMessageAssistant from '../../components/messages/AIMessageAssistant';
import ConversationsList from '../../components/messages/ConversationsList';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draftMessage, setDraftMessage] = useState('');
  
  // Get active case from localStorage or use default test case
  const caseId = localStorage.getItem('activeCaseId') || '3bcb2937-0e55-451a-a9fd-659187af84d4';
  
  // Get filter from URL params
  const filter = searchParams.get('filter');
  
  useEffect(() => {
    fetchConversations();
  }, [caseId]);
  
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);
  
  async function fetchConversations() {
    try {
      setLoading(true);
      setError(null);
      const data = await apiFetch(`/api/conversations/case/${caseId}`);
      setConversations(data.conversations || []);
      
      // Smart conversation selection based on filter
      if (data.conversations && data.conversations.length > 0) {
        let conversationToSelect = null;
        
        if (filter) {
          // Filter-based selection (from Let's Talk menu)
          switch(filter) {
            case 'mediator':
              conversationToSelect = data.conversations.find(c => 
                c.conversation_type === 'divorcee_to_mediator' ||
                c.participants?.some(p => p.role === 'mediator')
              );
              break;
            case 'divorcee':
              conversationToSelect = data.conversations.find(c => 
                c.conversation_type === 'divorcee_to_divorcee' ||
                (c.participants?.filter(p => p.role === 'divorcee').length === 2)
              );
              break;
            case 'group':
              conversationToSelect = data.conversations.find(c => 
                c.conversation_type === 'group' ||
                c.participants?.length >= 3
              );
              break;
            case 'admin':
              conversationToSelect = data.conversations.find(c => 
                c.conversation_type === 'admin_support' ||
                c.participants?.some(p => p.role === 'admin')
              );
              break;
          }
          
          // Clear filter after processing
          setSearchParams({});
        }
        
        // If no filter match or no filter, use first conversation or keep selection
        if (!conversationToSelect && !selectedConversation) {
          conversationToSelect = data.conversations[0];
        }
        
        if (conversationToSelect) {
          setSelectedConversation(conversationToSelect);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setError(err.message || 'Failed to load conversations');
      setLoading(false);
    }
  }
  
  async function fetchMessages(conversationId) {
    try {
      const data = await apiFetch(`/api/conversations/${conversationId}/messages?limit=100`);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError(err.message || 'Failed to load messages');
    }
  }
  
  async function handleSendMessage(content) {
    if (!selectedConversation) {
      throw new Error('No conversation selected');
    }
    
    try {
      const response = await apiFetch(`/api/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content
        })
      });
      
      // Add the new message to the list immediately (optimistic update)
      setMessages(prev => [...prev, response.message]);
      
      // Clear draft message
      setDraftMessage('');
      
      // Refresh conversations to update unread counts and last message
      fetchConversations();
      
    } catch (err) {
      console.error('Failed to send message:', err);
      throw err;
    }
  }
  
  function handleConversationSelect(conversation) {
    setSelectedConversation(conversation);
    setMessages([]); // Clear messages while loading new ones
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading messages...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-slate-100 text-lg mb-2">Failed to load conversations</p>
          <p className="text-slate-400 text-sm mb-4">{error}</p>
          <button
            onClick={fetchConversations}
            className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // Get display name for selected conversation
  const getConversationName = () => {
    if (!selectedConversation) return 'Messages';
    
    if (selectedConversation.title) return selectedConversation.title;
    
    const otherParticipants = selectedConversation.participants?.filter(
      p => p.user_id !== user.user_id
    ) || [];
    
    if (otherParticipants.length === 1) {
      return otherParticipants[0].first_name || 
             otherParticipants[0].email?.split('@')[0] || 
             'User';
    }
    
    if (otherParticipants.length > 1) {
      return `${otherParticipants.length} participants`;
    }
    
    return 'Conversation';
  };
  
  // Extract unique participants from all conversations
  const getUniqueParticipants = () => {
    const participantsMap = new Map();
    
    conversations.forEach(conv => {
      if (conv.participants) {
        conv.participants.forEach(participant => {
          // Skip current user
          if (participant.user_id !== user?.user_id && participant.user_id !== user?.id) {
            if (!participantsMap.has(participant.user_id)) {
              participantsMap.set(participant.user_id, {
                ...participant,
                conversations: []
              });
            }
            participantsMap.get(participant.user_id).conversations.push(conv);
          }
        });
      }
    });
    
    return Array.from(participantsMap.values());
  };

  const uniqueParticipants = getUniqueParticipants();

  // Function to start chat with a specific participant
  const startChatWith = (participant) => {
    // Find a private conversation with this participant
    const privateConv = participant.conversations.find(conv => 
      conv.conversation_type === 'divorcee_to_mediator' || 
      conv.conversation_type === 'divorcee_to_divorcee'
    );
    
    // If private conversation exists, select it
    if (privateConv) {
      setSelectedConversation(privateConv);
    } else if (participant.conversations.length > 0) {
      // Otherwise, select any conversation they're in
      setSelectedConversation(participant.conversations[0]);
    }
  };

  // Get role display name
  const getRoleDisplay = (role) => {
    const roleMap = {
      'mediator': 'Mediator',
      'divorcee': 'Divorcee',
      'lawyer': 'Lawyer',
      'admin': 'Administrator'
    };
    return roleMap[role] || role;
  };

  // Get role color
  const getRoleColor = (role) => {
    const colorMap = {
      'mediator': 'teal',
      'divorcee': 'blue',
      'lawyer': 'purple',
      'admin': 'orange'
    };
    return colorMap[role] || 'gray';
  };
  
  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar - Conversations List */}
      <div className="w-80 border-r border-slate-700 flex flex-col">
        {/* Sidebar Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-4 py-4 flex flex-col gap-2">
          {/* Back Button */}
          <div className="mb-2">
            <button
              onClick={() => navigate('/divorcee')}
              className="
                inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
                bg-slate-700/50 border border-slate-600
                text-slate-300 hover:text-teal-400
                hover:border-teal-500/50
                transition-all duration-200 text-sm
              "
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-slate-100">Communication Channels</h1>
              <p className="text-xs text-slate-400">
                {conversations.length} {conversations.length === 1 ? 'channel' : 'channels'}
              </p>
            </div>
          </div>
          
          {/* Who can communicate */}
          <div className="mt-2 px-3 py-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
            <p className="text-xs font-semibold text-teal-300 mb-2">Who do you want to send a message to?</p>
            
            {uniqueParticipants.length > 0 ? (
              <div className="space-y-1">
                {uniqueParticipants.map(participant => {
                  const roleColor = getRoleColor(participant.role);
                  return (
                    <button
                      key={participant.user_id}
                      onClick={() => startChatWith(participant)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-600/50 transition-colors text-left group"
                    >
                      <span className={`w-2 h-2 rounded-full bg-${roleColor}-400 flex-shrink-0`}></span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-200 group-hover:text-teal-300 transition-colors">
                            {participant.email?.split('@')[0] || 'User'}
                          </span>
                          <span className={`text-xs text-${roleColor}-400`}>
                            ({getRoleDisplay(participant.role)})
                          </span>
                        </div>
                      </div>
                      <svg className="w-3 h-3 text-slate-500 group-hover:text-teal-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic py-2">
                Loading participants...
              </div>
            )}
            
            {/* Group conversation option */}
            {conversations.some(c => c.conversation_type === 'group') && (
              <button
                onClick={() => {
                  const groupConv = conversations.find(c => c.conversation_type === 'group');
                  if (groupConv) setSelectedConversation(groupConv);
                }}
                className="w-full mt-2 flex items-center gap-2 px-2 py-1.5 rounded bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-colors text-left group"
              >
                <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0"></span>
                <span className="text-xs font-medium text-purple-300 group-hover:text-purple-200 transition-colors">
                  Everyone in this case (Group)
                </span>
                <svg className="w-3 h-3 text-purple-400 group-hover:text-purple-300 transition-colors ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </header>
        
        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <ConversationsList
            conversations={conversations}
            selectedConversationId={selectedConversation?.id}
            onSelect={handleConversationSelect}
            currentUserId={user?.user_id || user?.id}
          />
        </div>
      </div>
      
      {/* Main Content - Messages */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Conversation Header */}
            <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center gap-3">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-100">
                  {getConversationName()}
                </h2>
                <p className="text-sm text-slate-400">
                  {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                </p>
              </div>
              <MessageSquare size={20} className="text-slate-400" />
            </header>
            
            {/* Message List */}
            <MessageList 
              messages={messages} 
              currentUserId={user?.user_id || user?.id} 
            />
            
            {/* AI Assistant */}
            <AIMessageAssistant
              content={draftMessage}
              onSuggestion={(suggestion) => setDraftMessage(suggestion)}
              onInsert={(text) => setDraftMessage(text)}
            />
            
            {/* Input */}
            <MessageInput 
              value={draftMessage}
              onChange={setDraftMessage}
              onSend={handleSendMessage}
              disabled={!selectedConversation}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Select a conversation</p>
              <p className="text-sm">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
