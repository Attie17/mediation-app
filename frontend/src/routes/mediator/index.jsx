import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardFrame from '../../components/DashboardFrame';
import { Card, CardHeader, CardTitle, CardContent, CardDecoration } from '../../components/ui/card-enhanced';
import { EmptyState, NoCasesEmpty, NoUploadsEmpty, NoSessionsEmpty } from '../../components/ui/empty-state';
import { useAuth } from '../../context/AuthContext';
import { useNotificationPanel } from '../../context/NotificationContext';
import { getDashboardHeader } from '../../utils/dashboardHelpers';
import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders } from '../../config/api';
import AIInsightsPanel from '../../components/ai/AIInsightsPanel';
import AIAssistantDrawer from '../../components/ai/AIAssistantDrawer';
import ProactiveAINudge from '../../components/ai/ProactiveAINudge';
import MediatorWelcomeGuide from '../../components/ai/MediatorWelcomeGuide';
import PrivacyModal from '../../components/modals/PrivacyModal';
import ProcessGuideModal from '../../components/modals/ProcessGuideModal';
import FAQModal from '../../components/modals/FAQModal';
import { useKeyboardShortcuts, KeyboardShortcutsHelper } from '../../hooks/useKeyboardShortcuts';
import DocumentsAggregateView from '../../components/mediator/DocumentsAggregateView';
import EnhancedAnalytics from '../../components/mediator/EnhancedAnalytics';
import NotificationCenter from '../../components/notifications/NotificationCenter';
import ThemeSwitcher from '../../components/ui/ThemeSwitcher';
import ShortcutsManager from '../../components/shortcuts/ShortcutsManager';
import { 
  Calendar, 
  FileText, 
  Users, 
  AlertCircle, 
  UserPlus, 
  RefreshCw, 
  Clock,
  TrendingUp,
  CheckCircle2,
  MessageSquare,
  MapPin,
  Plus,
  HelpCircle
} from 'lucide-react';
import CreateCaseModal from '../../components/CreateCaseModal';

