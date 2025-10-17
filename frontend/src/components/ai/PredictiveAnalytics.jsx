/**
 * Predictive Analytics Component
 * 
 * Displays AI-driven predictions and analytics for mediation outcomes
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, AlertCircle, CheckCircle, Clock, Target } from 'lucide-react';
import { apiFetch } from '../../../lib/apiClient';

const PredictiveAnalytics = ({ predictions: initialPredictions, sessionId }) => {
  const [predictions, setPredictions] = useState(initialPredictions);
  const [loading, setLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const [riskFactors, setRiskFactors] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (!predictions) {
      generatePredictions();
    }
    loadHistoricalData();
  }, [sessionId]);

  const generatePredictions = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/ai/predict-agreement', {
        method: 'POST',
        body: JSON.stringify({ sessionId })
      });

      if (response.ok) {
        setPredictions(response.data);
        setRiskFactors(response.data.risk_factors || []);
        setRecommendations(response.data.recommendations || []);
      }
    } catch (error) {
      console.error('Prediction generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistoricalData = async () => {
    try {
      const response = await apiFetch(`/api/settlement-sessions/${sessionId}/analytics-history`);
      if (response && Array.isArray(response)) {
        setHistoricalData(response);
      }
    } catch (error) {
      console.error('Failed to load historical data:', error);
    }
  };

  const getLikelihoodColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getLikelihoodIcon = (score) => {
    if (score >= 70) return <TrendingUp className="w-4 h-4" />;
    if (score >= 40) return <BarChart3 className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  const formatTimeEstimate = (hours) => {
    if (hours < 1) return `${Math.round(hours * 60)} minutes`;
    if (hours < 24) return `${Math.round(hours)} hours`;
    return `${Math.round(hours / 24)} days`;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 animate-pulse text-blue-500" />
          <p className="text-sm text-slate-600">Analyzing case patterns...</p>
        </div>
      </div>
    );
  }

  if (!predictions) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-slate-400" />
          <p className="text-sm text-slate-600 mb-3">No predictions available yet</p>
          <button
            onClick={generatePredictions}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Generate Analytics
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Main Prediction Card */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-slate-800">Settlement Likelihood</h3>
          <div className="flex items-center gap-2">
            {getLikelihoodIcon(predictions.likelihood_score)}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLikelihoodColor(predictions.likelihood_score)}`}>
              {predictions.likelihood_score}%
            </span>
          </div>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${
              predictions.likelihood_score >= 70 ? 'bg-green-500' :
              predictions.likelihood_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${predictions.likelihood_score}%` }}
          />
        </div>

        <p className="text-sm text-slate-600">
          {predictions.prediction_summary || 'Based on case patterns and current progress.'}
        </p>

        {predictions.confidence_interval && (
          <div className="mt-2 text-xs text-slate-500">
            Confidence interval: {predictions.confidence_interval.lower}% - {predictions.confidence_interval.upper}%
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {predictions.estimated_completion_time && (
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-slate-700">Estimated Time</span>
            </div>
            <div className="text-lg font-semibold text-slate-800">
              {formatTimeEstimate(predictions.estimated_completion_time)}
            </div>
            <div className="text-xs text-slate-500">
              To reach agreement
            </div>
          </div>
        )}

        {predictions.complexity_score && (
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-slate-700">Case Complexity</span>
            </div>
            <div className="text-lg font-semibold text-slate-800">
              {predictions.complexity_score}/10
            </div>
            <div className="text-xs text-slate-500">
              {predictions.complexity_score <= 3 ? 'Low' :
               predictions.complexity_score <= 6 ? 'Medium' : 'High'} complexity
            </div>
          </div>
        )}

        {predictions.emotional_volatility && (
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium text-slate-700">Emotional Risk</span>
            </div>
            <div className="text-lg font-semibold text-slate-800">
              {predictions.emotional_volatility}/10
            </div>
            <div className="text-xs text-slate-500">
              {predictions.emotional_volatility <= 3 ? 'Low' :
               predictions.emotional_volatility <= 6 ? 'Medium' : 'High'} tension
            </div>
          </div>
        )}
      </div>

      {/* Risk Factors */}
      {riskFactors.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            Risk Factors
          </h3>
          <div className="space-y-2">
            {riskFactors.map((factor, idx) => (
              <div key={idx} className="flex items-start gap-3 p-2 bg-orange-50 rounded">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  factor.severity === 'high' ? 'bg-red-500' :
                  factor.severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500'
                }`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800">{factor.factor}</div>
                  <div className="text-xs text-slate-600">{factor.description}</div>
                  {factor.impact_score && (
                    <div className="text-xs text-slate-500 mt-1">
                      Impact: {factor.impact_score}/10
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            AI Recommendations
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm font-medium text-green-800 mb-1">
                  {rec.action}
                </div>
                <div className="text-xs text-green-700 mb-2">
                  {rec.reasoning}
                </div>
                {rec.expected_impact && (
                  <div className="text-xs text-green-600">
                    Expected impact: +{rec.expected_impact}% success likelihood
                  </div>
                )}
                {rec.priority && (
                  <div className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {rec.priority} priority
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pattern Analysis */}
      {predictions.pattern_analysis && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-slate-800 mb-3">Pattern Analysis</h3>
          <div className="text-sm text-slate-600 space-y-2">
            {predictions.pattern_analysis.similar_cases && (
              <div>
                <span className="font-medium">Similar cases:</span> {predictions.pattern_analysis.similar_cases} analyzed
              </div>
            )}
            {predictions.pattern_analysis.success_rate && (
              <div>
                <span className="font-medium">Historical success rate:</span> {predictions.pattern_analysis.success_rate}%
              </div>
            )}
            {predictions.pattern_analysis.key_factors && (
              <div>
                <span className="font-medium">Key success factors:</span>
                <ul className="list-disc list-inside mt-1 ml-4">
                  {predictions.pattern_analysis.key_factors.map((factor, idx) => (
                    <li key={idx} className="text-xs">{factor}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Historical Trend */}
      {historicalData.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-medium text-slate-800 mb-3">Progress Trend</h3>
          <div className="space-y-2">
            {historicalData.slice(0, 5).map((data, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <div className="text-sm text-slate-700">
                  {new Date(data.timestamp).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${getLikelihoodColor(data.likelihood_score)}`}>
                    {data.likelihood_score}%
                  </span>
                  {idx === 0 && data.likelihood_score > (historicalData[1]?.likelihood_score || 0) && (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center pt-4">
        <button
          onClick={generatePredictions}
          disabled={loading}
          className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Refresh Analytics'}
        </button>
        <p className="text-xs text-slate-500 mt-2">
          Analytics update based on latest case progress
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
        <div className="text-xs text-yellow-800">
          <strong>Note:</strong> Predictions are based on historical patterns and current case data. 
          Actual outcomes may vary depending on various factors not captured in the analysis.
        </div>
      </div>
    </div>
  );
};

export default PredictiveAnalytics;