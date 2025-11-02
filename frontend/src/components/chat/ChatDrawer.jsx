import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '../ui/dialog';
import ChatRoom from './ChatRoom';
import ChatAISidebar from '../ai/ChatAISidebar';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';
import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders } from '../../config/api';

export default function ChatDrawer({ open: controlledOpen, onOpenChange, caseId = null }) {
  const { user } = useAuth();
  const params = useParams();
  const currentCaseId = caseId || params.caseId || null;
  
  const [open, setOpen] = useState(false);
  const [showAISidebar, setShowAISidebar] = useState(true);
  const [messages, setMessages] = useState([]);
  const isControlled = typeof controlledOpen === 'boolean';
  const openValue = isControlled ? controlledOpen : open;
  const setOpenValue = (v) => {
    if (isControlled) {
      onOpenChange?.(v);
    } else {
      setOpen(v);
    }
  };
  const [channels, setChannels] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const token = useMemo(() => localStorage.getItem('token') || '', []);

  useEffect(() => {
    if (!openValue || !user) return;
    
    const load = async () => {
      try {
        const headers = getAuthHeaders();

        // For mediators and lawyers, fetch their cases and create channels
        if (user.role === 'mediator' || user.role === 'lawyer') {
          const casesRes = await fetch(`${API_BASE_URL}${API_ENDPOINTS.cases.list(user.user_id)}`, { headers });
          if (!casesRes.ok) throw new Error(`HTTP ${casesRes.status}`);
          const casesData = await casesRes.json();
          const cases = casesData.cases || [];

          // Create channel list from cases
          const caseChannels = cases.map(c => {
            // Extract surname from case title or description
            let channelName = c.title || c.description || `Case ${c.id.slice(0, 8)}`;
            
            // Try to extract surname (assumes format like "Smith vs Smith" or "Smith Mediation")
            const vsMatch = channelName.match(/(\w+)\s+vs\s+\w+/i);
            const mediationMatch = channelName.match(/(\w+)\s+Mediation/i);
            
            if (vsMatch) {
              channelName = `${vsMatch[1]}s`; // e.g., "Smiths"
            } else if (mediationMatch) {
              channelName = `${mediationMatch[1]}s`;
            }
            
            return {
              id: `case-${c.id}`,
              name: channelName,
              description: `Case chat`,
              caseId: c.id,
              type: 'case'
            };
          });

          // Add Ask AI channel (for mediators/lawyers)
          const askAIChannel = {
            id: 'ask-ai',
            name: '🤖 Ask AI',
            description: 'AI assistant for guidance',
            type: 'ai'
          };

          // Add admin channel
          const adminChannel = {
            id: 'admin-support',
            name: '🛟 Admin Support',
            description: 'Contact system admin',
            type: 'admin'
          };

          setChannels([...caseChannels, askAIChannel, adminChannel]);
          
          // Auto-select first channel
          if (!activeId && caseChannels.length > 0) {
            setActiveId(caseChannels[0].id);
          }
        } else {
          // For divorcees, show their case channels
          const casesRes = await fetch(`${API_BASE_URL}${API_ENDPOINTS.cases.list(user.user_id)}`, { headers });
          if (!casesRes.ok) throw new Error(`HTTP ${casesRes.status}`);
          const casesData = await casesRes.json();
          const cases = casesData.cases || [];

          const userChannels = cases.map(c => ({
            id: `case-${c.id}`,
            name: 'Mediator & Legal Team',
            description: 'Your case team',
            caseId: c.id,
            type: 'case'
          }));

          // Add Ask AI channel
          const askAIChannel = {
            id: 'ask-ai',
            name: '🤖 Ask AI',
            description: 'AI assistant for guidance',
            type: 'ai'
          };

          const adminChannel = {
            id: 'admin-support',
            name: '🛟 Admin Support',
            description: 'Contact system admin',
            type: 'admin'
          };

          setChannels([...userChannels, askAIChannel, adminChannel]);
          
          if (!activeId && userChannels.length > 0) {
            setActiveId(userChannels[0].id);
          }
        }
      } catch (e) {
        console.error('Failed to load channels:', e);
      }
    };
    
    load();
  }, [openValue, user, activeId]);

  return (
    <Dialog open={openValue} onOpenChange={setOpenValue}>
      {!isControlled && (
        <button
          type="button"
          onClick={() => setOpenValue(true)}
          className="rounded-full bg-white text-blue-700 font-semibold px-4 py-1"
        >
          Chat
        </button>
      )}
      <DialogContent className="bg-blue-900 text-white p-0 max-w-[960px] w-[960px] h-[80vh] right-0 left-auto top-1/2 -translate-y-1/2">
        <DialogHeader className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <DialogTitle>Chat</DialogTitle>
            <div className="flex items-center gap-2">
              {currentCaseId && user?.role === 'mediator' && (
                <button
                  onClick={() => setShowAISidebar(!showAISidebar)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    showAISidebar 
                      ? 'bg-white/20 text-white' 
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                  title="Toggle AI Assistant"
                >
                  🤖 AI {showAISidebar ? 'ON' : 'OFF'}
                </button>
              )}
              <DialogClose className="text-white/80 hover:text-white">✕</DialogClose>
            </div>
          </div>
        </DialogHeader>
        <div className="flex h-[calc(100%-56px)]">
          {/* Channels list */}
          <aside className="w-64 border-r border-white/10 p-3 overflow-auto">
            <div className="text-xs uppercase tracking-wide mb-2 opacity-80">Channels</div>
            <div className="space-y-1">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  className={`w-full text-left rounded-md px-3 py-2 text-sm hover:bg-white/10 ${activeId === ch.id ? 'bg-white/10' : ''}`}
                  onClick={() => setActiveId(ch.id)}
                >
                  <div className="font-medium">{ch.name || `Channel ${ch.id}`}</div>
                  {ch.description && (
                    <div className="text-xs opacity-70">{ch.description}</div>
                  )}
                </button>
              ))}
              {channels.length === 0 && (
                <div className="text-sm opacity-70">No channels yet.</div>
              )}
            </div>
          </aside>
          {/* Chat area */}
          <main className={`flex-1 p-4 overflow-hidden ${showAISidebar ? 'flex' : ''}`}>
            {activeId ? (
              <>
                <div className={`${showAISidebar ? 'flex-1' : 'h-full'}`}>
                  <ChatRoom 
                    channelId={activeId} 
                    currentUser={user}
                    onMessagesChange={setMessages}
                  />
                </div>
                {showAISidebar && currentCaseId && user?.role === 'mediator' && (
                  <ChatAISidebar 
                    caseId={currentCaseId}
                    messages={messages}
                    currentUser={user}
                    isVisible={showAISidebar}
                  />
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center opacity-80">
                Select a channel to start chatting
              </div>
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
