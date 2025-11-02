import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb, Target, Zap } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

export default function EnhancedAnalytics({ stats, userId }) {
  const [aiInsights, setAiInsights] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && stats) {
      generateAIInsights();
    }
  }, [userId, stats]);

  const generateAIInsights = async () => {
    setLoading(true);
    
    // Generate insights based on stats patterns
    const insights = [];

    // Insight 1: Pending Reviews
    if (stats.pendingReviews > 5) {
      insights.push({
        type: 'warning',
        icon: <AlertCircle className="w-4 h-4" />,
        title: 'High Review Backlog',
        description: `You have ${stats.pendingReviews} pending reviews. Consider scheduling a review session.`,
        action: 'Review Now',
        actionLink: '/mediator/review'
      });
    } else if (stats.pendingReviews === 0) {
      insights.push({
        type: 'success',
        icon: <Target className="w-4 h-4" />,
        title: 'All Caught Up!',
        description: 'No pending reviews. Great time to focus on active sessions.',
        action: null
      });
    }

    // Insight 2: Active Cases Load
    if (stats.activeCases > 10) {
      insights.push({
        type: 'info',
        icon: <Lightbulb className="w-4 h-4" />,
        title: 'High Caseload',
        description: `Managing ${stats.activeCases} cases. Consider prioritizing cases nearing resolution.`,
        action: 'View Cases',
        actionLink: '#your-cases'
      });
    }

    // Insight 3: Today's Sessions
    if (stats.todaySessions > 3) {
      insights.push({
        type: 'info',
        icon: <Zap className="w-4 h-4" />,
        title: 'Busy Schedule Today',
        description: `${stats.todaySessions} sessions scheduled. Plan buffer time between sessions.`,
        action: 'View Schedule',
        actionLink: '#todays-schedule'
      });
    } else if (stats.todaySessions === 0 && stats.activeCases > 0) {
      insights.push({
        type: 'suggestion',
        icon: <Lightbulb className="w-4 h-4" />,
        title: 'Schedule Sessions',
        description: 'No sessions today. Consider scheduling check-ins with active cases.',
        action: 'Schedule',
        actionLink: '/mediator/sessions'
      });
    }

    // Insight 4: Resolution Rate
    if (stats.resolvedThisMonth >= 5) {
      insights.push({
        type: 'success',
        icon: <TrendingUp className="w-4 h-4" />,
        title: 'Strong Performance',
        description: `${stats.resolvedThisMonth} cases resolved this month. Excellent progress!`,
        action: null
      });
    }

    // Insight 5: Balance recommendation
    if (stats.pendingReviews > 0 && stats.todaySessions === 0) {
      insights.push({
        type: 'suggestion',
        icon: <Target className="w-4 h-4" />,
        title: 'Optimization Tip',
        description: 'Light schedule today - ideal time to clear pending reviews.',
        action: 'Start Reviews',
        actionLink: '/mediator/review'
      });
    }

    setAiInsights(insights.slice(0, 3)); // Show top 3 insights
    setLoading(false);
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'warning': return 'text-orange-400 bg-orange-500/10';
      case 'success': return 'text-green-400 bg-green-500/10';
      case 'info': return 'text-blue-400 bg-blue-500/10';
      case 'suggestion': return 'text-purple-400 bg-purple-500/10';
      default: return 'text-slate-400 bg-slate-500/10';
    }
  };

  if (aiInsights.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticItem label="Active Cases" value={stats.activeCases} trend="+2 this week" />
        <AnalyticItem label="Resolved This Month" value={stats.resolvedThisMonth} trend="Avg. 45 days" />
        <AnalyticItem label="Success Rate" value="94%" trend="+3% vs last month" positive />
        <AnalyticItem label="Avg. Response Time" value="2.4 hrs" trend="-0.5 hrs improvement" positive />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnalyticItem label="Active Cases" value={stats.activeCases} trend="+2 this week" />
        <AnalyticItem label="Resolved This Month" value={stats.resolvedThisMonth} trend="Avg. 45 days" />
        <AnalyticItem label="Success Rate" value="94%" trend="+3% vs last month" positive />
        <AnalyticItem label="Avg. Response Time" value="2.4 hrs" trend="-0.5 hrs improvement" positive />
      </div>

      {/* AI Insights */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-slate-300">AI Insights</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {aiInsights.map((insight, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border border-white/10 ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start gap-2 mb-2">
                {insight.icon}
                <h4 className="text-sm font-medium text-white">{insight.title}</h4>
              </div>
              <p className="text-xs text-slate-300 mb-2">{insight.description}</p>
              {insight.action && (
                <a
                  href={insight.actionLink}
                  className="text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors"
                >
                  {insight.action} →
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyticItem({ label, value, trend, positive }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="text-right">
        <div className="font-semibold text-white">{value}</div>
        <div className={`text-xs ${positive ? 'text-lime-400' : 'text-slate-500'}`}>{trend}</div>
      </div>
    </div>
  );
}