export default function MediatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isNotificationPanelOpen, toggleNotificationPanel } = useNotificationPanel();
  const [createCaseModalOpen, setCreateCaseModalOpen] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showShortcutsManager, setShowShortcutsManager] = useState(false);
  const userName = user?.name || user?.email?.split('@')[0] || 'Mediator';

  const [stats, setStats] = useState({
    activeCases: 0,
    pendingReviews: 0,
    todaySessions: 0,
    resolvedThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [cases, setCases] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);

  // Show welcome modal only on fresh sign-in (not on every page navigation)
  useEffect(() => {
    if (user?.user_id) {
      const welcomeShownKey = `mediator-welcome-shown-${user.user_id}`;
      const hasShownWelcome = sessionStorage.getItem(welcomeShownKey);
      
      if (!hasShownWelcome) {
        // Show welcome after 800ms for a smooth entrance
        setTimeout(() => setShowWelcome(true), 800);
        // Mark as shown for this session
        sessionStorage.setItem(welcomeShownKey, 'true');
      }
    }
  }, [user?.user_id]);

  // Update browser tab title with pending reviews
  useEffect(() => {
    if (stats.pendingReviews > 0) {
      document.title = `(${stats.pendingReviews}) Pending Reviews | Mediator Dashboard`;
    } else if (stats.todaySessions > 0) {
      document.title = `${stats.todaySessions} Sessions Today | Mediator Dashboard`;
    } else {
      document.title = 'Mediator Dashboard | Mediation Platform';
    }
    
    // Cleanup: reset title when component unmounts
    return () => {
      document.title = 'Mediation Platform';
    };
  }, [stats.pendingReviews, stats.todaySessions]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'a': () => setAiAssistantOpen(true),
    '?': () => setShowShortcuts(true),
    'p': () => setShowPrivacy(true),
    'g': () => setShowGuide(true),
    'f': () => setShowFAQ(true),
    'c': () => setCreateCaseModalOpen(true),
    'r': () => navigate('/mediator/review'),
    's': () => setShowShortcutsManager(true), // New: Open shortcuts manager
    'Escape': () => {
      // Close any open modal
      setAiAssistantOpen(false);
      setShowPrivacy(false);
      setShowGuide(false);
      setShowFAQ(false);
      setShowShortcuts(false);
      setShowShortcutsManager(false);
      setCreateCaseModalOpen(false);
    }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.user_id) {
        setLoading(false);
        setSessionsLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setSessionsLoading(true);
        const headers = getAuthHeaders();
        
        // Fetch stats
        const statsResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.dashboard.stats('mediator', user.user_id)}`, {
          headers
        });
        const statsData = await statsResponse.json();
        
        if (statsData.ok && statsData.stats) {
          setStats(statsData.stats);
          setError(null);
        } else {
          setError(statsData.error || 'Failed to load stats');
        }

        // Fetch pending uploads for review
        try {
          const uploadsResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.uploads.list('pending')}`, {
            headers
          });
          const uploadsData = await uploadsResponse.json();
          if (uploadsData.uploads) {
            setPendingUploads(uploadsData.uploads.slice(0, 5)); // Show top 5
          }
        } catch (err) {
          console.error('Error fetching uploads:', err);
        }

        // Fetch cases assigned to mediator
        try {
          const casesResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.cases.list(user.user_id)}`, {
            headers
          });
          const casesData = await casesResponse.json();
          if (casesData.cases) {
            setCases(casesData.cases.slice(0, 5)); // Show top 5
          }
        } catch (err) {
          console.error('Error fetching cases:', err);
        }

        // Fetch upcoming sessions for schedule widget
        try {
          const sessionsResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.sessions.list(user.user_id)}`, {
            headers
          });

          if (sessionsResponse.ok) {
            const sessionsData = await sessionsResponse.json();
            const upcoming = sessionsData?.sessions?.upcoming || sessionsData?.sessions?.all || [];
            setUpcomingSessions(upcoming.slice(0, 5));
          } else {
            console.error('Failed to fetch sessions:', sessionsResponse.statusText);
            setUpcomingSessions([]);
          }
        } catch (err) {
          console.error('Error fetching sessions:', err);
          setUpcomingSessions([]);
        }
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Unable to connect to server');
      } finally {
        setLoading(false);
        setSessionsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user?.user_id]);

  const header = getDashboardHeader('mediator', userName, stats);

  const handleCaseCreated = (newCase) => {
    console.log('Case created:', newCase);
    // Refresh cases list
    setCases(prev => [newCase, ...prev]);
    // Navigate to the new case
    if (newCase.id) {
      navigate(`/case/${newCase.id}`);
    }
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <DashboardFrame title="">
      {/* Laptop Screen Width Container - Max 1400px */}
      <div className="max-w-[1400px] mx-auto">
      
      {/* Welcome Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 mb-2">
            {header.title}
          </h1>
          <p className="text-slate-400">
            {header.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationCenter 
            userId={user?.user_id} 
            userRole="mediator"
            isOpen={isNotificationPanelOpen}
            onToggle={toggleNotificationPanel}
          />
          <ThemeSwitcher variant="icon" />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Keyboard Shortcuts Hint */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setShowShortcuts(true)}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2 shadow-lg"
          title="View keyboard shortcuts"
        >
          <span>⌨️</span>
          <span className="hidden sm:inline">Press ? for shortcuts</span>
        </button>
      </div>

      {/* Stats Overview - 4 columns in a row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<FileText className="w-4 h-4 text-teal-400" />}
          label="Active Cases"
          value={loading ? '...' : stats.activeCases}
          color="teal"
          onClick={() => scrollToSection('your-cases')}
          compact
        />
        <StatCard
          icon={<AlertCircle className="w-4 h-4 text-orange-400" />}
          label="Pending Reviews"
          value={loading ? '...' : stats.pendingReviews}
          color="orange"
          highlight={stats.pendingReviews > 0}
          onClick={() => navigate('/mediator/review')}
          compact
        />
        <StatCard
          icon={<Calendar className="w-4 h-4 text-blue-400" />}
          label="Sessions Today"
          value={loading ? '...' : stats.todaySessions}
          color="blue"
          onClick={() => scrollToSection('todays-schedule')}
          compact
        />
        <StatCard
          icon={<CheckCircle2 className="w-4 h-4 text-lime-400" />}
          label="Resolved This Month"
          value={loading ? '...' : stats.resolvedThisMonth}
          color="lime"
          compact
        />
      </div>

      {/* AI Insights & Next Steps - Full Width */}
      <div className="mb-6">
        <AIInsightsPanel 
          caseId={cases[0]?.id || localStorage.getItem('activeCaseId')} 
          userId={user?.user_id}
          onOpenAI={() => setAiAssistantOpen(true)}
          userRole="mediator"
          caseContext={{
            activeCases: stats.activeCases,
            pendingReviews: stats.pendingReviews,
            todaySessions: stats.todaySessions,
            resolvedThisMonth: stats.resolvedThisMonth
          }}
        />
      </div>

      {/* Action Required - Full Width */}
      <div className="mb-6">
        <Card gradient hover>
          <CardDecoration color="coral" />
          <CardHeader icon={<AlertCircle className="w-5 h-5 text-orange-400" />}>
            <div className="flex items-center justify-between w-full">
              <CardTitle>Action Required</CardTitle>
              {stats.pendingReviews > 0 && (
                <span className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-semibold">
                    {stats.pendingReviews} items
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
            {pendingUploads.length === 0 ? (
              <EmptyState
                  icon={<CheckCircle2 />}
                  title="All caught up!"
                  description="No pending actions right now. Great work!"
                />
              ) : (
                <div className="space-y-3">
                  {pendingUploads.map((upload) => {
                    const caseIdentifier = upload.case_id || upload.case_uuid || upload.caseId || 'N/A';
                    const uploadedAtRaw = upload.created_at || upload.uploaded_at || upload.updated_at;
                    const uploadedAt = formatDisplayDate(uploadedAtRaw);

                    return (
                      <ActionItem 
                        key={upload.id || `${caseIdentifier}-${uploadedAtRaw}`}
                        icon={<FileText className="w-4 h-4" />}
                        title={`Review ${formatDocType(upload.doc_type)}`}
                        subtitle={`Case #${caseIdentifier} • Uploaded ${uploadedAt}`}
                        urgent
                      />
                    );
                  })}
                  {pendingUploads.length < stats.pendingReviews && (
                    <p className="text-sm text-slate-400 mt-2">
                      +{stats.pendingReviews - pendingUploads.length} more pending reviews
                    </p>
                  )}
                  <button
                    onClick={() => window.location.href = '/#/mediator/review'}
                    className="w-full mt-3 px-4 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/30 transition-colors text-sm font-medium"
                  >
                    Go to Review Page →
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      {/* Analytics - Full Width */}
      <Card gradient hover className="mb-6">
        <CardDecoration color="sage" />
        <CardHeader icon={<TrendingUp className="w-5 h-5 text-lime-400" />}>
          <CardTitle>Case Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedAnalytics stats={stats} userId={user?.user_id} />
        </CardContent>
      </Card>

      {/* Multi-Case Documents - Pending Across All Cases */}
      <Card gradient hover className="mb-6">
        <CardDecoration color="purple" />
        <CardHeader icon={<FileText className="w-5 h-5 text-purple-400" />}>
          <CardTitle>Pending Documents Across All Cases</CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentsAggregateView 
            userId={user?.user_id}
            onNavigate={(caseId) => navigate(`/case/${caseId}`)}
          />
        </CardContent>
      </Card>

      <Card gradient hover id="your-cases">
        <CardDecoration color="teal" />
        <CardHeader icon={<FileText className="w-5 h-5 text-teal-400" />}>
          <CardTitle>Your Cases</CardTitle>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <NoCasesEmpty />
          ) : (
            <div className="space-y-3">
              {cases.map((caseItem) => {
                const progress = getCaseProgress(caseItem);
                const caseName = caseItem.title || caseItem.description || `Case #${caseItem.id}`;
                const lastActivity = formatDisplayDate(caseItem.updated_at || caseItem.created_at);

                return (
                  <CaseCard
                    key={caseItem.id}
                    caseId={caseItem.id}
                    name={caseName}
                    status={caseItem.status || 'open'}
                    progress={progress}
                    lastActivity={lastActivity}
                    onClick={() => navigate(`/case/${caseItem.id}`)}
                  />
                );
              })}
              {cases.length < stats.activeCases && (
                <p className="text-sm text-slate-400 mt-2">
                  +{stats.activeCases - cases.length} more cases
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proactive AI Nudge - Detects when mediator seems stuck */}
      <ProactiveAINudge 
        onOpenAI={() => setAiAssistantOpen(true)}
        page="dashboard"
        userRole="mediator"
      />

      {/* Welcome Guide for Mediators */}
      {showWelcome && (
        <MediatorWelcomeGuide
          user={user}
          onClose={() => setShowWelcome(false)}
          onNavigate={(path) => navigate(path)}
          onOpenAI={() => {
            setShowWelcome(false);
            setAiAssistantOpen(true);
          }}
        />
      )}

      {/* Help Modals */}
      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <ProcessGuideModal 
        isOpen={showGuide} 
        onClose={() => setShowGuide(false)}
        userRole="mediator"
      />
      <FAQModal 
        isOpen={showFAQ} 
        onClose={() => setShowFAQ(false)}
        userRole="mediator"
      />
      
      {/* Keyboard Shortcuts Helper */}
      <KeyboardShortcutsHelper
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={{
          'a': 'Open AI Assistant',
          'c': 'Create new case',
          'r': 'Go to review page',
          's': 'Customize shortcuts',
          'p': 'Privacy policy',
          'g': 'Mediator guide',
          'f': 'FAQ',
          '?': 'Show this help',
          'Esc': 'Close modals'
        }}
      />

      {/* Shortcuts Manager */}
      <ShortcutsManager
        isOpen={showShortcutsManager}
        onClose={() => setShowShortcutsManager(false)}
        userRole="mediator"
      />

      {/* AI Assistant Drawer */}
      <AIAssistantDrawer 
        isOpen={aiAssistantOpen} 
        onClose={() => setAiAssistantOpen(false)}
        caseId={cases[0]?.id || localStorage.getItem('activeCaseId')}
        userId={user?.user_id}
        userRole="mediator"
        caseContext={{
          activeCases: stats.activeCases,
          pendingReviews: stats.pendingReviews,
          todaySessions: stats.todaySessions,
          resolvedThisMonth: stats.resolvedThisMonth
        }}
      />

      {/* Create Case Modal */}
      <CreateCaseModal 
        isOpen={createCaseModalOpen} 
        onClose={() => setCreateCaseModalOpen(false)}
        onCaseCreated={handleCaseCreated}
      />
      
      </div> {/* End Laptop Screen Container */}
    </DashboardFrame>
  );
}

// Helper Components
function StatCard({ icon, label, value, color, highlight, onClick, compact }) {
  const colorClasses = {
    teal: 'from-teal-500/20 to-teal-600/20 border-teal-500/30',
    orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
    blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
    lime: 'from-lime-500/20 to-lime-600/20 border-lime-500/30',
  };

  const Component = onClick ? 'button' : 'div';
  const clickableClass = onClick ? 'cursor-pointer active:scale-95' : '';
  const paddingClass = compact ? 'p-3' : 'p-4';
  const textSizeClass = compact ? 'text-xl' : 'text-2xl';
  const labelSizeClass = compact ? 'text-xs' : 'text-sm';

  return (
    <Component 
      onClick={onClick}
      className={`relative overflow-hidden rounded-lg border bg-gradient-to-br backdrop-blur-sm ${paddingClass} transition-all hover:scale-105 ${colorClasses[color]} ${highlight ? 'ring-2 ring-orange-400' : ''} ${clickableClass} w-full text-left`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`${labelSizeClass} text-white/70 mb-1`}>{label}</p>
          <p className={`${textSizeClass} font-bold text-white`}>{value}</p>
        </div>
        <div className="opacity-70">{icon}</div>
      </div>
    </Component>
  );
}

function SessionListItemCompact({ session }) {
  const hasDateTime = Boolean(session?.session_date && session?.session_time);
  const sessionDateTime = hasDateTime ? new Date(`${session.session_date}T${session.session_time}`) : null;
  const isValidDate = sessionDateTime && Number.isFinite(sessionDateTime.getTime());
  
  const timeLabel = isValidDate
    ? sessionDateTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : 'Time TBD';

  const duration = normalizeDuration(session.duration_minutes || session.duration);
  const status = session?.status ? session.status.replace(/_/g, ' ') : 'scheduled';

  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-white font-medium text-sm truncate">{session.title}</div>
        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
          <Clock className="w-3 h-3" />
          <span>{timeLabel}</span>
          <span>•</span>
          <span>{duration} min</span>
        </div>
      </div>
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-300 uppercase ml-2">
        {status}
      </span>
    </div>
  );
}

function SessionListItem({ session }) {
  const hasDateTime = Boolean(session?.session_date && session?.session_time);
  const sessionDateTime = hasDateTime ? new Date(`${session.session_date}T${session.session_time}`) : null;
  const isValidDate = sessionDateTime && Number.isFinite(sessionDateTime.getTime());
  const dateLabel = isValidDate
    ? sessionDateTime.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      })
    : 'Date TBD';

  const timeLabel = isValidDate
    ? sessionDateTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    : 'Time TBD';

  const duration = normalizeDuration(session.duration_minutes || session.duration);
  const location = session?.location?.trim?.() || 'TBD';
  const status = session?.status ? session.status.replace(/_/g, ' ') : 'scheduled';

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Clock className="w-4 h-4" />
          <span>{dateLabel}</span>
          <span>•</span>
          <span>{timeLabel}</span>
        </div>
        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/20 text-blue-300 uppercase tracking-wide">
          {status}
        </span>
      </div>
      <div className="text-white font-medium text-base">{session.title}</div>
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {duration} min
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          {location}
        </span>
        {session.participants?.length ? (
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {session.participants.length} participants
          </span>
        ) : null}
      </div>
    </div>
  );
}

