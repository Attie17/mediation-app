/**
 * AI Insights Dashboard Component
 * 
 * Displays AI-generated insights for a case including:
 * - Session summaries
 * - Tone analysis
 * - Risk assessments
 * - Agreement tracking
 * - Rephrase suggestions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../lib/apiClient';

// Icon components (using simple text for now, can be replaced with proper icons)
const Icons = {
  AlertTriangle: () => <span className="text-red-500">⚠️</span>,
  TrendingUp: () => <span className="text-orange-500">📈</span>,
  MessageSquare: () => <span className="text-blue-500">💬</span>,
  CheckCircle: () => <span className="text-green-500">✅</span>,
  Edit: () => <span className="text-purple-500">✏️</span>,
  BarChart: () => <span className="text-indigo-500">📊</span>,
  RefreshCw: () => <span className="text-gray-500">🔄</span>,
  X: () => <span className="text-gray-400">✕</span>,
};

// Insight type configurations
const INSIGHT_CONFIGS = {
  summary: {
    title: 'Session Summary',
    icon: Icons.MessageSquare,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-900',
  },
  tone_analysis: {
    title: 'Tone Analysis',
    icon: Icons.BarChart,
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-900',
  },
  risk_assessment: {
    title: 'Risk Assessment',
    icon: Icons.AlertTriangle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-900',
  },
  rephrase_suggestion: {
    title: 'Rephrase Suggestion',
    icon: Icons.Edit,
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-900',
  },
  key_points: {
    title: 'Key Points',
    icon: Icons.CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-900',
  },
  document_analysis: {
    title: 'Document Analysis',
    icon: Icons.TrendingUp,
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-900',
  },
};

// Individual insight card component
function InsightCard({ insight, onDelete }) {
  const config = INSIGHT_CONFIGS[insight.insight_type] || INSIGHT_CONFIGS.summary;
  const IconComponent = config.icon;
  
  // Parse content safely
  let content;
  try {
    content = typeof insight.content === 'string' ? JSON.parse(insight.content) : insight.content;
  } catch (e) {
    content = { summary: insight.content };
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this insight?')) {
      try {
        await apiFetch(`/api/ai/insights/${insight.id}`, { method: 'DELETE' });
        onDelete(insight.id);
      } catch (error) {
        console.error('Failed to delete insight:', error);
        alert('Failed to delete insight');
      }
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <IconComponent />
          <h3 className={`font-medium ${config.textColor}`}>{config.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{formatDate(insight.created_at)}</span>
          <button
            onClick={handleDelete}
            className="text-gray-400 hover:text-red-500 text-xs"
            title="Delete insight"
          >
            <Icons.X />
          </button>
        </div>
      </div>

      {/* Content based on insight type */}
      <div className={`text-sm ${config.textColor}`}>
        {insight.insight_type === 'summary' && (
          <div className="space-y-2">
            <p>{content.summary}</p>
            {content.keyPoints && content.keyPoints.length > 0 && (
              <div>
                <strong>Key Points:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {content.keyPoints.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
            {content.agreements && content.agreements.length > 0 && (
              <div>
                <strong>Agreements:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 text-green-700">
                  {content.agreements.map((agreement, idx) => (
                    <li key={idx}>{agreement}</li>
                  ))}
                </ul>
              </div>
            )}
            {content.unresolvedIssues && content.unresolvedIssues.length > 0 && (
              <div>
                <strong>Unresolved Issues:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 text-orange-700">
                  {content.unresolvedIssues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {insight.insight_type === 'tone_analysis' && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span><strong>Tone:</strong> {content.tone}</span>
              <span><strong>Intensity:</strong> {content.intensity}/10</span>
            </div>
            {content.concerns && content.concerns.length > 0 && (
              <div>
                <strong>Concerns:</strong>
                <ul className="list-disc list-inside mt-1 text-red-700">
                  {content.concerns.map((concern, idx) => (
                    <li key={idx}>{concern}</li>
                  ))}
                </ul>
              </div>
            )}
            {content.suggestions && (
              <div>
                <strong>Suggestions:</strong>
                <p className="mt-1 text-blue-700">{content.suggestions}</p>
              </div>
            )}
          </div>
        )}

        {insight.insight_type === 'risk_assessment' && (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span><strong>Risk Level:</strong> 
                <span className={`ml-1 font-bold ${
                  content.risk_level === 'high' || content.risk_level === 'critical' 
                    ? 'text-red-600' 
                    : content.risk_level === 'medium' 
                    ? 'text-orange-600' 
                    : 'text-green-600'
                }`}>
                  {content.risk_level?.toUpperCase()}
                </span>
              </span>
              <span><strong>Score:</strong> {content.risk_score}/10</span>
            </div>
            {content.recommendations && content.recommendations.length > 0 && (
              <div>
                <strong>Recommendations:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {content.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {insight.insight_type === 'rephrase_suggestion' && (
          <div className="space-y-2">
            <div>
              <strong>Original:</strong>
              <p className="mt-1 p-2 bg-gray-100 rounded italic">{content.original}</p>
            </div>
            <div>
              <strong>Suggested:</strong>
              <p className="mt-1 p-2 bg-green-100 rounded">{content.suggested}</p>
            </div>
            {content.rationale && (
              <div>
                <strong>Rationale:</strong>
                <p className="mt-1 text-gray-700">{content.rationale}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Creator info */}
      {insight.created_by_name && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <span className="text-xs text-gray-500">
            by {insight.created_by_name}
          </span>
        </div>
      )}
    </div>
  );
}

// Main AI Insights Dashboard component
export default function AIInsightsDashboard({ caseId, compact = false, insightTypes = null }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchInsights = useCallback(async () => {
    if (!caseId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams();
      if (insightTypes && insightTypes.length > 0) {
        params.append('type', insightTypes[0]); // API only supports one type at a time
      }
      params.append('limit', compact ? '5' : '20');
      
      const url = `/api/ai/insights/${caseId}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiFetch(url);
      
      setInsights(response.insights || []);
    } catch (err) {
      console.error('Failed to fetch AI insights:', err);
      setError(err.message || 'Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  }, [caseId, insightTypes, compact]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleDeleteInsight = (insightId) => {
    setInsights(prev => prev.filter(insight => insight.id !== insightId));
  };

  const handleRefresh = () => {
    fetchInsights();
  };

  if (loading) {
    return (
      <div className={`${compact ? 'p-3' : 'p-6'} text-center`}>
        <Icons.RefreshCw />
        <span className="ml-2 text-gray-500">Loading AI insights...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${compact ? 'p-3' : 'p-6'} text-center`}>
        <div className="text-red-600 mb-2">⚠️ {error}</div>
        <button 
          onClick={handleRefresh}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">AI Insights</h2>
          <button
            onClick={handleRefresh}
            className="text-gray-500 hover:text-gray-700"
            title="Refresh insights"
          >
            <Icons.RefreshCw />
          </button>
        </div>
      )}

      {/* Insights list */}
      {insights.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <Icons.MessageSquare />
          <p className="mt-2">No AI insights yet</p>
          <p className="text-sm mt-1">Start a conversation to generate insights</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onDelete={handleDeleteInsight}
            />
          ))}
        </div>
      )}
    </div>
  );
}