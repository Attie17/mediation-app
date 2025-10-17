/**
 * Legal Guidance Panel
 * 
 * Specialized legal guidance interface with South African family law expertise
 */

import React, { useState, useEffect } from 'react';
import { Scale, BookOpen, AlertTriangle, CheckCircle, Info, ExternalLink } from 'lucide-react';
import { apiFetch } from '../../../lib/apiClient';

const LegalGuidancePanel = ({ sessionId, caseData }) => {
  const [legalQuery, setLegalQuery] = useState('');
  const [guidance, setGuidance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [legalTopics, setLegalTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [legalHistory, setLegalHistory] = useState([]);

  useEffect(() => {
    loadLegalTopics();
    loadLegalHistory();
  }, [sessionId]);

  const loadLegalTopics = async () => {
    try {
      const topics = await apiFetch('/api/ai/legal-topics');
      if (topics.ok) {
        setLegalTopics(topics.data);
      }
    } catch (error) {
      console.error('Failed to load legal topics:', error);
    }
  };

  const loadLegalHistory = async () => {
    try {
      const history = await apiFetch(`/api/settlement-sessions/${sessionId}/legal-history`);
      if (history && Array.isArray(history)) {
        setLegalHistory(history);
      }
    } catch (error) {
      console.error('Failed to load legal history:', error);
    }
  };

  const getLegalGuidance = async (query = legalQuery) => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await apiFetch('/api/ai/legal-guidance', {
        method: 'POST',
        body: JSON.stringify({
          query: query.trim(),
          caseContext: {
            ...caseData,
            session_id: sessionId,
            jurisdiction: 'south_africa'
          },
          sessionId
        })
      });

      if (response.ok) {
        setGuidance(response.data);
        setLegalHistory(prev => [response.data, ...prev]);
        setLegalQuery('');
      }
    } catch (error) {
      console.error('Legal guidance request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTopicGuidance = async (topic) => {
    setSelectedTopic(topic);
    await getLegalGuidance(topic.query);
  };

  const commonTopics = [
    {
      id: 'custody',
      title: 'Child Custody & Care',
      query: 'What are the key factors courts consider for child custody in South Africa?',
      description: 'Best interests of the child principle and custody arrangements'
    },
    {
      id: 'maintenance',
      title: 'Child Maintenance',
      query: 'How is child maintenance calculated and enforced in South Africa?',
      description: 'Financial support obligations and calculation methods'
    },
    {
      id: 'assets',
      title: 'Asset Division',
      query: 'How are matrimonial assets divided in South African divorce law?',
      description: 'Property rights and asset distribution principles'
    },
    {
      id: 'agreements',
      title: 'Settlement Agreements',
      query: 'What makes a divorce settlement agreement legally binding in South Africa?',
      description: 'Legal requirements for enforceable agreements'
    },
    {
      id: 'mediation',
      title: 'Mediation Process',
      query: 'What is the legal status of mediation in South African family law?',
      description: 'Mediation benefits and legal framework'
    },
    {
      id: 'domestic_violence',
      title: 'Domestic Violence',
      query: 'What legal protections exist for domestic violence victims in South Africa?',
      description: 'Protection orders and legal remedies'
    }
  ];

  return (
    <div className="h-full flex flex-col p-4">
      {/* Search Input */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={legalQuery}
            onChange={(e) => setLegalQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && getLegalGuidance()}
            placeholder="Ask about South African family law..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => getLegalGuidance()}
            disabled={!legalQuery.trim() || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Ask'}
          </button>
        </div>
      </div>

      {/* Common Topics */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-slate-700 mb-2">Common Legal Topics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {commonTopics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => getTopicGuidance(topic)}
              className="text-left p-3 border rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="font-medium text-sm text-slate-800">{topic.title}</div>
              <div className="text-xs text-slate-600 mt-1">{topic.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Current Guidance */}
      {guidance && (
        <div className="mb-4 bg-white border rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Scale className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium text-slate-800">Legal Guidance</h3>
                {guidance.confidence_score && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {guidance.confidence_score}% confidence
                  </span>
                )}
              </div>
              
              <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap mb-3">
                {guidance.guidance}
              </div>

              {guidance.relevant_sections && guidance.relevant_sections.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Relevant Legal Sections:</h4>
                  <div className="space-y-1">
                    {guidance.relevant_sections.map((section, idx) => (
                      <div key={idx} className="text-sm text-slate-600 bg-slate-50 p-2 rounded">
                        <span className="font-medium">{section.act}:</span> {section.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {guidance.follow_up_suggestions && guidance.follow_up_suggestions.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Related Questions:</h4>
                  <div className="space-y-1">
                    {guidance.follow_up_suggestions.slice(0, 3).map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => getLegalGuidance(suggestion)}
                        className="block text-sm text-blue-600 hover:text-blue-800 text-left"
                      >
                        • {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {guidance.case_law_references && guidance.case_law_references.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Relevant Case Law:</h4>
                  <div className="space-y-1">
                    {guidance.case_law_references.map((caseRef, idx) => (
                      <div key={idx} className="text-sm text-slate-600">
                        <span className="font-medium">{caseRef.case_name}</span>
                        {caseRef.year && <span className="text-slate-500"> ({caseRef.year})</span>}
                        {caseRef.principle && (
                          <div className="text-xs text-slate-500 mt-1">
                            Key principle: {caseRef.principle}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Legal Disclaimer */}
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-yellow-800">
                    <strong>Important Disclaimer:</strong> This guidance is for informational purposes only and does not constitute legal advice. 
                    Consult with a qualified South African family law attorney for advice specific to your situation.
                    {guidance.disclaimer && (
                      <div className="mt-1">{guidance.disclaimer}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legal History */}
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-sm font-medium text-slate-700 mb-2">Recent Legal Queries</h3>
        <div className="space-y-2">
          {legalHistory.slice(0, 5).map((item, idx) => (
            <div key={idx} className="bg-slate-50 rounded p-3 text-sm">
              <div className="font-medium text-slate-800 mb-1">
                {item.query || 'Legal query'}
              </div>
              <div className="text-slate-600 text-xs line-clamp-2">
                {item.guidance?.substring(0, 150)}...
              </div>
              <div className="text-slate-500 text-xs mt-1">
                {new Date(item.timestamp || Date.now()).toLocaleString()}
              </div>
            </div>
          ))}
          
          {legalHistory.length === 0 && (
            <div className="text-center text-slate-500 py-4">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No legal queries yet. Ask about South African family law above.</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Access to Legal Resources */}
      <div className="mt-4 pt-4 border-t">
        <h4 className="text-sm font-medium text-slate-700 mb-2">Legal Resources</h4>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://www.justice.gov.za/legislation/acts/2005-038.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Children's Act <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://www.justice.gov.za/legislation/acts/1979-70.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Divorce Act <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://www.justice.gov.za/legislation/acts/1998-116.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Domestic Violence Act <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default LegalGuidancePanel;