function ActionItem({ icon, title, subtitle, urgent }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${urgent ? 'bg-orange-500/10 hover:bg-orange-500/20' : 'bg-white/5 hover:bg-white/10'}`}>
      <div className={`flex-shrink-0 ${urgent ? 'text-orange-400' : 'text-slate-400'}`}>{icon}</div>
      <div className="flex-1">
        <div className="font-medium text-white">{title}</div>
        <div className="text-sm text-slate-400">{subtitle}</div>
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

function ToolButton({ icon, label, primary, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${primary ? 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/30' : 'bg-white/5 hover:bg-white/10 text-white'}`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function CaseCard({ caseId, name, status, progress, lastActivity, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer text-left hover:scale-[1.02] hover:shadow-lg border border-white/5 hover:border-teal-500/50"
    >
      <h4 className="font-medium text-white text-base">{name}</h4>
    </button>
  );
}

function getCaseProgress(caseItem = {}) {
  const candidates = [
    caseItem.progress_percentage,
    caseItem.progress_percent,
    caseItem.progress,
    caseItem.progressPercent,
    caseItem.overall_progress,
    caseItem.overallProgress,
    caseItem.overall_pct,
    caseItem.overallPct
  ];

  for (const value of candidates) {
    if (value === undefined || value === null) continue;
    const numeric = Number.parseFloat(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return null;
}

function formatDisplayDate(value) {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Unknown';
  return date.toLocaleDateString();
}

function formatDocType(type) {
  if (!type) return 'document';
  return String(type).replace(/_/g, ' ');
}

function normalizeDuration(duration) {
  const numeric = Number.parseInt(duration, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) return 60;
  return numeric;
}
