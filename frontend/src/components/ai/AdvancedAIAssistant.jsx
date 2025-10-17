/**
 * Advanced AI Assistant Component
 * 
 * Comprehensive AI system for mediation assistance including:
 * - Legal guidance with South African family law expertise
 * - Predictive analytics and pattern recognition
 * - Emotional intelligence and tone analysis
 * - Multi-language support and cultural sensitivity
 * - Voice integration and accessibility features
 * - Conflict resolution with machine learning
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Brain, 
  Scale, 
  Globe, 
  Mic, 
  MicOff, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  TrendingUp,
  Users,
  Languages,
  Volume2,
  VolumeX,
  ThumbsUp,
  ThumbsDown,
  Star
} from 'lucide-react';
import { apiFetch } from '../../../lib/apiClient';

// Component imports for different AI features
import LegalGuidancePanel from './LegalGuidancePanel';
import PredictiveAnalytics from './PredictiveAnalytics';
import EmotionalAnalysis from './EmotionalAnalysis';
import ConflictResolution from './ConflictResolution';
import TranslationService from './TranslationService';
import VoiceAssistant from './VoiceAssistant';
import CulturalContext from './CulturalContext';

const AdvancedAIAssistant = ({ sessionId, caseData, currentUser, onInsightGenerated }) => {
  const [activePanel, setActivePanel] = useState('chat');
  const [isExpanded, setIsExpanded] = useState(false);
  const [aiStatus, setAIStatus] = useState('initializing');
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [culturalContext, setCulturalContext] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [emotionalState, setEmotionalState] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  const messagesEndRef = useRef(null);
  const recognition = useRef(null);

  // Initialize AI assistant
  useEffect(() => {
    initializeAI();
    loadChatHistory();
    if (caseData?.cultural_background) {
      loadCulturalContext(caseData.cultural_background);
    }
  }, [sessionId]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const initializeAI = async () => {
    try {
      const healthCheck = await apiFetch('/api/ai/health');
      if (healthCheck.ok) {
        setAIStatus('ready');
        // Generate initial predictions
        await generatePredictiveAnalytics();
      } else {
        setAIStatus('error');
      }
    } catch (error) {
      console.error('AI initialization failed:', error);
      setAIStatus('error');
    }
  };

  const loadChatHistory = async () => {
    try {
      const history = await apiFetch(`/api/settlement-sessions/${sessionId}/chat`);
      if (history && Array.isArray(history)) {
        setChatMessages(history);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const loadCulturalContext = async (culture) => {
    try {
      const context = await apiFetch(`/api/ai/cultural-context/${culture}`);
      if (context.ok) {
        setCulturalContext(context.data);
      }
    } catch (error) {
      console.error('Failed to load cultural context:', error);
    }
  };

  const generatePredictiveAnalytics = async () => {
    try {
      const prediction = await apiFetch('/api/ai/predict-agreement', {
        method: 'POST',
        body: JSON.stringify({ sessionId })
      });
      
      if (prediction.ok) {
        setPredictions(prediction.data);
        onInsightGenerated?.({
          type: 'prediction',
          data: prediction.data,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Prediction generation failed:', error);
    }
  };

  const sendMessage = async (message, type = 'user') => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now(),
      message: message.trim(),
      type,
      user_type: currentUser?.role || 'user',
      timestamp: new Date().toISOString(),
      language: currentLanguage
    };

    setChatMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    // Analyze emotional state of the message
    await analyzeEmotionalState(message);

    // Get AI response based on active panel
    await getAIResponse(message, activePanel);
  };

  const analyzeEmotionalState = async (messageText) => {
    try {
      const analysis = await apiFetch('/api/ai/analyze-emotion', {
        method: 'POST',
        body: JSON.stringify({
          messageText,
          speakerContext: {
            role: currentUser?.role,
            session_stage: getSessionStage()
          },
          sessionId
        })
      });

      if (analysis.ok) {
        setEmotionalState(analysis.data);
        
        // If high stress detected, offer assistance
        if (analysis.data.stress_level > 7) {
          addSystemMessage(
            "I notice this might be a stressful topic. Would you like some suggestions for managing difficult discussions?",
            'emotional_support'
          );
        }
      }
    } catch (error) {
      console.error('Emotional analysis failed:', error);
    }
  };

  const getAIResponse = async (message, panel) => {
    try {
      let response;
      
      switch (panel) {
        case 'legal':
          response = await apiFetch('/api/ai/legal-guidance', {
            method: 'POST',
            body: JSON.stringify({
              query: message,
              caseContext: caseData,
              sessionId
            })
          });
          break;
          
        case 'conflict':
          response = await apiFetch('/api/ai/resolve-conflict', {
            method: 'POST',
            body: JSON.stringify({
              conflictData: {
                description: message,
                parties: caseData?.parties || [],
                context: 'chat_escalation'
              },
              sessionId
            })
          });
          break;
          
        case 'translate':
          if (currentLanguage !== 'en') {
            response = await apiFetch('/api/ai/translate', {
              method: 'POST',
              body: JSON.stringify({
                text: message,
                sourceLanguage: currentLanguage,
                targetLanguage: 'en',
                sessionId
              })
            });
          }
          break;
          
        default:
          // General chat response
          response = await apiFetch('/api/ai/legal-guidance', {
            method: 'POST',
            body: JSON.stringify({
              query: message,
              caseContext: { ...caseData, mode: 'general_assistance' },
              sessionId
            })
          });
      }

      if (response && response.ok) {
        addAIMessage(response.data, panel);
      }
    } catch (error) {
      console.error('AI response failed:', error);
      addSystemMessage("I apologize, but I'm having trouble processing your request right now. Please try again.");
    }
  };

  const addAIMessage = (aiData, type) => {
    const aiMessage = {
      id: Date.now() + 1,
      message: aiData.guidance || aiData.translated_text || aiData.resolution_strategy || aiData.response || 'AI response',
      type: 'ai',
      ai_type: type,
      confidence: aiData.confidence || aiData.confidence_score,
      disclaimer: aiData.disclaimer,
      follow_up: aiData.follow_up_suggestions,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, aiMessage]);
  };

  const addSystemMessage = (message, systemType = 'info') => {
    const systemMessage = {
      id: Date.now() + 2,
      message,
      type: 'system',
      system_type: systemType,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, systemMessage]);
  };

  const handleVoiceInput = async (transcript) => {
    if (!transcript) return;

    try {
      const processed = await apiFetch('/api/ai/process-voice', {
        method: 'POST',
        body: JSON.stringify({
          audioTranscript: transcript,
          speakerIdentity: currentUser?.role,
          sessionId
        })
      });

      if (processed.ok) {
        // Use processed transcript for better accuracy
        await sendMessage(processed.data.processed_transcript, 'voice');
        
        // Handle accessibility features if needed
        if (processed.data.accessibility_notes) {
          addSystemMessage(processed.data.accessibility_notes, 'accessibility');
        }
      }
    } catch (error) {
      console.error('Voice processing failed:', error);
      // Fallback to raw transcript
      await sendMessage(transcript, 'voice');
    }
  };

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      addSystemMessage("Voice recognition is not supported in this browser. Please type your message.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition.current = new SpeechRecognition();
    
    recognition.current.continuous = false;
    recognition.current.interimResults = false;
    recognition.current.lang = getLanguageCode(currentLanguage);

    recognition.current.onstart = () => {
      setIsListening(true);
    };

    recognition.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleVoiceInput(transcript);
    };

    recognition.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      addSystemMessage("Voice recognition error. Please try again or type your message.");
    };

    recognition.current.onend = () => {
      setIsListening(false);
    };

    recognition.current.start();
  };

  const stopVoiceRecognition = () => {
    if (recognition.current) {
      recognition.current.stop();
    }
    setIsListening(false);
  };

  const provideFeedback = async (messageId, feedbackType, rating) => {
    try {
      await apiFetch('/api/ai/feedback', {
        method: 'POST',
        body: JSON.stringify({
          interactionId: messageId,
          feedbackType,
          rating,
          sessionId
        })
      });
    } catch (error) {
      console.error('Feedback submission failed:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getSessionStage = () => {
    // Determine current stage of mediation session
    if (!caseData?.form_sections) return 'initial';
    
    const completedSections = caseData.form_sections.filter(s => s.completed).length;
    const totalSections = caseData.form_sections.length;
    
    if (completedSections === 0) return 'initial';
    if (completedSections < totalSections * 0.5) return 'early';
    if (completedSections < totalSections * 0.8) return 'middle';
    return 'final';
  };

  const getLanguageCode = (lang) => {
    const codes = {
      'en': 'en-US',
      'af': 'af-ZA',
      'zu': 'zu-ZA',
      'xh': 'xh-ZA',
      'st': 'st-ZA'
    };
    return codes[lang] || 'en-US';
  };

  const renderAIPanel = () => {
    switch (activePanel) {
      case 'legal':
        return <LegalGuidancePanel sessionId={sessionId} caseData={caseData} />;
      case 'predict':
        return <PredictiveAnalytics predictions={predictions} sessionId={sessionId} />;
      case 'emotion':
        return <EmotionalAnalysis emotionalState={emotionalState} sessionId={sessionId} />;
      case 'conflict':
        return <ConflictResolution sessionId={sessionId} caseData={caseData} />;
      case 'translate':
        return <TranslationService currentLanguage={currentLanguage} setCurrentLanguage={setCurrentLanguage} />;
      case 'voice':
        return <VoiceAssistant 
          isListening={isListening}
          onStartListening={startVoiceRecognition}
          onStopListening={stopVoiceRecognition}
          voiceEnabled={voiceEnabled}
          setVoiceEnabled={setVoiceEnabled}
        />;
      case 'cultural':
        return <CulturalContext context={culturalContext} caseData={caseData} />;
      default:
        return renderChatPanel();
    }
  };

  const renderChatPanel = () => (
    <div className="flex flex-col h-full">
      {/* Status Indicator */}
      <div className="flex items-center justify-between p-3 border-b bg-slate-50">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            aiStatus === 'ready' ? 'bg-green-500' : 
            aiStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
          }`} />
          <span className="text-sm font-medium">
            AI Assistant {aiStatus === 'ready' ? 'Ready' : aiStatus === 'error' ? 'Offline' : 'Initializing'}
          </span>
        </div>
        
        {emotionalState && (
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <span>Tone:</span>
            <span className={`px-2 py-1 rounded ${
              emotionalState.tone_score > 5 ? 'bg-green-100 text-green-700' :
              emotionalState.tone_score < -5 ? 'bg-red-100 text-red-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {emotionalState.primary_emotion}
            </span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              msg.type === 'user' ? 'bg-blue-500 text-white' :
              msg.type === 'ai' ? 'bg-white border border-slate-200' :
              'bg-slate-100 text-slate-700'
            }`}>
              {msg.type === 'ai' && (
                <div className="flex items-center gap-2 mb-2 text-xs text-slate-500">
                  <Brain className="w-3 h-3" />
                  <span>AI Assistant</span>
                  {msg.confidence && (
                    <span className="bg-slate-200 px-1 rounded">
                      {msg.confidence}% confident
                    </span>
                  )}
                </div>
              )}
              
              <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
              
              {msg.disclaimer && (
                <div className="mt-2 text-xs text-slate-500 italic border-t pt-2">
                  {msg.disclaimer}
                </div>
              )}

              {msg.follow_up && msg.follow_up.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="text-xs text-slate-500">Suggested follow-up:</div>
                  {msg.follow_up.slice(0, 2).map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputMessage(suggestion)}
                      className="block text-xs text-left text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                    >
                      • {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {msg.type === 'ai' && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                  <button
                    onClick={() => provideFeedback(msg.id, 'helpful', 5)}
                    className="text-green-600 hover:text-green-800"
                    title="Helpful"
                  >
                    <ThumbsUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => provideFeedback(msg.id, 'not_helpful', 2)}
                    className="text-red-600 hover:text-red-800"
                    title="Not helpful"
                  >
                    <ThumbsDown className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
            className={`p-2 rounded-lg ${
              isListening ? 'bg-red-500 text-white' : 'bg-slate-200 hover:bg-slate-300'
            }`}
            disabled={aiStatus !== 'ready'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage(inputMessage)}
            placeholder={isListening ? "Listening..." : "Ask me anything about your case..."}
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            disabled={aiStatus !== 'ready' || isListening}
          />
          
          <button
            onClick={() => sendMessage(inputMessage)}
            disabled={!inputMessage.trim() || aiStatus !== 'ready'}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all"
        >
          <Brain className="w-6 h-6" />
        </button>
        
        {predictions && predictions.likelihood_score < 70 && (
          <div className="absolute bottom-16 right-0 bg-yellow-100 border border-yellow-300 rounded-lg p-2 mb-2 max-w-xs">
            <div className="flex items-center gap-2 text-yellow-800 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>AI suggests mediation assistance</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-4 bg-white rounded-lg shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-slate-50">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-blue-500" />
          <h2 className="text-lg font-semibold">AI Mediation Assistant</h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <select
            value={currentLanguage}
            onChange={(e) => setCurrentLanguage(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="en">English</option>
            <option value="af">Afrikaans</option>
            <option value="zu">isiZulu</option>
            <option value="xh">isiXhosa</option>
            <option value="st">Sesotho</option>
          </select>
          
          <button
            onClick={() => setIsExpanded(false)}
            className="text-slate-500 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b bg-slate-50">
        {[
          { id: 'chat', label: 'Chat', icon: MessageSquare },
          { id: 'legal', label: 'Legal', icon: Scale },
          { id: 'predict', label: 'Analytics', icon: TrendingUp },
          { id: 'emotion', label: 'Emotion', icon: Users },
          { id: 'conflict', label: 'Conflict', icon: AlertTriangle },
          { id: 'translate', label: 'Translate', icon: Languages },
          { id: 'voice', label: 'Voice', icon: Volume2 },
          { id: 'cultural', label: 'Cultural', icon: Globe }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActivePanel(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
              activePanel === id 
                ? 'border-b-2 border-blue-500 text-blue-600 bg-white' 
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        {renderAIPanel()}
      </div>

      {/* Footer with limitations notice */}
      <div className="p-2 bg-slate-50 border-t text-xs text-slate-600 text-center">
        ⚠️ AI Assistant limitations: Cannot provide legal advice • Cultural context may vary • Emotional analysis is supplementary
      </div>
    </div>
  );
};

export default AdvancedAIAssistant;