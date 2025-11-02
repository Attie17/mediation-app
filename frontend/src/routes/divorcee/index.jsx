import React, { useState, useEffect } from 'react';
import DashboardFrame from '../../components/DashboardFrame';
import { Card, CardHeader, CardTitle, CardContent, CardDecoration } from '../../components/ui/card-enhanced';
import { ProgressBar } from '../../components/ui/progress-enhanced';
import { EmptyState } from '../../components/ui/empty-state';
import { Button } from '../../components/ui/button';
import AIAssistantDrawer from '../../components/ai/AIAssistantDrawer';
import { useAuth } from '../../context/AuthContext';
import { useNotificationPanel } from '../../context/NotificationContext';
import { getDashboardHeader } from '../../utils/dashboardHelpers';
import DivorceeDocumentsPanel from '../../components/documents/DivorceeDocumentsPanel';
import { Calendar, FileText, MessageSquare, HelpCircle, Shield, Clock } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';
import AIInsightsPanel from '../../components/ai/AIInsightsPanel';
import ProactiveAINudge from '../../components/ai/ProactiveAINudge';
import AIWelcomeGuide from '../../components/ai/AIWelcomeGuide';
import PrivacyModal from '../../components/modals/PrivacyModal';
import ProcessGuideModal from '../../components/modals/ProcessGuideModal';
import FAQModal from '../../components/modals/FAQModal';
import { useKeyboardShortcuts, KeyboardShortcutsHelper } from '../../hooks/useKeyboardShortcuts';
import NotificationCenter from '../../components/notifications/NotificationCenter';
import ThemeSwitcher from '../../components/ui/ThemeSwitcher';
import ShortcutsManager from '../../components/shortcuts/ShortcutsManager';

export default function DivorceeDashboard() {
  const { user } = useAuth();
  const { isNotificationPanelOpen, toggleNotificationPanel } = useNotificationPanel();
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showShortcutsManager, setShowShortcutsManager] = useState(false);
  const [score, setScore] = useState({ submittedCount: 0, total: 16 });
  const [stats, setStats] = useState({
    caseStatus: 'no_case',
    documentsUploaded: 0,
    documentsPending: 0,
    unreadMessages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Show welcome modal only on fresh sign-in (not on every page navigation)
  useEffect(() => {
    if (user?.user_id) {
      const welcomeShownKey = `divorcee-welcome-shown-${user.user_id}`;
      const hasShownWelcome = sessionStorage.getItem(welcomeShownKey);
      
      if (!hasShownWelcome) {
        // Show welcome after 800ms for a smooth entrance
        setTimeout(() => setShowWelcome(true), 800);
        // Mark as shown for this session
        sessionStorage.setItem(welcomeShownKey, 'true');
      }
    }
  }, [user?.user_id]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.user_id) return;
      
      try {
        setLoading(true);
        const data = await apiFetch(`/dashboard/stats/divorcee/${user.user_id}`);
        
        if (data.ok && data.stats) {
          setStats(data.stats);
          // Update score based on documents
          setScore({
            submittedCount: data.stats.documentsUploaded || 0,
            total: 16
          });
          setError(null);
        } else {
          setError('Failed to load stats');
        }
      } catch (err) {
        console.error('Error fetching divorcee stats:', err);
        setError('Unable to connect to server');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [user?.user_id]);

  // Update browser tab title with progress
  useEffect(() => {
    if (score.submittedCount > 0) {
      const percent = Math.round((score.submittedCount / score.total) * 100);
      document.title = `My Case (${percent}% Complete) | Mediation Platform`;
    } else {
      document.title = 'My Case | Mediation Platform';
    }
    
    // Cleanup: reset title when component unmounts
    return () => {
      document.title = 'Mediation Platform';
    };
  }, [score]);
  
  // Support both UUID and integer case IDs
  const caseId = localStorage.getItem('activeCaseId') || '4';
  const userId = user?.user_id || user?.id || '11111111-1111-1111-1111-111111111111';
  const userName = user?.name || user?.email?.split('@')[0] || 'there';

  // Calculate estimated time remaining
  const docsRemaining = score.total - score.submittedCount;
  const estimatedMinutes = docsRemaining * 3; // 3 minutes per document
  const estimatedHours = Math.floor(estimatedMinutes / 60);
  const remainingMinutes = estimatedMinutes % 60;

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'a': () => setAiAssistantOpen(true),
    '?': () => setShowShortcuts(true),
    'p': () => setShowPrivacy(true),
    'g': () => setShowGuide(true),
    'f': () => setShowFAQ(true),
    's': () => setShowShortcutsManager(true),
    'Escape': () => {
      // Close any open modal
      setAiAssistantOpen(false);
      setShowPrivacy(false);
      setShowGuide(false);
      setShowFAQ(false);
      setShowShortcuts(false);
      setShowShortcutsManager(false);
    }
  });

  const header = getDashboardHeader('divorcee', userName, { activeCases: stats.caseStatus !== 'no_case' ? 1 : 0 });

  return (
    <DashboardFrame title="">
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
            userRole="divorcee"
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

      {/* AI Insights & Next Steps - Full Width */}
      <div className="mb-6">
        <AIInsightsPanel 
          caseId={localStorage.getItem('activeCaseId')} 
          userId={user?.user_id}
          onOpenAI={() => setAiAssistantOpen(true)}
          score={score}
          docsRemaining={docsRemaining}
          estimatedHours={estimatedHours}
          remainingMinutes={remainingMinutes}
        />
      </div>

      {/* Documents Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-teal-400" />
          Required Documents
        </h2>
        <DivorceeDocumentsPanel 
          caseId={caseId} 
          userId={userId} 
          role={user?.role || 'divorcee'} 
          onMetricsChange={setScore} 
        />
      </div>

      {/* Proactive AI Nudge - Detects when user seems stuck */}
      <ProactiveAINudge 
        onOpenAI={() => setAiAssistantOpen(true)}
        page="dashboard"
        userRole="divorcee"
      />

      {/* Welcome Guide for First-Time Users */}
      {showWelcome && (
        <AIWelcomeGuide
          user={user}
          onClose={() => setShowWelcome(false)}
          onNavigate={(path) => window.location.href = path}
          onOpenAI={() => {
            setShowWelcome(false);
            setAiAssistantOpen(true);
          }}
        />
      )}

      {/* Help Modals */}
      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <ProcessGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
      <FAQModal isOpen={showFAQ} onClose={() => setShowFAQ(false)} />
      
      {/* Keyboard Shortcuts Helper */}
      <KeyboardShortcutsHelper
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        shortcuts={{
          'a': 'Open AI Assistant',
          's': 'Customize shortcuts',
          'p': 'Privacy policy',
          'g': 'What to expect guide',
          'f': 'FAQ',
          '?': 'Show this help',
          'Esc': 'Close modals'
        }}
      />

      {/* Shortcuts Manager */}
      <ShortcutsManager
        isOpen={showShortcutsManager}
        onClose={() => setShowShortcutsManager(false)}
        userRole="divorcee"
      />

      {/* AI Assistant Drawer */}
      <AIAssistantDrawer 
        isOpen={aiAssistantOpen} 
        onClose={() => setAiAssistantOpen(false)}
        caseId={localStorage.getItem('activeCaseId')}
        userId={user?.user_id}
        userRole="divorcee"
        caseContext={{
          status: stats.caseStatus,
          documentsUploaded: stats.documentsUploaded,
          documentsPending: stats.documentsPending
        }}
      />
    </DashboardFrame>
  );
}
