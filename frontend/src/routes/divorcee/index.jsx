import React, { useState, useEffect } from 'react';
import DashboardFrame from '../../components/DashboardFrame';
import { Card, CardHeader, CardTitle, CardContent, CardDecoration } from '../../components/ui/card-enhanced';
import { ProgressBar } from '../../components/ui/progress-enhanced';
import { EmptyState } from '../../components/ui/empty-state';
import { Button } from '../../components/ui/button';
import ChatDrawer from '../../components/chat/ChatDrawer';
import { useAuth } from '../../context/AuthContext';
import { getDashboardHeader } from '../../utils/dashboardHelpers';
import DivorceeDocumentsPanel from '../../components/documents/DivorceeDocumentsPanel';
import { Calendar, FileText, MessageSquare, HelpCircle, Shield, Clock } from 'lucide-react';

export default function DivorceeDashboard() {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [score, setScore] = useState({ submittedCount: 0, total: 16 });
  const [stats, setStats] = useState({
    caseStatus: 'no_case',
    documentsUploaded: 0,
    documentsPending: 0,
    unreadMessages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.user_id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:4000/dashboard/stats/divorcee/${user.user_id}`);
        const data = await response.json();
        
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
  
  const caseId = Number(localStorage.getItem('activeCaseId')) || 4;
  const userId = user?.id || '11111111-1111-1111-1111-111111111111';
  const userName = user?.name || user?.email?.split('@')[0] || 'there';

  const header = getDashboardHeader('divorcee', userName, { activeCases: stats.caseStatus !== 'no_case' ? 1 : 0 });

  return (
    <DashboardFrame title="">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">
          {header.title}
        </h1>
        <p className="text-slate-400">
          {header.subtitle}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Top Row: Progress + Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Progress Card */}
        <Card gradient hover>
          <CardDecoration color="teal" />
          <CardHeader icon={<FileText className="w-5 h-5 text-teal-400" />}>
            <CardTitle>Your Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressBar
              current={score.submittedCount}
              total={score.total}
              showPercentage={true}
              showMilestones={true}
              description="Keep going! You're doing amazing work."
            />
          </CardContent>
        </Card>

        {/* Next Steps Card */}
        <Card gradient hover>
          <CardDecoration color="blue" />
          <CardHeader icon={<Clock className="w-5 h-5 text-blue-400" />}>
            <CardTitle>Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {score.submittedCount < score.total ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-teal-400 text-xs font-bold">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">Upload remaining documents</p>
                      <p className="text-xs text-slate-400">{score.total - score.submittedCount} documents still needed</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-slate-500 text-xs font-bold">2</span>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Review draft agreement</p>
                      <p className="text-xs text-slate-500">Available after documents submitted</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-slate-500 text-xs font-bold">3</span>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Schedule mediation session</p>
                      <p className="text-xs text-slate-500">Coming soon</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="text-sm font-medium text-slate-200 mb-1">All documents submitted!</p>
                  <p className="text-xs text-slate-400">Your mediator will review and contact you soon.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
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

      {/* Bottom Row: Session + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Upcoming Session */}
        <Card gradient hover>
          <CardDecoration color="coral" />
          <CardHeader icon={<Calendar className="w-5 h-5 text-orange-400" />}>
            <CardTitle>Upcoming Session</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<Calendar />}
              title="No sessions scheduled"
              description="Your mediator will schedule a session once all documents are reviewed."
            />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card gradient hover>
          <CardDecoration color="sage" />
          <CardHeader icon={<MessageSquare className="w-5 h-5 text-lime-400" />}>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<MessageSquare />}
              title="No recent activity"
              description="Case updates and messages will appear here."
              action={() => setChatOpen(true)}
              actionLabel="Open Chat"
            />
          </CardContent>
        </Card>
      </div>

      {/* Support Section */}
      <div className="flex justify-center mb-6">
        <div className="w-full max-w-6xl">
      <Card gradient hover>
        <CardHeader icon={<HelpCircle className="w-5 h-5 text-blue-400" />}>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button className="
              px-4 py-3 rounded-lg
              bg-slate-700/30 hover:bg-slate-700/50
              border border-slate-600/50 hover:border-slate-500
              text-slate-200 text-sm font-medium
              transition-all duration-200
              hover:scale-105
              flex items-center justify-center gap-2
            ">
              <Shield className="w-4 h-4" />
              Privacy Policy
            </button>
            <button className="
              px-4 py-3 rounded-lg
              bg-slate-700/30 hover:bg-slate-700/50
              border border-slate-600/50 hover:border-slate-500
              text-slate-200 text-sm font-medium
              transition-all duration-200
              hover:scale-105
              flex items-center justify-center gap-2
            ">
              <FileText className="w-4 h-4" />
              What to Expect
            </button>
            <button className="
              px-4 py-3 rounded-lg
              bg-slate-700/30 hover:bg-slate-700/50
              border border-slate-600/50 hover:border-slate-500
              text-slate-200 text-sm font-medium
              transition-all duration-200
              hover:scale-105
              flex items-center justify-center gap-2
            ">
              <HelpCircle className="w-4 h-4" />
              FAQ
            </button>
            <button 
              onClick={() => setChatOpen(true)}
              className="
                px-4 py-3 rounded-lg
                bg-gradient-to-r from-teal-500 to-blue-500
                text-white text-sm font-semibold
                transition-all duration-200
                hover:scale-105
                hover:shadow-lg hover:shadow-teal-500/25
                flex items-center justify-center gap-2
                relative overflow-hidden
                group
              "
            >
              <MessageSquare className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Chat with Mediator</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            </button>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>

      {/* Chat Drawer */}
      <ChatDrawer open={chatOpen} onOpenChange={setChatOpen} />
    </DashboardFrame>
  );
}
