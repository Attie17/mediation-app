/**
 * Conflict Resolution Component
 * 
 * AI-powered conflict resolution strategies and intervention suggestions
 */

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Lightbulb, Users, Target, ArrowRight } from 'lucide-react';
import { apiFetch } from '../../../lib/apiClient';

const ConflictResolution = ({ sessionId, caseData }) => {
  const [conflictAnalysis, setConflictAnalysis] = useState(null);
  const [resolutionStrategies, setResolutionStrategies] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [conflictHistory, setConflictHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeStrategy, setActiveStrategy] = useState(null);

  useEffect(() => {
    loadConflictHistory();
    analyzeCurrentConflict();
  }, [sessionId]);

  const analyzeCurrentConflict = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/ai/analyze-conflict', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          caseContext: caseData
        })
      });

      if (response.ok) {
        setConflictAnalysis(response.data);
        await generateResolutionStrategies(response.data);
      }
    } catch (error) {
      console.error('Conflict analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateResolutionStrategies = async (analysis) => {
    try {
      const response = await apiFetch('/api/ai/resolve-conflict', {
        method: 'POST',
        body: JSON.stringify({
          conflictData: {
            analysis,
            context: 'mediation_session',
            parties: caseData?.parties || []
          },
          sessionId
        })
      });

      if (response.ok) {
        setResolutionStrategies(response.data.strategies || []);
        setInterventions(response.data.interventions || []);
      }
    } catch (error) {
      console.error('Strategy generation failed:', error);
    }
  };

  const loadConflictHistory = async () => {
    try {
      const response = await apiFetch(`/api/settlement-sessions/${sessionId}/conflict-history`);
      if (response && Array.isArray(response)) {
        setConflictHistory(response);
      }
    } catch (error) {
      console.error('Failed to load conflict history:', error);
    }
  };

  const applyStrategy = async (strategyId) => {
    try {
      const response = await apiFetch('/api/ai/apply-strategy', {
        method: 'POST',
        body: JSON.stringify({
          strategyId,
          sessionId
        })
      });

      if (response.ok) {
        setActiveStrategy(strategyId);
        // Add feedback tracking
        setConflictHistory(prev => [{
          ...response.data,
          timestamp: new Date().toISOString(),
          type: 'strategy_applied'
        }, ...prev]);
      }
    } catch (error) {
      console.error('Strategy application failed:', error);
    }
  };

  const getConflictLevelColor = (level) => {
    if (level >= 8) return 'text-red-600 bg-red-100 border-red-200';
    if (level >= 6) return 'text-orange-600 bg-orange-100 border-orange-200';
    if (level >= 4) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-green-600 bg-green-100 border-green-200';
  };

  const getStrategyIcon = (type) => {
    const icons = {
      'communication': <Users className="w-4 h-4" />,
      'negotiation': <Target className="w-4 h-4" />,
      'mediation': <Shield className="w-4 h-4" />,
      'intervention': <AlertTriangle className="w-4 h-4" />,
      'collaborative': <CheckCircle className="w-4 h-4" />,
      'cooling_off': <Lightbulb className="w-4 h-4" />
    };
    return icons[type] || <Shield className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-8 h-8 mx-auto mb-2 animate-pulse text-blue-500" />
          <p className="text-sm text-slate-600">Analyzing conflict patterns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Conflict Analysis Overview */}
      {conflictAnalysis && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Conflict Analysis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Conflict Level */}
            <div className={`p-3 rounded-lg border ${getConflictLevelColor(conflictAnalysis.conflict_level)}`}>
              <div className="text-sm font-medium mb-1">Conflict Intensity</div>
              <div className="text-2xl font-bold">{conflictAnalysis.conflict_level}/10</div>
              <div className="text-xs opacity-75">
                {conflictAnalysis.conflict_level >= 8 ? 'High Risk' :
                 conflictAnalysis.conflict_level >= 6 ? 'Elevated' :
                 conflictAnalysis.conflict_level >= 4 ? 'Moderate' : 'Low Risk'}
              </div>
            </div>

            {/* Primary Issue */}
            <div className="p-3 bg-slate-50 rounded-lg border">
              <div className="text-sm font-medium text-slate-700 mb-1">Primary Issue</div>
              <div className="text-sm text-slate-800 font-medium">
                {conflictAnalysis.primary_issue || 'Not identified'}
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Most contentious topic
              </div>
            </div>

            {/* Resolution Potential */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-700 mb-1">Resolution Potential</div>
              <div className="text-2xl font-bold text-blue-800">
                {conflictAnalysis.resolution_potential || 'N/A'}%
              </div>
              <div className="text-xs text-blue-600">
                Based on current dynamics
              </div>
            </div>
          </div>

          {/* Conflict Drivers */}
          {conflictAnalysis.conflict_drivers && conflictAnalysis.conflict_drivers.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Key Conflict Drivers</h4>
              <div className="space-y-2">
                {conflictAnalysis.conflict_drivers.map((driver, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-2 bg-red-50 rounded">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      driver.severity === 'high' ? 'bg-red-500' :
                      driver.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`} />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-800">{driver.factor}</div>
                      <div className="text-xs text-slate-600">{driver.description}</div>
                      {driver.impact_score && (
                        <div className="text-xs text-slate-500 mt-1">
                          Impact: {driver.impact_score}/10
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Escalation Risk */}
          {conflictAnalysis.escalation_risk && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Escalation Risk Assessment</span>
              </div>
              <div className="text-sm text-yellow-700">
                {conflictAnalysis.escalation_risk.description}
              </div>
              {conflictAnalysis.escalation_risk.triggers && (
                <div className="mt-2">
                  <div className="text-xs font-medium text-yellow-800">Potential Triggers:</div>
                  <ul className="text-xs text-yellow-700 list-disc list-inside mt-1">
                    {conflictAnalysis.escalation_risk.triggers.map((trigger, idx) => (
                      <li key={idx}>{trigger}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Resolution Strategies */}
      {resolutionStrategies.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-green-500" />
            Recommended Resolution Strategies
          </h3>
          <div className="space-y-3">
            {resolutionStrategies.map((strategy, idx) => (
              <div 
                key={idx} 
                className={`p-4 rounded-lg border transition-all ${
                  activeStrategy === strategy.id 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStrategyIcon(strategy.type)}
                    <span className="font-medium text-slate-800">{strategy.name}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      strategy.priority === 'high' ? 'bg-red-100 text-red-700' :
                      strategy.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {strategy.priority} priority
                    </span>
                  </div>
                  {strategy.success_rate && (
                    <span className="text-sm text-green-600 font-medium">
                      {strategy.success_rate}% success rate
                    </span>
                  )}
                </div>

                <div className="text-sm text-slate-600 mb-3">
                  {strategy.description}
                </div>

                {/* Implementation Steps */}
                {strategy.steps && strategy.steps.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-slate-700 mb-2">Implementation Steps:</div>
                    <div className="space-y-1">
                      {strategy.steps.map((step, stepIdx) => (
                        <div key={stepIdx} className="flex items-start gap-2 text-xs text-slate-600">
                          <span className="text-blue-500 font-medium">{stepIdx + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expected Outcomes */}
                {strategy.expected_outcomes && strategy.expected_outcomes.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-slate-700 mb-2">Expected Outcomes:</div>
                    <div className="flex flex-wrap gap-1">
                      {strategy.expected_outcomes.map((outcome, outcomeIdx) => (
                        <span 
                          key={outcomeIdx}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                        >
                          {outcome}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex justify-between items-center">
                  <div className="text-xs text-slate-500">
                    Estimated time: {strategy.estimated_duration || 'Variable'}
                  </div>
                  <button
                    onClick={() => applyStrategy(strategy.id)}
                    disabled={activeStrategy === strategy.id}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      activeStrategy === strategy.id
                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {activeStrategy === strategy.id ? 'Applied' : 'Apply Strategy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Immediate Interventions */}
      {interventions.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            Immediate Interventions
          </h3>
          <div className="space-y-2">
            {interventions.map((intervention, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-blue-800 mb-1">
                    {intervention.action}
                  </div>
                  <div className="text-xs text-blue-700 mb-2">
                    {intervention.rationale}
                  </div>
                  {intervention.script && (
                    <div className="text-xs text-blue-600 bg-white p-2 rounded border">
                      <span className="font-medium">Suggested script:</span> "{intervention.script}"
                    </div>
                  )}
                  {intervention.timing && (
                    <div className="text-xs text-blue-500 mt-1">
                      Best timing: {intervention.timing}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflict Resolution History */}
      {conflictHistory.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-slate-800 mb-3">Resolution History</h3>
          <div className="space-y-2">
            {conflictHistory.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2 bg-slate-50 rounded">
                <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm text-slate-800 font-medium">
                    {item.action || item.strategy_name || 'Conflict intervention'}
                  </div>
                  <div className="text-xs text-slate-600">
                    {item.description || 'Applied conflict resolution strategy'}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                  {item.outcome && (
                    <div className="text-xs text-green-600 mt-1">
                      Outcome: {item.outcome}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium text-slate-800 mb-3">Quick Conflict Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            onClick={() => analyzeCurrentConflict()}
            className="p-2 text-left text-sm border rounded hover:bg-slate-50"
          >
            <div className="font-medium">Re-analyze Conflict</div>
            <div className="text-xs text-slate-600">Update current assessment</div>
          </button>
          <button
            onClick={() => generateResolutionStrategies(conflictAnalysis)}
            className="p-2 text-left text-sm border rounded hover:bg-slate-50"
          >
            <div className="font-medium">Generate New Strategies</div>
            <div className="text-xs text-slate-600">Fresh resolution approaches</div>
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
        <div className="text-xs text-yellow-800">
          <strong>Important:</strong> AI suggestions should supplement professional mediation skills. 
          Consider the unique context and cultural factors of each situation.
        </div>
      </div>
    </div>
  );
};

export default ConflictResolution;