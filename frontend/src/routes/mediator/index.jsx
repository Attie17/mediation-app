import React, { useState, useEffect } from 'react';
import DashboardFrame from '../../components/DashboardFrame';
import { Card, CardHeader, CardTitle, CardContent, CardDecoration } from '../../components/ui/card-enhanced';
import { EmptyState, NoCasesEmpty, NoUploadsEmpty, NoSessionsEmpty } from '../../components/ui/empty-state';
import { useAuth } from '../../context/AuthContext';
import { getDashboardHeader } from '../../utils/dashboardHelpers';
import { 
  Calendar, 
  FileText, 
  Users, 
  AlertCircle, 
  UserPlus, 
  RefreshCw, 
  Download,
  Clock,
  TrendingUp,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import ChatDrawer from '../../components/chat/ChatDrawer';

export default function MediatorDashboard() {
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const userName = user?.name || user?.email?.split('@')[0] || 'Mediator';

  const [stats, setStats] = useState({
    activeCases: 0,
    pendingReviews: 0,
    todaySessions: 0,
    resolvedThisMonth: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.user_id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:4000/dashboard/stats/mediator/${user.user_id}`);
        const data = await response.json();
        
        if (data.ok && data.stats) {
          setStats(data.stats);
          setError(null);
        } else {
          setError('Failed to load stats');
        }
      } catch (err) {
        console.error('Error fetching mediator stats:', err);
        setError('Unable to connect to server');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [user?.user_id]);

  const header = getDashboardHeader('mediator', userName, stats);

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
          icon={<FileText className="w-5 h-5 text-teal-400" />}
          label="Active Cases"
          value={loading ? '...' : stats.activeCases}
          color="teal"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-orange-400" />}
          label="Pending Reviews"
          value={loading ? '...' : stats.pendingReviews}
          color="orange"
          highlight={stats.pendingReviews > 0}
        />
        <StatCard
          icon={<Calendar className="w-5 h-5 text-blue-400" />}
          label="Today's Sessions"
          value={loading ? '...' : stats.todaySessions}
          color="blue"
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-lime-400" />}
          label="Resolved This Month"
          value={loading ? '...' : stats.resolvedThisMonth}
          color="lime"
        />
        </div>
      </div>

      {/* Today's Schedule */}
      <Card gradient hover className="mb-6">
        <CardDecoration color="blue" />
        <CardHeader icon={<Clock className="w-5 h-5 text-blue-400" />}>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.todaySessions === 0 ? (
            <NoSessionsEmpty />
          ) : (
            <div className="space-y-3">
              {/* TODO: Map through actual sessions */}
              <ScheduleItem time="10:00 AM" title="Smith v. Smith" type="Mediation Session" />
              <ScheduleItem time="2:00 PM" title="Jones case" type="Document Review" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Required + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Action Required */}
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
            {stats.pendingReviews === 0 ? (
              <EmptyState
                icon={<CheckCircle2 />}
                title="All caught up!"
                description="No pending actions right now. Great work!"
              />
            ) : (
              <div className="space-y-3">
                <ActionItem 
                  icon={<FileText className="w-4 h-4" />}
                  title="5 uploads awaiting review"
                  subtitle="From 3 different cases"
                  urgent
                />
                <ActionItem 
                  icon={<UserPlus className="w-4 h-4" />}
                  title="2 participant invites to send"
                  subtitle="Smith case & Jones case"
                />
                <ActionItem 
                  icon={<Download className="w-4 h-4" />}
                  title="1 report due"
                  subtitle="Johnson case - Due Friday"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analytics */}
        <Card gradient hover>
          <CardDecoration color="sage" />
          <CardHeader icon={<TrendingUp className="w-5 h-5 text-lime-400" />}>
            <CardTitle>Case Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AnalyticItem label="Active Cases" value={stats.activeCases} trend="+2 this week" />
              <AnalyticItem label="Resolved This Month" value={stats.resolvedThisMonth} trend="Avg. 45 days" />
              <AnalyticItem label="Success Rate" value="94%" trend="+3% vs last month" positive />
              <AnalyticItem label="Avg. Response Time" value="2.4 hrs" trend="-0.5 hrs improvement" positive />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Case Tools */}
      <div className="flex justify-center mb-6">
        <div className="w-full max-w-6xl">
      <Card gradient hover>
        <CardHeader icon={<Users className="w-5 h-5 text-teal-400" />}>
          <CardTitle>Case Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <ToolButton icon={<UserPlus />} label="Invite Participants" />
            <ToolButton icon={<RefreshCw />} label="Update Phase" />
            <ToolButton icon={<Download />} label="Draft Report" />
            <ToolButton 
              icon={<MessageSquare />} 
              label="Open Chat & AI"
              primary
              onClick={() => setChatOpen(true)}
            />
          </div>
        </CardContent>
      </Card>
        </div>
      </div>

      {/* Your Cases */}
      <Card gradient hover>
        <CardDecoration color="teal" />
        <CardHeader icon={<FileText className="w-5 h-5 text-teal-400" />}>
          <CardTitle>Your Cases</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.activeCases === 0 ? (
            <NoCasesEmpty />
          ) : (
            <div className="space-y-3">
              {/* TODO: Map through actual cases */}
              <CaseCard
                name="Smith v. Smith"
                status="In Progress"
                progress={65}
                lastActivity="2 hours ago"
              />
              <CaseCard
                name="Jones Family"
                status="Document Review"
                progress={40}
                lastActivity="Yesterday"
              />
            </div>
          )}
        </CardContent>
      </Card>

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

function ScheduleItem({ time, title, type }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50 hover:border-slate-500/50 transition-all">
      <div className="text-center min-w-[80px]">
        <div className="text-sm font-semibold text-slate-200">{time}</div>
      </div>
      <div className="h-8 w-px bg-slate-600/50" />
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-200">{title}</div>
        <div className="text-xs text-slate-400">{type}</div>
      </div>
    </div>
  );
}

function ActionItem({ icon, title, subtitle, urgent }) {
  return (
    <div className={`
      flex items-start gap-3 p-3 rounded-lg
      ${urgent ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-slate-700/30 border border-slate-600/50'}
      hover:border-slate-500/50 transition-all
    `}>
      <div className={`w-8 h-8 rounded-lg ${urgent ? 'bg-orange-500/20' : 'bg-slate-600/50'} flex items-center justify-center flex-shrink-0`}>
        {React.cloneElement(icon, { className: urgent ? 'text-orange-400' : 'text-slate-400' })}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-200">{title}</div>
        <div className="text-xs text-slate-400">{subtitle}</div>
      </div>
    </div>
  );
}

function AnalyticItem({ label, value, trend, positive }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="text-right">
        <div className="text-lg font-semibold text-slate-100">{value}</div>
        <div className={`text-xs ${positive ? 'text-lime-400' : 'text-slate-500'}`}>{trend}</div>
      </div>
    </div>
  );
}

function ToolButton({ icon, label, primary, onClick }) {
  if (primary) {
    return (
      <button
        onClick={onClick}
        className="
          px-4 py-3 rounded-lg
          bg-gradient-to-r from-teal-500 to-blue-500
          text-white text-sm font-semibold
          hover:shadow-lg hover:shadow-teal-500/25
          transition-all duration-200
          hover:scale-105
          flex items-center justify-center gap-2
          relative overflow-hidden
          group
        "
      >
        {React.cloneElement(icon, { className: "w-4 h-4 relative z-10" })}
        <span className="relative z-10">{label}</span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="
        px-4 py-3 rounded-lg
        bg-slate-700/30 hover:bg-slate-700/50
        border border-slate-600/50 hover:border-slate-500
        text-slate-200 text-sm font-medium
        transition-all duration-200
        hover:scale-105
        flex items-center justify-center gap-2
      "
    >
      {React.cloneElement(icon, { className: "w-4 h-4" })}
      {label}
    </button>
  );
}

function CaseCard({ name, status, progress, lastActivity }) {
  return (
    <div className="p-4 rounded-lg bg-slate-700/30 border border-slate-600/50 hover:border-slate-500/50 transition-all cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-sm font-semibold text-slate-200">{name}</div>
          <div className="text-xs text-slate-400 mt-1">{status}</div>
        </div>
        <span className="text-xs text-slate-500">{lastActivity}</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
