/**
 * Voice Assistant Component
 * 
 * Voice interaction and accessibility features for the mediation platform
 */

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Play, Pause, Settings } from 'lucide-react';
import { apiFetch } from '../../../lib/apiClient';

const VoiceAssistant = ({ 
  isListening, 
  onStartListening, 
  onStopListening, 
  voiceEnabled, 
  setVoiceEnabled 
}) => {
  const [voiceSettings, setVoiceSettings] = useState({
    voice: 'default',
    speed: 1,
    pitch: 1,
    volume: 0.8,
    language: 'en-US'
  });
  const [transcript, setTranscript] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceCommands, setVoiceCommands] = useState([]);
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [voiceHistory, setVoiceHistory] = useState([]);

  const recognition = useRef(null);
  const synthesis = useRef(null);

  useEffect(() => {
    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthesis.current = window.speechSynthesis;
    }

    // Load voice commands
    loadVoiceCommands();
    loadVoiceHistory();
  }, []);

  useEffect(() => {
    // Handle voice settings changes
    if (synthesis.current) {
      synthesis.current.cancel(); // Cancel any ongoing speech
    }
  }, [voiceSettings]);

  const loadVoiceCommands = async () => {
    try {
      const response = await apiFetch('/api/ai/voice-commands');
      if (response.ok) {
        setVoiceCommands(response.data);
      }
    } catch (error) {
      console.error('Failed to load voice commands:', error);
    }
  };

  const loadVoiceHistory = async () => {
    try {
      const response = await apiFetch('/api/ai/voice-history');
      if (response && Array.isArray(response)) {
        setVoiceHistory(response);
      }
    } catch (error) {
      console.error('Failed to load voice history:', error);
    }
  };

  const processVoiceCommand = async (transcript) => {
    try {
      const response = await apiFetch('/api/ai/process-voice', {
        method: 'POST',
        body: JSON.stringify({
          audioTranscript: transcript,
          voiceSettings,
          accessibilityMode
        })
      });

      if (response.ok) {
        const processed = response.data;
        setTranscript(processed.processed_transcript || transcript);
        
        // Handle voice command responses
        if (processed.response_text) {
          await speak(processed.response_text);
        }

        // Handle accessibility features
        if (processed.accessibility_actions) {
          processed.accessibility_actions.forEach(action => {
            handleAccessibilityAction(action);
          });
        }

        // Add to history
        const historyEntry = {
          id: Date.now(),
          transcript: transcript,
          processed: processed.processed_transcript,
          response: processed.response_text,
          timestamp: new Date().toISOString()
        };
        setVoiceHistory(prev => [historyEntry, ...prev.slice(0, 9)]);

        return processed;
      }
    } catch (error) {
      console.error('Voice processing failed:', error);
    }
  };

  const speak = async (text, options = {}) => {
    if (!synthesis.current || !voiceEnabled) return;

    return new Promise((resolve) => {
      synthesis.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = getSelectedVoice();
      utterance.rate = options.speed || voiceSettings.speed;
      utterance.pitch = options.pitch || voiceSettings.pitch;
      utterance.volume = options.volume || voiceSettings.volume;
      utterance.lang = options.language || voiceSettings.language;

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => {
        setIsPlaying(false);
        resolve();
      };
      utterance.onerror = () => {
        setIsPlaying(false);
        resolve();
      };

      synthesis.current.speak(utterance);
    });
  };

  const stopSpeaking = () => {
    if (synthesis.current) {
      synthesis.current.cancel();
      setIsPlaying(false);
    }
  };

  const getSelectedVoice = () => {
    if (!synthesis.current) return null;
    
    const voices = synthesis.current.getVoices();
    if (voiceSettings.voice === 'default') {
      return voices.find(voice => voice.lang === voiceSettings.language) || voices[0];
    }
    
    return voices.find(voice => voice.name === voiceSettings.voice) || voices[0];
  };

  const getAvailableVoices = () => {
    if (!synthesis.current) return [];
    return synthesis.current.getVoices().filter(voice => 
      voice.lang.startsWith(voiceSettings.language.split('-')[0])
    );
  };

  const handleAccessibilityAction = (action) => {
    switch (action.type) {
      case 'announce':
        speak(action.text);
        break;
      case 'navigate':
        // Handle navigation commands
        console.log('Navigation:', action.target);
        break;
      case 'focus':
        // Handle focus commands
        console.log('Focus:', action.element);
        break;
      case 'scroll':
        // Handle scroll commands
        if (action.direction === 'up') {
          window.scrollBy(0, -200);
        } else if (action.direction === 'down') {
          window.scrollBy(0, 200);
        }
        break;
      default:
        console.log('Unknown accessibility action:', action);
    }
  };

  const testVoice = () => {
    speak("This is a test of the voice assistant. Voice settings are working correctly.");
  };

  const predefinedCommands = [
    {
      command: "Start mediation session",
      description: "Begin a new mediation session",
      category: "Session Control"
    },
    {
      command: "Read current section",
      description: "Read aloud the current form section",
      category: "Accessibility"
    },
    {
      command: "What are my options?",
      description: "Get available options for current situation",
      category: "Help"
    },
    {
      command: "Translate to Afrikaans",
      description: "Switch interface language to Afrikaans",
      category: "Language"
    },
    {
      command: "Show legal guidance",
      description: "Display legal guidance panel",
      category: "Navigation"
    },
    {
      command: "Take a break",
      description: "Pause the session temporarily",
      category: "Session Control"
    }
  ];

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Voice Control Panel */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
          <Mic className="w-4 h-4 text-blue-500" />
          Voice Assistant
        </h3>

        {/* Voice Status */}
        <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              isListening ? 'bg-red-500 animate-pulse' : 
              voiceEnabled ? 'bg-green-500' : 'bg-slate-400'
            }`} />
            <span className="text-sm font-medium">
              {isListening ? 'Listening...' : 
               voiceEnabled ? 'Voice Ready' : 'Voice Disabled'}
            </span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded ${
                voiceEnabled ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
              }`}
              title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            
            {voiceEnabled && (
              <>
                <button
                  onClick={isListening ? onStopListening : onStartListening}
                  className={`p-2 rounded ${
                    isListening ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}
                  title={isListening ? 'Stop listening' : 'Start listening'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                
                {isPlaying ? (
                  <button
                    onClick={stopSpeaking}
                    className="p-2 rounded bg-orange-100 text-orange-700"
                    title="Stop speaking"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={testVoice}
                    className="p-2 rounded bg-green-100 text-green-700"
                    title="Test voice"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Current Transcript */}
        {transcript && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm font-medium text-blue-800 mb-1">Last Recognized:</div>
            <div className="text-sm text-blue-700">"{transcript}"</div>
          </div>
        )}
      </div>

      {/* Voice Settings */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4 text-purple-500" />
          Voice Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Voice Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Voice</label>
            <select
              value={voiceSettings.voice}
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, voice: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="default">Default Voice</option>
              {getAvailableVoices().map((voice, idx) => (
                <option key={idx} value={voice.name}>
                  {voice.name} ({voice.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Language</label>
            <select
              value={voiceSettings.language}
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, language: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="af-ZA">Afrikaans</option>
              <option value="zu-ZA">isiZulu</option>
              <option value="xh-ZA">isiXhosa</option>
            </select>
          </div>

          {/* Speed */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Speed: {voiceSettings.speed}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceSettings.speed}
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, speed: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>

          {/* Volume */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Volume: {Math.round(voiceSettings.volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={voiceSettings.volume}
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
              className="w-full"
            />
          </div>
        </div>

        {/* Accessibility Mode */}
        <div className="mt-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={accessibilityMode}
              onChange={(e) => setAccessibilityMode(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-slate-700">
              Enable enhanced accessibility mode (detailed announcements)
            </span>
          </label>
        </div>
      </div>

      {/* Voice Commands */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium text-slate-800 mb-3">Available Voice Commands</h3>
        
        <div className="space-y-3">
          {Object.entries(
            predefinedCommands.reduce((acc, cmd) => {
              if (!acc[cmd.category]) acc[cmd.category] = [];
              acc[cmd.category].push(cmd);
              return acc;
            }, {})
          ).map(([category, commands]) => (
            <div key={category}>
              <h4 className="text-sm font-medium text-slate-700 mb-2">{category}</h4>
              <div className="space-y-1">
                {commands.map((cmd, idx) => (
                  <div key={idx} className="p-2 bg-slate-50 rounded text-sm">
                    <div className="font-medium text-slate-800">"{cmd.command}"</div>
                    <div className="text-xs text-slate-600">{cmd.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voice History */}
      {voiceHistory.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-slate-800 mb-3">Recent Voice Interactions</h3>
          <div className="space-y-2">
            {voiceHistory.slice(0, 5).map((entry) => (
              <div key={entry.id} className="p-3 bg-slate-50 rounded border">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs text-slate-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={() => speak(entry.transcript)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="font-medium text-slate-700">Said:</span>
                    <span className="text-slate-600 ml-2">"{entry.transcript}"</span>
                  </div>
                  
                  {entry.processed && entry.processed !== entry.transcript && (
                    <div className="text-sm">
                      <span className="font-medium text-slate-700">Understood:</span>
                      <span className="text-slate-600 ml-2">"{entry.processed}"</span>
                    </div>
                  )}
                  
                  {entry.response && (
                    <div className="text-sm">
                      <span className="font-medium text-slate-700">Response:</span>
                      <span className="text-slate-600 ml-2">"{entry.response}"</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Browser Compatibility */}
      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
        <div className="text-xs text-yellow-800">
          <strong>Browser Support:</strong> Voice features work best in Chrome, Edge, and Safari. 
          {!('speechSynthesis' in window) && (
            <span className="text-red-600 block mt-1">
              ⚠️ Speech synthesis not supported in this browser.
            </span>
          )}
          {!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window) && (
            <span className="text-red-600 block mt-1">
              ⚠️ Speech recognition not supported in this browser.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;