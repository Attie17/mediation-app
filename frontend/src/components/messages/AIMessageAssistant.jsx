import React, { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, ThumbsUp, Lightbulb, RefreshCw, X } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

export default function AIMessageAssistant({ content, onSuggestion, onInsert }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showPanel, setShowPanel] = useState(true);

  // Analyze message as user types (debounced)
  useEffect(() => {
    if (!content || content.trim().length < 10) {
      setAnalysis(null);
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      analyzeMessage(content);
    }, 1000); // Wait 1 second after user stops typing

    return () => clearTimeout(timer);
  }, [content]);

  async function analyzeMessage(text) {
    setLoading(true);
    try {
      const response = await apiFetch('/api/ai/analyze-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          context: 'divorce_mediation',
          recipient_role: 'mediator'
        })
      });

      if (response.ok) {
        setAnalysis(response.analysis);
        setSuggestions(response.suggestions || []);
      }
    } catch (error) {
      console.error('Failed to analyze message:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateReformulation(tone = 'professional') {
    if (!content || content.trim().length < 10) {
      console.warn('Message too short to reformulate');
      return;
    }

    setLoading(true);
    try {
      console.log(`[AI Assistant] Reformulating with tone: ${tone}`);
      console.log(`[AI Assistant] Original content:`, content);
      
      const response = await apiFetch('/api/ai/reformulate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          tone,
          context: 'divorce_mediation'
        })
      });

      console.log('[AI Assistant] Response:', response);

      if (response.ok && response.reformulated) {
        console.log('[AI Assistant] Reformulated text:', response.reformulated);
        onInsert(response.reformulated);
      } else {
        console.error('[AI Assistant] Invalid response:', response);
      }
    } catch (error) {
      console.error('[AI Assistant] Failed to reformulate:', error);
      // Show user-friendly error
      alert(`Failed to reformulate message: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className="fixed bottom-24 right-4 bg-gradient-to-r from-teal-500 to-blue-500 
                   text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all
                   flex items-center gap-2 z-50"
      >
        <Sparkles size={20} />
        <span className="pr-2">AI Assistant</span>
      </button>
    );
  }

  return (
    <div className="bg-slate-800 border-t border-slate-700 p-4 max-h-64 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-teal-400" size={18} />
          <span className="text-sm font-semibold text-slate-200">AI Message Assistant</span>
        </div>
        <button
          onClick={() => setShowPanel(false)}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-slate-400 text-sm mb-3">
          <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <span>Analyzing your message...</span>
        </div>
      )}

      {/* Tone Analysis */}
      {analysis?.tone && (
        <div className="mb-3 p-3 rounded-lg bg-slate-700/50">
          <div className="flex items-start gap-2">
            {analysis.tone === 'positive' || analysis.tone === 'neutral' ? (
              <ThumbsUp className="text-green-400 flex-shrink-0 mt-0.5" size={16} />
            ) : (
              <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-0.5" size={16} />
            )}
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-300 mb-1">
                Tone: {analysis.tone.charAt(0).toUpperCase() + analysis.tone.slice(1)}
              </div>
              <p className="text-xs text-slate-400">{analysis.tone_explanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Consequence Warning */}
      {analysis?.warnings && analysis.warnings.length > 0 && (
        <div className="mb-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
            <div className="flex-1">
              <div className="text-xs font-semibold text-red-300 mb-1">
                ⚠️ Potential Issues
              </div>
              {analysis.warnings.map((warning, i) => (
                <p key={i} className="text-xs text-red-200 mb-1">• {warning}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="text-yellow-400" size={16} />
            <span className="text-xs font-semibold text-slate-300">Suggestions</span>
          </div>
          <div className="space-y-2">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => onInsert(suggestion.text)}
                className="w-full text-left p-2 rounded bg-slate-700 hover:bg-slate-600 
                           transition-colors text-xs text-slate-200 border border-slate-600"
              >
                <div className="font-medium mb-1">{suggestion.label}</div>
                <div className="text-slate-400 italic">"{suggestion.text.substring(0, 80)}..."</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {content && content.trim().length > 10 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => generateReformulation('professional')}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-teal-500/20 
                       hover:bg-teal-500/30 text-teal-300 text-xs font-medium
                       transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Make Professional
          </button>
          <button
            onClick={() => generateReformulation('empathetic')}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-blue-500/20 
                       hover:bg-blue-500/30 text-blue-300 text-xs font-medium
                       transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Make Empathetic
          </button>
          <button
            onClick={() => generateReformulation('concise')}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-purple-500/20 
                       hover:bg-purple-500/30 text-purple-300 text-xs font-medium
                       transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Make Concise
          </button>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !loading && content.trim().length < 10 && (
        <div className="text-center text-slate-400 text-xs py-4">
          <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Start typing to get AI suggestions...</p>
        </div>
      )}
    </div>
  );
}
