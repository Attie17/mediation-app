import React, { useState, useEffect } from 'react';
import DashboardFrame from '../../components/DashboardFrame';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardDecoration } from '../../components/ui/card-enhanced';
import { EmptyState, NoCasesEmpty, NoUploadsEmpty } from '../../components/ui/empty-state';
import { ProgressBar } from '../../components/ui/progress-enhanced';
import { useAuth } from '../../context/AuthContext';
import { getDashboardHeader } from '../../utils/dashboardHelpers';
import { 
  FileText, 
  Users, 
  Calendar, 
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Shield,
  Download,
  Upload,
  Send
} from 'lucide-react';
import ChatDrawer from '../../components/chat/ChatDrawer';

export default function LawyerDashboard() {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const userName = user?.name || user?.email?.split('@')[0] || 'Counselor';

  const [stats, setStats] = useState({
    clientCases: 0,
    pendingDocuments: 0,
    upcomingSessions: 0,
    completedThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.user_id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:4000/dashboard/stats/lawyer/${user.user_id}`);
        const data = await response.json();
        
        if (data.ok && data.stats) {
          setStats(data.stats);
          setError(null);
        } else {
          setError('Failed to load stats');
        }
      } catch (err) {
        console.error('Error fetching lawyer stats:', err);
        setError('Unable to connect to server');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [user?.user_id]);

  const header = getDashboardHeader('lawyer', userName, stats);

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

      {/* Stats Overview */}
      <div className="flex justify-center mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl">
        <StatCard
          icon={<Users className="w-5 h-5 text-teal-400" />}
          label="Client Cases"
          value={loading ? '...' : stats.clientCases}
          color="teal"
        />
        <StatCard
          icon={<FileText className="w-5 h-5 text-orange-400" />}
          label="Pending Documents"
          value={loading ? '...' : stats.pendingDocuments}
          color="orange"
          highlight={stats.pendingDocuments > 0}
        />
        <StatCard
          icon={<Calendar className="w-5 h-5 text-blue-400" />}
          label="Upcoming Sessions"
          value={loading ? '...' : stats.upcomingSessions}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-lime-400" />}
          label="Completed This Month"
          value={loading ? '...' : stats.completedThisMonth}
          color="lime"
        />
        </div>
      </div>

      {/* Client Cases */}
      <Card gradient hover className="mb-6">
        <CardDecoration color="teal" />
        <CardHeader icon={<Users className="w-5 h-5 text-teal-400" />}>
          <CardTitle>Your Client Cases</CardTitle>
          <CardDescription>Track mediation progress for each client</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.clientCases === 0 ? (
            <NoCasesEmpty />
          ) : (
            <div className="space-y-4">
              {/* TODO: Map through actual client cases */}
              <ClientCaseCard
                clientName="Jane Smith"
                caseType="Divorce Mediation"
                status="Document Review"
                progress={55}
                nextStep="Review financial disclosure"
                mediator="John Doe"
              />
              <ClientCaseCard
                clientName="Michael Johnson"
                caseType="Property Settlement"
                status="Negotiation Phase"
                progress={75}
                nextStep="Final agreement review"
                mediator="Sarah Williams"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents & Communication */}
      <div className="flex justify-center mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-5xl">
        {/* Required Documents */}
        <Card gradient hover>
          <CardDecoration color="coral" />
          <CardHeader icon={<FileText className="w-5 h-5 text-orange-400" />}>
            <div className="flex items-center justify-between w-full">
              <CardTitle>Required Documents</CardTitle>
              {stats.pendingDocuments > 0 && (
                <span className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-semibold">
                  {stats.pendingDocuments} pending
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {stats.pendingDocuments === 0 ? (
              <NoUploadsEmpty />
            ) : (
              <div className="space-y-3">
                <DocumentItem
                  title="Financial Disclosure - Smith case"
                  deadline="Due in 3 days"
                  urgent
                />
                <DocumentItem
                  title="Property Valuation - Johnson case"
                  deadline="Due next week"
                />
                <DocumentItem
                  title="Client Authorization Form"
                  deadline="Due in 5 days"
                />
              </div>
            )}
            <button className="w-full mt-4 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 hover:border-slate-500 text-slate-200 text-sm font-medium transition-all flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          </CardContent>
        </Card>

        {/* Upcoming Sessions */}
        <Card gradient hover>
          <CardDecoration color="blue" />
          <CardHeader icon={<Calendar className="w-5 h-5 text-blue-400" />}>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingSessions === 0 ? (
              <EmptyState
                icon={<Calendar />}
                title="No sessions scheduled"
                description="Check back for upcoming mediation sessions"
              />
            ) : (
              <div className="space-y-3">
                <SessionItem
                  date="Tomorrow"
                  time="10:00 AM"
                  client="Jane Smith"
                  type="Settlement Discussion"
                  location="Virtual Meeting"
                />
                <SessionItem
                  date="Friday"
                  time="2:00 PM"
                  client="Michael Johnson"
                  type="Final Agreement Review"
                  location="Office A"
                />
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Timeline & Support */}
      <div className="flex justify-center mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-5xl">
        {/* Case Timeline */}
        <Card gradient hover>
          <CardDecoration color="sage" />
          <CardHeader icon={<Clock className="w-5 h-5 text-lime-400" />}>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <TimelineItem
                icon={<FileText className="w-4 h-4" />}
                title="Document uploaded"
                description="Financial disclosure for Smith case"
                time="2 hours ago"
              />
              <TimelineItem
                icon={<MessageSquare className="w-4 h-4" />}
                title="Message from mediator"
                description="Schedule change request"
                time="Yesterday"
              />
              <TimelineItem
                icon={<CheckCircle2 className="w-4 h-4" />}
                title="Agreement signed"
                description="Johnson property settlement"
                time="2 days ago"
              />
            </div>
          </CardContent>
        </Card>

        {/* Support & Resources */}
        <Card gradient hover>
          <CardDecoration color="teal" />
          <CardHeader icon={<Shield className="w-5 h-5 text-teal-400" />}>
            <CardTitle>Support & Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <ResourceButton
                icon={<MessageSquare />}
                label="Contact Mediator"
                description="Send a message to case mediator"
              />
              <ResourceButton
                icon={<Download />}
                label="Template Library"
                description="Access legal document templates"
              />
              <ResourceButton
                icon={<FileText />}
                label="Case Guidelines"
                description="Review mediation procedures"
              />
              <button
                onClick={() => setChatOpen(true)}
                className="
                  w-full px-4 py-3 rounded-lg
                  bg-gradient-to-r from-teal-500 to-blue-500
                  text-white text-sm font-semibold
                  hover:shadow-lg hover:shadow-teal-500/25
                  transition-all duration-200
                  hover:scale-105
                  flex items-center justify-center gap-2
                  relative overflow-hidden
                  group mt-4
                "
              >
                <MessageSquare className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Open Chat & AI Assistant</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
              </button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center">
        <div className="w-full max-w-6xl">
      <Card gradient hover>
        <CardHeader icon={<Send className="w-5 h-5 text-teal-400" />}>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <ActionButton icon={<Upload />} label="Upload Document" />
            <ActionButton icon={<Send />} label="Send Message" />
            <ActionButton icon={<Download />} label="Download Agreement" />
            <ActionButton icon={<Calendar />} label="Schedule Meeting" />
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

// Helper Components
function StatCard({ icon, label, value, color, highlight }) {
  const colorMap = {
    teal: "from-teal-500/20 to-teal-500/5",
    orange: "from-orange-500/20 to-orange-500/5",
    blue: "from-blue-500/20 to-blue-500/5",
    lime: "from-lime-500/20 to-lime-500/5"
  };

  return (
    <div className={`
      relative overflow-hidden rounded-lg p-4
      bg-gradient-to-br ${colorMap[color]}
      border ${highlight ? 'border-orange-500/50 animate-pulse' : 'border-white/10'}
      transition-all duration-300
      hover:scale-105 hover:shadow-lg
    `}>
      <div className="flex items-center justify-between mb-2">
        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
          {icon}
        </div>
        <div className="text-3xl font-bold text-slate-100">{value}</div>
      </div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
}

function ClientCaseCard({ clientName, caseType, status, progress, nextStep, mediator }) {
  return (
    <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/50 hover:border-slate-500/50 transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-base font-semibold text-slate-100">{clientName}</div>
          <div className="text-sm text-slate-400 mt-1">{caseType}</div>
        </div>
        <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
          {status}
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-3">
        <ProgressBar percentage={progress} />
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-600/50">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <AlertCircle className="w-3 h-3" />
          <span>Next: {nextStep}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Users className="w-3 h-3" />
          <span>Mediator: {mediator}</span>
        </div>
      </div>
    </div>
  );
}

function DocumentItem({ title, deadline, urgent }) {
  return (
    <div className={`
      flex items-start gap-3 p-3 rounded-lg
      ${urgent ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-slate-700/30 border border-slate-600/50'}
      hover:border-slate-500/50 transition-all
    `}>
      <div className={`w-8 h-8 rounded-lg ${urgent ? 'bg-orange-500/20' : 'bg-slate-600/50'} flex items-center justify-center flex-shrink-0`}>
        <FileText className={`w-4 h-4 ${urgent ? 'text-orange-400' : 'text-slate-400'}`} />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-200">{title}</div>
        <div className={`text-xs ${urgent ? 'text-orange-400' : 'text-slate-400'}`}>{deadline}</div>
      </div>
    </div>
  );
}

function SessionItem({ date, time, client, type, location }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50 hover:border-slate-500/50 transition-all">
      <div className="text-center min-w-[100px]">
        <div className="text-xs text-slate-400">{date}</div>
        <div className="text-sm font-semibold text-slate-200">{time}</div>
      </div>
      <div className="h-12 w-px bg-slate-600/50" />
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-200">{client}</div>
        <div className="text-xs text-slate-400">{type}</div>
        <div className="text-xs text-slate-500 mt-1">{location}</div>
      </div>
    </div>
  );
}

function TimelineItem({ icon, title, description, time }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-600/50 flex items-center justify-center flex-shrink-0">
        {React.cloneElement(icon, { className: 'text-slate-400' })}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-200">{title}</div>
        <div className="text-xs text-slate-400">{description}</div>
        <div className="text-xs text-slate-500 mt-1">{time}</div>
      </div>
    </div>
  );
}

function ResourceButton({ icon, label, description }) {
  return (
    <button className="
      w-full px-4 py-3 rounded-lg
      bg-slate-700/30 hover:bg-slate-700/50
      border border-slate-600/50 hover:border-slate-500
      text-left
      transition-all duration-200
      hover:scale-105
    ">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-600/50 flex items-center justify-center flex-shrink-0">
          {React.cloneElement(icon, { className: 'w-4 h-4 text-slate-400' })}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-200">{label}</div>
          <div className="text-xs text-slate-400">{description}</div>
        </div>
      </div>
    </button>
  );
}

function ActionButton({ icon, label }) {
  return (
    <button className="
      px-4 py-3 rounded-lg
      bg-slate-700/30 hover:bg-slate-700/50
      border border-slate-600/50 hover:border-slate-500
      text-slate-200 text-sm font-medium
      transition-all duration-200
      hover:scale-105
      flex items-center justify-center gap-2
    ">
      {React.cloneElement(icon, { className: "w-4 h-4" })}
      {label}
    </button>
  );
}
