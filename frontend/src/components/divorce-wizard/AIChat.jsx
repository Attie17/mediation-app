import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader } from 'lucide-react';

const AIChat = ({ sessionId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChatHistory();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatHistory = async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(`/api/settlement-sessions/${sessionId}/chat`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const chatHistory = await response.json();
        setMessages(chatHistory);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      message: inputMessage,
      user_type: currentUser?.role || 'user',
      message_type: 'user',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send to AI endpoint
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: inputMessage,
          context: {
            sessionId: sessionId,
            userRole: currentUser?.role,
            isSettlementWizard: true
          }
        })
      });

      if (response.ok) {
        const aiResponse = await response.json();
        
        const aiMessage = {
          id: Date.now() + 1,
          message: aiResponse.reply || aiResponse.message || 'Sorry, I could not process your request.',
          user_type: 'system',
          message_type: 'assistant',
          created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, aiMessage]);

        // Save to settlement session chat log
        if (sessionId) {
          await fetch(`/api/settlement-sessions/${sessionId}/chat`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
              messages: [userMessage, aiMessage]
            })
          });
        }
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        message: 'Sorry, I encountered an error. Please try again.',
        user_type: 'system',
        message_type: 'assistant',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors flex items-center gap-2"
        >
          <Bot className="w-6 h-6" />
          <span className="hidden sm:inline">AI Assistant</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <h3 className="font-semibold">AI Legal Assistant</h3>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-blue-100 hover:text-white transition-colors"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm">
            <Bot className="w-8 h-8 mx-auto mb-2 text-blue-600" />
            <p>Hello! I'm your AI legal assistant.</p>
            <p>I can help answer questions about divorce settlements, South African law, and guide you through the forms.</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 ${
              msg.message_type === 'user' ? 'flex-row-reverse' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              msg.message_type === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-600'
            }`}>
              {msg.message_type === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>
            <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
              msg.message_type === 'user'
                ? 'bg-blue-600 text-white ml-auto'
                : 'bg-gray-100 text-gray-800'
            }`}>
              <div className="whitespace-pre-wrap">{msg.message}</div>
              <div className={`text-xs mt-1 ${
                msg.message_type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {new Date(msg.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              <Bot className="w-4 h-4 text-gray-600" />
            </div>
            <div className="bg-gray-100 px-3 py-2 rounded-lg">
              <Loader className="w-4 h-4 animate-spin text-gray-600" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me about divorce settlements..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white p-2 rounded-md transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIChat;