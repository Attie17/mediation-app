/**
 * Emotional Analysis Component
 * 
 * Real-time emotional intelligence and tone analysis for mediation sessions
 */

import React, { useState, useEffect } from 'react';
import { Heart, Frown, Smile, Meh, AlertTriangle, TrendingUp, Users, Brain } from 'lucide-react';
import { apiFetch } from '../../../lib/apiClient';

const EmotionalAnalysis = ({ emotionalState: initialState, sessionId }) => {
  const [emotionalState, setEmotionalState] = useState(initialState);
  const [emotionalHistory, setEmotionalHistory] = useState([]);
  const [stressIndicators, setStressIndicators] = useState([]);
  const [emotionalRecommendations, setEmotionalRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEmotionalHistory();
    if (emotionalState) {
      generateEmotionalRecommendations();
    }
  }, [sessionId, emotionalState]);

  const loadEmotionalHistory = async () => {
    try {
      const response = await apiFetch(`/api/settlement-sessions/${sessionId}/emotional-history`);
      if (response && Array.isArray(response)) {
        setEmotionalHistory(response);
      }
    } catch (error) {
      console.error('Failed to load emotional history:', error);
    }
  };

  const generateEmotionalRecommendations = async () => {
    if (!emotionalState) return;

    try {
      const response = await apiFetch('/api/ai/emotional-recommendations', {
        method: 'POST',
        body: JSON.stringify({
          emotionalState,
          sessionId
        })
      });

      if (response.ok) {
        setEmotionalRecommendations(response.data.recommendations || []);
        setStressIndicators(response.data.stress_indicators || []);
      }
    } catch (error) {
      console.error('Failed to generate emotional recommendations:', error);
    }
  };

  const analyzeCurrentMood = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/ai/analyze-session-mood', {
        method: 'POST',
        body: JSON.stringify({ sessionId })
      });

      if (response.ok) {
        setEmotionalState(response.data);
        await generateEmotionalRecommendations();
      }
    } catch (error) {
      console.error('Mood analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmotionIcon = (emotion) => {
    const icons = {
      happy: <Smile className="w-4 h-4 text-green-500" />,
      sad: <Frown className="w-4 h-4 text-blue-500" />,
      angry: <AlertTriangle className="w-4 h-4 text-red-500" />,
      neutral: <Meh className="w-4 h-4 text-slate-500" />,
      anxious: <AlertTriangle className="w-4 h-4 text-orange-500" />,
      frustrated: <Frown className="w-4 h-4 text-red-400" />,
      hopeful: <Smile className="w-4 h-4 text-green-400" />,
      confused: <Brain className="w-4 h-4 text-purple-500" />
    };
    return icons[emotion] || <Meh className="w-4 h-4 text-slate-500" />;
  };

  const getEmotionColor = (emotion, intensity = 5) => {
    const baseColors = {
      happy: 'green',
      sad: 'blue',
      angry: 'red',
      neutral: 'slate',
      anxious: 'orange',
      frustrated: 'red',
      hopeful: 'green',
      confused: 'purple'
    };
    
    const color = baseColors[emotion] || 'slate';
    const opacity = Math.min(intensity * 10, 100);
    
    return `bg-${color}-${intensity > 7 ? '500' : intensity > 4 ? '300' : '100'} text-${color}-${intensity > 7 ? '50' : '800'}`;
  };

  const getStressLevelColor = (level) => {
    if (level >= 8) return 'text-red-600 bg-red-100';
    if (level >= 6) return 'text-orange-600 bg-orange-100';
    if (level >= 4) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Current Emotional State */}
      {emotionalState ? (
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-slate-800 flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500" />
              Current Emotional State
            </h3>
            <button
              onClick={analyzeCurrentMood}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Refresh'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Primary Emotion */}
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {getEmotionIcon(emotionalState.primary_emotion)}
                <span className="text-sm font-medium text-slate-700">Primary Emotion</span>
              </div>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getEmotionColor(emotionalState.primary_emotion, emotionalState.emotion_intensity)}`}>
                {emotionalState.primary_emotion}
              </div>
              {emotionalState.emotion_intensity && (
                <div className="text-xs text-slate-500 mt-1">
                  Intensity: {emotionalState.emotion_intensity}/10
                </div>
              )}
            </div>

            {/* Stress Level */}
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-slate-700">Stress Level</span>
              </div>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStressLevelColor(emotionalState.stress_level)}`}>
                {emotionalState.stress_level}/10
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    emotionalState.stress_level >= 8 ? 'bg-red-500' :
                    emotionalState.stress_level >= 6 ? 'bg-orange-500' :
                    emotionalState.stress_level >= 4 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${emotionalState.stress_level * 10}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tone Analysis */}
          {emotionalState.tone_score !== undefined && (
            <div className="mb-4">
              <div className="text-sm font-medium text-slate-700 mb-2">Communication Tone</div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">Negative</span>
                <div className="flex-1 bg-slate-200 rounded-full h-2 relative">
                  <div
                    className={`absolute top-0 h-2 rounded-full transition-all duration-500 ${
                      emotionalState.tone_score > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.abs(emotionalState.tone_score) * 5}%`,
                      left: emotionalState.tone_score > 0 ? '50%' : `${50 - Math.abs(emotionalState.tone_score) * 5}%`
                    }}
                  />
                  <div className="absolute top-0 left-1/2 w-0.5 h-2 bg-slate-400 transform -translate-x-0.5" />
                </div>
                <span className="text-xs text-slate-500">Positive</span>
              </div>
              <div className="text-center mt-1">
                <span className="text-xs text-slate-600">
                  {emotionalState.tone_score > 5 ? 'Positive' :
                   emotionalState.tone_score < -5 ? 'Negative' : 'Neutral'} tone
                </span>
              </div>
            </div>
          )}

          {/* Secondary Emotions */}
          {emotionalState.secondary_emotions && emotionalState.secondary_emotions.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium text-slate-700 mb-2">Other Emotions Detected</div>
              <div className="flex flex-wrap gap-2">
                {emotionalState.secondary_emotions.map((emotion, idx) => (
                  <div key={idx} className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full">
                    {getEmotionIcon(emotion.emotion)}
                    <span className="text-xs text-slate-700">{emotion.emotion}</span>
                    {emotion.confidence && (
                      <span className="text-xs text-slate-500">({emotion.confidence}%)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Emotional Context */}
          {emotionalState.context_factors && emotionalState.context_factors.length > 0 && (
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">Contributing Factors</div>
              <div className="space-y-1">
                {emotionalState.context_factors.map((factor, idx) => (
                  <div key={idx} className="text-xs text-slate-600 bg-slate-50 p-2 rounded">
                    • {factor}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-4 text-center">
          <Heart className="w-8 h-8 mx-auto mb-2 text-slate-400" />
          <p className="text-sm text-slate-600 mb-3">No emotional analysis available yet</p>
          <button
            onClick={analyzeCurrentMood}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Analyze Current Mood'}
          </button>
        </div>
      )}

      {/* Stress Indicators */}
      {stressIndicators.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Stress Indicators
          </h3>
          <div className="space-y-2">
            {stressIndicators.map((indicator, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2 bg-orange-50 rounded">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  indicator.severity === 'high' ? 'bg-red-500' :
                  indicator.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                }`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800">{indicator.indicator}</div>
                  <div className="text-xs text-slate-600">{indicator.description}</div>
                  {indicator.suggestion && (
                    <div className="text-xs text-slate-500 mt-1 italic">
                      Suggestion: {indicator.suggestion}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emotional Recommendations */}
      {emotionalRecommendations.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-500" />
            Emotional Support Recommendations
          </h3>
          <div className="space-y-3">
            {emotionalRecommendations.map((rec, idx) => (
              <div key={idx} className="p-3 bg-purple-50 rounded-lg">
                <div className="text-sm font-medium text-purple-800 mb-1">
                  {rec.action}
                </div>
                <div className="text-xs text-purple-700 mb-2">
                  {rec.description}
                </div>
                {rec.techniques && rec.techniques.length > 0 && (
                  <div className="text-xs text-purple-600">
                    <span className="font-medium">Techniques:</span>
                    <ul className="list-disc list-inside ml-2 mt-1">
                      {rec.techniques.map((technique, techIdx) => (
                        <li key={techIdx}>{technique}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emotional History Trend */}
      {emotionalHistory.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            Emotional Journey
          </h3>
          <div className="space-y-2">
            {emotionalHistory.slice(0, 8).map((state, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <div className="flex items-center gap-3">
                  {getEmotionIcon(state.primary_emotion)}
                  <div>
                    <div className="text-sm text-slate-700">{state.primary_emotion}</div>
                    <div className="text-xs text-slate-500">
                      {formatTimeAgo(state.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${getStressLevelColor(state.stress_level)}`}>
                    Stress: {state.stress_level}/10
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emotional Intelligence Tips */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-green-500" />
          Emotional Intelligence Tips
        </h3>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="p-2 bg-green-50 rounded">
            <strong>Active Listening:</strong> Pay attention to not just words, but tone and body language.
          </div>
          <div className="p-2 bg-blue-50 rounded">
            <strong>Emotional Validation:</strong> Acknowledge emotions without necessarily agreeing with positions.
          </div>
          <div className="p-2 bg-purple-50 rounded">
            <strong>Stress Management:</strong> Take breaks when tension rises. Consider breathing exercises.
          </div>
          <div className="p-2 bg-yellow-50 rounded">
            <strong>Reframing:</strong> Help parties see situations from different perspectives.
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
        <div className="text-xs text-yellow-800">
          <strong>Note:</strong> Emotional analysis is based on text patterns and should supplement, 
          not replace, professional judgment and direct observation of participants.
        </div>
      </div>
    </div>
  );
};

export default EmotionalAnalysis;