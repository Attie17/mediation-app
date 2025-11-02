/**
 * AIAssistantDrawer - Context-aware AI assistant for platform guidance
 * Provides role-specific help and answers to common questions
 * Note: Does NOT provide legal advice - use "Ask AI for Legal Help" for that
 */

import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

// Role-specific welcome messages
const WELCOME_MESSAGES = {
  admin: {
    title: 'AI Admin Assistant',
    subtitle: 'Ask me about the MediationApp platform',
    content: `👋 Hello! I'm your AI Admin Assistant for the MediationApp platform.

I can help you with:
• Managing organizations and subscriptions
• Assigning cases to mediators
• User management and role administration
• Platform navigation and features
• Administrative workflows and best practices

What would you like to know?`
  },
  mediator: {
    title: 'AI Mediator Assistant',
    subtitle: 'Ask me about mediator workflows',
    content: `👋 Hello! I'm your AI Mediator Assistant.

I can help you with:
• Creating and managing cases
• Scheduling mediation sessions
• Document management and templates
• Inviting participants to cases
• Best practices for mediation workflows
• Platform features for mediators

What would you like to know?`
  },
  divorcee: {
    title: 'AI Divorcee Assistant',
    subtitle: 'Ask me about the mediation process',
    content: `👋 Hello! I'm your AI Divorcee Assistant.

I can help you with:
• Understanding the mediation process
• Uploading and managing your documents
• Communicating with your mediator
• Preparing for mediation sessions
• Navigating the platform features
• Next steps in your case

**Note:** For legal advice, please use "Ask AI for Legal Help" or consult your attorney.

What would you like to know?`
  },
  lawyer: {
    title: 'AI Lawyer Assistant',
    subtitle: 'Ask me about legal workflows',
    content: `👋 Hello! I'm your AI Lawyer Assistant.

I can help you with:
• Accessing case documents and evidence
• Reviewing mediation agreements
• Platform features for legal professionals
• Communicating with clients and mediators
• Managing case notifications
• Document review workflows

**Note:** For legal research, please use "Ask AI for Legal Help".

What would you like to know?`
  }
};

export default function AIAssistantDrawer({ isOpen, onClose, caseId, userId, userRole = 'divorcee', caseContext = {} }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Welcome message based on user role
      const welcomeConfig = WELCOME_MESSAGES[userRole] || WELCOME_MESSAGES.divorcee;
      setMessages([{
        role: 'assistant',
        content: welcomeConfig.content,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, userRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    const userMsgObj = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsgObj]);

    // Save user message to database for mediator review
    try {
      await apiFetch('/api/ai-chat-history', {
        method: 'POST',
        body: JSON.stringify({
          case_id: caseId,
          user_id: userId,
          role: 'user',
          content: userMessage
        })
      });
    } catch (err) {
      console.warn('Failed to save user message to history:', err);
      // Non-critical - continue even if save fails
    }

    setLoading(true);

    try {
      // Call AI legal guidance endpoint
      const response = await apiFetch('/api/ai/legal-guidance', {
        method: 'POST',
        body: JSON.stringify({
          question: userMessage,
          context: {
            caseId,
            userId,
            ...caseContext
          }
        })
      });

      if (response.ok) {
        // Add AI response
        const aiMessage = {
          role: 'assistant',
          content: response.guidance,
          timestamp: new Date(),
          confidence: response.confidence,
          disclaimer: response.disclaimer,
          followUpSuggestions: response.follow_up_suggestions,
          webSearchSuggested: response.web_search_suggested,
          webSearchNote: response.web_search_note
        };

        setMessages(prev => [...prev, aiMessage]);

        // Save AI response to database for mediator review
        try {
          await apiFetch('/api/ai-chat-history', {
            method: 'POST',
            body: JSON.stringify({
              case_id: caseId,
              user_id: userId,
              role: 'assistant',
              content: response.guidance,
              confidence: response.confidence,
              disclaimer: response.disclaimer,
              web_search_suggested: response.web_search_suggested || false
            })
          });
        } catch (err) {
          console.warn('Failed to save AI response to history:', err);
          // Non-critical - continue even if save fails
        }
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('AI Assistant error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment, or contact your mediator for assistance.",
        timestamp: new Date(),
        isError: true
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  if (!isOpen) return null;

  // Get role-specific config for header
  const roleConfig = WELCOME_MESSAGES[userRole] || WELCOME_MESSAGES.divorcee;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col m-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{roleConfig.title}</h2>
              <p className="text-sm text-white/80">{roleConfig.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-teal-600 text-white' : 'bg-white border border-gray-200'} rounded-lg p-4 shadow-sm`}>
                {msg.role === 'assistant' && msg.isError && (
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Error</span>
                  </div>
                )}
                
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {msg.content}
                </div>

                <div className="text-xs text-gray-400 mt-2">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4 bg-white rounded-b-xl">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                userRole === 'admin' ? "Ask me about platform features, organizations, or case management..." :
                userRole === 'mediator' ? "Ask me about creating cases, scheduling sessions, or workflows..." :
                userRole === 'lawyer' ? "Ask me about case documents, reviews, or legal workflows..." :
                "Ask me about the mediation process, documents, or platform features..."
              }
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 placeholder-gray-400"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </form>
          
          {/* Quick Questions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <p className="text-xs text-gray-500 w-full mb-1">Quick questions:</p>
            {[
              "What documents do I need?",
              "How long does mediation take?",
              "What about child custody?"
            ].map((q, i) => (
              <button
                key={i}
                onClick={() => setInput(q)}
                className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
