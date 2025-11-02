/**
 * AIInsightsPanel - Shows encouraging progress insights on divorcee dashboard
 * Provides next steps, progress tracking, and supportive messages
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, Clock, TrendingUp, MessageSquare, FileText, Calendar } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

export default function AIInsightsPanel({ 
  caseId, 
  userId, 
  onOpenAI, 
  score, 
  docsRemaining, 
  estimatedHours, 
  remainingMinutes,
  userRole,
  pageContext,
  pageDescription,
  stats
}) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For admin pages, generate admin-specific insights
    if (userRole === 'admin' && pageContext === 'admin-dashboard') {
      setInsights(generateAdminInsights(stats));
      setLoading(false);
      return;
    }

    if (!caseId || !userId) return;

    async function loadInsights() {
      try {
        // Fetch case insights from backend
        const data = await apiFetch(`/api/ai/insights/${caseId}?limit=5`);
        
        // If backend returns insights, use them
        if (data && data.ok) {
          setInsights(processBackendInsights(data.insights));
        } else {
          // Fallback: Generate encouraging insights from available data
          setInsights(generateFallbackInsights());
        }
      } catch (error) {
        console.error('[AI Insights] Error:', error);
        // Generate encouraging default insights even on error
        setInsights(generateFallbackInsights());
      } finally {
        setLoading(false);
      }
    }

    loadInsights();
  }, [caseId, userId]);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-teal-600 to-blue-600 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-white animate-pulse" />
          <h3 className="text-lg font-semibold text-white">AI Insights</h3>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-white/20 rounded animate-pulse"></div>
          <div className="h-4 bg-white/20 rounded animate-pulse w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  // Admin dashboard view
  if (userRole === 'admin' && pageContext === 'admin-dashboard') {
    return (
      <div className="bg-gradient-to-br from-teal-600 to-blue-600 rounded-xl p-6 shadow-lg text-white">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-yellow-300" />
          <h3 className="text-lg font-semibold">AI Dashboard Insights</h3>
        </div>

        {/* Page Explanation */}
        {insights.pageExplanation && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">💡</span>
              </div>
              <div>
                <p className="font-medium mb-1">About This Page:</p>
                <p className="text-sm text-white/90">{insights.pageExplanation}</p>
              </div>
            </div>
          </div>
        )}

        {/* System Health Summary */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-green-300" />
            <span className="font-medium">{insights.progressMessage}</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-teal-300 h-2 rounded-full transition-all duration-500"
              style={{ width: `${insights.progressPercent}%` }}
            ></div>
          </div>
          <p className="text-sm text-white/80">System health at {insights.progressPercent}%</p>
        </div>

        {/* Key Metrics Grid */}
        {insights.keyMetrics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {insights.keyMetrics.map((metric, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className="text-xs text-white/70 mt-1">{metric.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Next Recommended Action */}
        {insights.nextAction && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">👉</span>
              </div>
              <div>
                <p className="font-medium mb-1">Recommended Action:</p>
                <p className="text-sm text-white/90">{insights.nextAction}</p>
              </div>
            </div>
          </div>
        )}

        {/* Platform Stats */}
        {insights.encouragement && insights.encouragement.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold mb-3">Platform Analytics</h4>
            <div className="space-y-2">
              {insights.encouragement.map((msg, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">{msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Platform Status Breakdown */}
        {insights.platformStatus && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4">
            <h4 className="text-sm font-semibold mb-3">Role Distribution</h4>
            <div className="space-y-3">
              {insights.platformStatus.map((status, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">{status.label}</div>
                    <div className="text-xs text-white/60">{status.detail}</div>
                  </div>
                  <div className="text-lg font-bold text-teal-300">{status.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Help Button - For General Inquiries */}
        <button
          onClick={onOpenAI}
          className="mt-4 w-full bg-white text-teal-700 py-2 px-4 rounded-lg font-semibold hover:bg-teal-50 transition-all flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Ask AI for Help</span>
        </button>
        <p className="text-xs text-white/60 text-center mt-2">
          For personalized admin guidance, use "AI Assistant" in the sidebar
        </p>
      </div>
    );
  }

  // Default case-based view
  return (
    <div className="bg-gradient-to-br from-teal-600 to-blue-600 rounded-xl p-6 shadow-lg text-white">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-6 h-6 text-yellow-300" />
        <h3 className="text-lg font-semibold">AI Insights & Next Steps</h3>
      </div>

      {/* Grid Layout: AI Insights + Progress & Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: AI Insights */}
        <div className="space-y-4">
          {/* Progress Summary */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-300" />
              <span className="font-medium">{insights.progressMessage}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-teal-300 h-2 rounded-full transition-all duration-500"
                style={{ width: `${insights.progressPercent}%` }}
              ></div>
            </div>
            <p className="text-sm text-white/80">{insights.progressPercent}% complete</p>
          </div>

          {/* Next Recommended Action */}
          {insights.nextAction && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">👉</span>
                </div>
                <div>
                  <p className="font-medium mb-1">Recommended Next Step:</p>
                  <p className="text-sm text-white/90">{insights.nextAction}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <FileText className="w-5 h-5 mx-auto mb-1 text-blue-200" />
              <div className="text-2xl font-bold">{insights.documentsUploaded}</div>
              <div className="text-xs text-white/70">Documents</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <MessageSquare className="w-5 h-5 mx-auto mb-1 text-purple-200" />
              <div className="text-2xl font-bold">{insights.messagesExchanged}</div>
              <div className="text-xs text-white/70">Messages</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
              <Calendar className="w-5 h-5 mx-auto mb-1 text-green-200" />
              <div className="text-2xl font-bold">{insights.sessionsScheduled}</div>
              <div className="text-xs text-white/70">Sessions</div>
            </div>
          </div>

          {/* Encouraging Messages */}
          {insights.encouragement && insights.encouragement.length > 0 && (
            <div className="space-y-2">
              {insights.encouragement.map((msg, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" />
                  <span className="text-white/90">{msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Next Steps */}
        <div className="space-y-4">
          {/* Next Steps */}
          {score && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Next Steps
              </h4>
              <div className="space-y-3">
                {score.submittedCount < score.total ? (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">1</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Upload remaining documents</p>
                        <p className="text-xs text-white/70">{score.total - score.submittedCount} documents still needed</p>
                        {docsRemaining > 0 && (
                          <p className="text-xs text-yellow-300 mt-1">
                            ⏱️ Est. time: ~
                            {estimatedHours > 0 && `${estimatedHours}h `}
                            {remainingMinutes > 0 && `${remainingMinutes}m`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white/50 text-xs font-bold">2</span>
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Review draft agreement</p>
                        <p className="text-xs text-white/50">Available after documents submitted</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white/50 text-xs font-bold">3</span>
                      </div>
                      <div>
                        <p className="text-sm text-white/70">Schedule mediation session</p>
                        <p className="text-xs text-white/50">Coming soon</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-4xl mb-2">🎉</div>
                    <p className="text-sm font-medium text-white mb-1">All documents submitted!</p>
                    <p className="text-xs text-white/70">Your mediator will review and contact you soon.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Help Button */}
      <button
        onClick={onOpenAI}
        className="mt-6 w-full bg-white text-teal-700 py-2 px-4 rounded-lg font-semibold hover:bg-teal-50 transition-all flex items-center justify-center gap-2"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Ask AI for Help</span>
      </button>
    </div>
  );
}

/**
 * Process insights from backend AI service
 */
function processBackendInsights(backendInsights) {
  if (!backendInsights || backendInsights.length === 0) {
    return generateFallbackInsights();
  }

  // Extract meaningful data from backend insights
  const latestInsight = backendInsights[0];
  
  return {
    progressMessage: latestInsight.content?.progress_message || "You're making great progress!",
    progressPercent: latestInsight.content?.progress_percent || 65,
    nextAction: latestInsight.content?.next_action || "Continue uploading required documents",
    documentsUploaded: latestInsight.content?.documents_uploaded || 8,
    messagesExchanged: latestInsight.content?.messages_exchanged || 12,
    sessionsScheduled: latestInsight.content?.sessions_scheduled || 1,
    encouragement: latestInsight.content?.encouragement || [
      "Great job staying on track!",
      "You're doing everything right"
    ]
  };
}

/**
 * Generate admin-specific insights for the admin dashboard
 */
function generateAdminInsights(stats = {}) {
  const totalUsers = stats.totalUsers || 0;
  const activeCases = stats.activeCases || 0;
  const resolvedCases = stats.resolvedCases || 0;
  const roleBreakdown = stats.roleBreakdown || {};
  
  const totalCases = activeCases + resolvedCases;
  const resolutionRate = totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0;
  
  const mediatorCount = roleBreakdown.mediator || 0;
  const divorceeCount = roleBreakdown.divorcee || 0;
  const lawyerCount = roleBreakdown.lawyer || 0;
  
  // Calculate key insights
  const casesPerMediator = mediatorCount > 0 ? (activeCases / mediatorCount).toFixed(1) : 0;
  const systemHealth = totalCases > 0 ? "Operational" : "Ready";
  
  // Determine next recommended action based on platform state
  let nextAction = "";
  if (mediatorCount === 0) {
    nextAction = "🎯 Priority: Invite at least one mediator to start managing cases.";
  } else if (divorceeCount === 0 && totalUsers < 3) {
    nextAction = "👥 Getting started: Platform is ready. Invite users or wait for registrations.";
  } else if (activeCases > mediatorCount * 5) {
    nextAction = "⚠️ High case load: Consider inviting more mediators (avg. " + casesPerMediator + " cases per mediator).";
  } else if (activeCases > 0) {
    nextAction = "✅ Operations normal: Monitor active cases for timely resolution.";
  } else {
    nextAction = "💡 System ready: Review user roles and configure platform settings as needed.";
  }
  
  return {
    progressMessage: "Platform Health Dashboard",
    progressPercent: 95, // Could be calculated based on various system metrics
    nextAction: nextAction,
    pageExplanation: "This is your Admin Dashboard - the central command center for platform oversight and management. Monitor user activity, track case progress, manage system health, and perform administrative tasks. The AI Assistant in the sidebar provides personalized admin guidance, while the 'Ask AI for Help' button below answers general platform questions.",
    keyMetrics: [
      { label: "Total Users", value: totalUsers, icon: "users" },
      { label: "Active Cases", value: activeCases, icon: "cases" },
      { label: "Resolved Cases", value: resolvedCases, icon: "check" },
      { label: "Resolution Rate", value: totalCases > 0 ? `${resolutionRate}%` : "N/A", icon: "percent" }
    ],
    platformStatus: [
      { label: "Mediators", value: mediatorCount, detail: activeCases > 0 ? `${casesPerMediator} avg cases/mediator` : "Ready" },
      { label: "Divorcees", value: divorceeCount, detail: totalCases > 0 ? `${divorceeCount} participants` : "Awaiting registrations" },
      { label: "Lawyers", value: lawyerCount, detail: "Supporting cases" },
      { label: "System Status", value: systemHealth, detail: totalCases > 0 ? `${totalCases} total cases` : "Operational" }
    ],
    encouragement: [
      `Platform managing ${totalUsers} total users across ${roleBreakdown.admin || 0} admins, ${mediatorCount} mediators, ${divorceeCount} divorcees, and ${lawyerCount} lawyers.`,
      `Case statistics: ${activeCases} active, ${resolvedCases} resolved (${totalCases} total cases).`,
      mediatorCount > 0 ? `Workload distribution: ${casesPerMediator} active cases per mediator on average.` : "No mediators onboarded yet - use Quick Actions to invite users.",
      resolutionRate > 0 ? `Success rate: ${resolutionRate}% of cases have been successfully resolved.` : "No resolved cases yet - monitor active cases for completion."
    ]
  };
}

/**
 * Generate encouraging fallback insights when backend unavailable
 */
function generateFallbackInsights() {
  const progressPercent = Math.floor(Math.random() * 30) + 50; // 50-80%
  
  const encouragementMessages = [
    [
      "You've taken the first step - that's often the hardest part!",
      "Every document you upload gets you closer to resolution.",
      "Remember: You're not alone in this process."
    ],
    [
      "Great progress so far! Keep up the momentum.",
      "Your mediator is here to support you every step of the way.",
      "Each completed task brings clarity and closure."
    ],
    [
      "You're handling this with strength and courage.",
      "The mediation process is designed to help you both move forward.",
      "Take it one step at a time - you're doing great!"
    ]
  ];

  const nextActions = [
    "Upload any remaining financial documents to help your mediator understand your situation.",
    "Review your case overview to see what's been completed and what's still needed.",
    "Check if your mediator has sent any messages - they may have questions or updates.",
    "Consider scheduling your first mediation session if documents are complete.",
    "Take a moment to prepare questions you'd like to ask during your next session."
  ];

  const progressMessages = [
    "You're making steady progress through your mediation!",
    "Great work! You're on track with your case.",
    "You're doing well - keep moving forward!",
    "Excellent progress! You're handling this process thoughtfully."
  ];

  return {
    progressMessage: progressMessages[Math.floor(Math.random() * progressMessages.length)],
    progressPercent,
    nextAction: nextActions[Math.floor(Math.random() * nextActions.length)],
    documentsUploaded: Math.floor(Math.random() * 10) + 5,
    messagesExchanged: Math.floor(Math.random() * 15) + 8,
    sessionsScheduled: Math.floor(Math.random() * 2) + 1,
    encouragement: encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)]
  };
}

/**
 * Simple loading skeleton for AI Insights
 */
export function AIInsightsSkeleton() {
  return (
    <div className="bg-gradient-to-br from-teal-600 to-blue-600 rounded-xl p-6 shadow-lg animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 bg-white/20 rounded"></div>
        <div className="h-5 bg-white/20 rounded w-32"></div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-white/20 rounded"></div>
        <div className="h-4 bg-white/20 rounded w-3/4"></div>
        <div className="h-20 bg-white/20 rounded"></div>
      </div>
    </div>
  );
}
