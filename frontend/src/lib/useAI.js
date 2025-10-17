/**
 * Custom hook for AI operations
 * Provides functions to interact with AI endpoints
 */

import { useState } from 'react';
import { apiFetch } from './apiClient';

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = () => setError(null);

  // Summarize text
  const summarizeText = async (text, context = 'text', caseId = null, save = true) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiFetch('/api/ai/summarize', {
        method: 'POST',
        body: JSON.stringify({
          text,
          context,
          case_id: caseId,
          save,
        }),
      });
      
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to summarize text');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Analyze tone
  const analyzeTone = async (text, speaker = 'participant', caseId = null, save = true) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiFetch('/api/ai/analyze-tone', {
        method: 'POST',
        body: JSON.stringify({
          text,
          speaker,
          case_id: caseId,
          save,
        }),
      });
      
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to analyze tone');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Suggest rephrase
  const suggestRephrase = async (message, concern = '', caseId = null, save = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiFetch('/api/ai/suggest-rephrase', {
        method: 'POST',
        body: JSON.stringify({
          message,
          concern,
          case_id: caseId,
          save,
        }),
      });
      
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to suggest rephrase');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Assess risk
  const assessRisk = async (conversationText, caseId = null, save = true) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiFetch('/api/ai/assess-risk', {
        method: 'POST',
        body: JSON.stringify({
          conversation_text: conversationText,
          case_id: caseId,
          save,
        }),
      });
      
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to assess risk');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get insights for a case
  const getInsights = async (caseId, type = null, limit = 50) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (limit) params.append('limit', limit.toString());
      
      const url = `/api/ai/insights/${caseId}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiFetch(url);
      
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to get insights');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check AI service health
  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiFetch('/api/ai/health');
      return response;
    } catch (err) {
      setError(err.message || 'AI service health check failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    clearError,
    summarizeText,
    analyzeTone,
    suggestRephrase,
    assessRisk,
    getInsights,
    checkHealth,
  };
}