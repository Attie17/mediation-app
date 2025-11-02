import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardFrame from '../../components/DashboardFrame';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardDecoration } from '../../components/ui/card-enhanced';
import { EmptyState } from '../../components/ui/empty-state';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/apiClient';
import { getDashboardHeader } from '../../utils/dashboardHelpers';
import AIInsightsPanel from '../../components/ai/AIInsightsPanel';
import AIAssistantDrawer from '../../components/ai/AIAssistantDrawer';
import AdminWelcomeGuide from '../../components/ai/AdminWelcomeGuide';
import { StatCardSkeleton } from '../../components/ui/skeleton';
import { useStatsPolling } from '../../hooks/usePolling';
import { 
  Users, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  UserPlus,
  Shield,
  Activity,
  TrendingUp,
  Database,
  Clock,
  Settings,
  UserCog,
  Mail,
  Building2,
  Briefcase
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userName = user?.name || user?.email?.split('@')[0] || 'Admin';
  
  // State for AI assistant
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  
  // State for stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeCases: 0,
    resolvedCases: 0,
    totalCases: 0,
    pendingInvites: 0,
    roleBreakdown: {
      divorcee: 0,
      mediator: 0,
      lawyer: 0,
      admin: 0
    },
    avgCaseDuration: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);

  // Show welcome modal only on fresh sign-in (not on every page navigation)
  useEffect(() => {
    if (user?.user_id) {
      const welcomeShownKey = `admin-welcome-shown-${user.user_id}`;
      const hasShownWelcome = sessionStorage.getItem(welcomeShownKey);
      
      if (!hasShownWelcome) {
        // Show welcome after 800ms for a smooth entrance
        setTimeout(() => setShowWelcome(true), 800);
        // Mark as shown for this session
        sessionStorage.setItem(welcomeShownKey, 'true');
      }
    }
  }, [user?.user_id]);

  // Fetch admin stats from backend
  const fetchStats = async () => {
    try {
      setLoading(true);
      // Use new admin stats endpoint
      const data = await apiFetch('/api/admin/stats');
      
      if (data.ok && data.stats) {
        // Transform the stats to match component expectations
        const transformedStats = {
          totalUsers: data.stats.users?.total || 0,
          activeCases: data.stats.cases?.active || 0,
          resolvedCases: data.stats.cases?.completed || 0,
          totalCases: data.stats.cases?.total || 0,
          pendingInvites: 0, // Will need separate endpoint
          roleBreakdown: {
            divorcee: data.stats.users?.divorcee || 0,
            mediator: data.stats.users?.mediator || 0,
            lawyer: data.stats.users?.lawyer || 0,
            admin: data.stats.users?.admin || 0
          },
          avgCaseDuration: 0, // Calculate this if needed
          uploads: {
            pending: data.stats.uploads?.pending || 0,
            approved: data.stats.uploads?.approved || 0,
            rejected: data.stats.uploads?.rejected || 0,
            total: data.stats.uploads?.total || 0
          },
          sessions: {
            total: data.stats.sessions?.total || 0
          },
          organizations: {
            total: data.stats.organizations?.total || 0
          }
        };
        
        setStats(transformedStats);
        setError(null);
      } else {
        setError(data.error || 'Failed to load stats');
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivity = async () => {
    try {
      const data = await apiFetch('/api/admin/activity?limit=10');
      setRecentActivity(data.activities || []);
    } catch (err) {
      console.error('Error fetching recent activity:', err);
    }
  };

  // Set up polling for stats (every 60 seconds)
  useStatsPolling(fetchStats, 60000);

  // Fetch initial data
  useEffect(() => {
    fetchActivity();
  }, []);

  const header = getDashboardHeader('admin', userName, stats);

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

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
          <p className="text-sm">⚠️ {error}</p>
        </div>
      )}

      {/* System Stats */}
      <div className="flex justify-center mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={<Users className="w-5 h-5 text-teal-400" />}
              label="Total Users"
              value={stats.totalUsers}
              color="teal"
            />
            <StatCard
              icon={<FileText className="w-5 h-5 text-blue-400" />}
              label="Active Cases"
              value={stats.activeCases}
              color="blue"
            />
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5 text-lime-400" />}
              label="Resolved Cases"
              value={stats.resolvedCases}
              color="lime"
            />
            <StatCard
              icon={<Mail className="w-5 h-5 text-orange-400" />}
              label="Pending Invites"
              value={stats.pendingInvites}
              color="orange"
              highlight={stats.pendingInvites > 0}
            />
          </>
        )}
        </div>
      </div>

      {/* AI Insights & Next Steps */}
      <div className="mb-6">
        <AIInsightsPanel 
          caseId={localStorage.getItem('activeCaseId')} 
          userId={user?.user_id}
          userRole="admin"
          pageContext="admin-dashboard"
          pageDescription="Admin Dashboard - System oversight, user management, case monitoring, and platform configuration"
          stats={stats}
          onOpenAI={() => setAiAssistantOpen(true)}
        />
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center mb-6">
        <div className="w-full max-w-6xl">
      <Card gradient hover>
        <CardHeader icon={<Settings className="w-5 h-5 text-teal-400" />}>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <ActionButton
              icon={<Building2 />}
              label="Organizations"
              description="Manage practices"
              primary
              onClick={() => navigate('/admin/organizations')}
            />
            <ActionButton
              icon={<UserPlus />}
              label="Invite User"
              description="Send invitation email"
              onClick={() => navigate('/admin/invites')}
            />
            <ActionButton
              icon={<UserCog />}
              label="Manage Users"
              description="View & edit users"
              onClick={() => navigate('/admin/users')}
            />
            <ActionButton
              icon={<Briefcase />}
              label="Case Assignments"
              description="Assign mediators"
              onClick={() => navigate('/admin/case-assignments')}
            />
          </div>
        </CardContent>
      </Card>
        </div>
      </div>

      {/* User Management & System Health */}
      <div className="flex justify-center mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-5xl">
        {/* User Overview */}
        <Card gradient hover>
          <CardDecoration color="teal" />
          <CardHeader icon={<Users className="w-5 h-5 text-teal-400" />}>
            <CardTitle>User Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <UserRoleStats role="Divorcee" count={stats.roleBreakdown?.divorcee || 0} color="blue" />
              <UserRoleStats role="Mediator" count={stats.roleBreakdown?.mediator || 0} color="teal" />
              <UserRoleStats role="Lawyer" count={stats.roleBreakdown?.lawyer || 0} color="orange" />
              <UserRoleStats role="Admin" count={stats.roleBreakdown?.admin || 0} color="purple" />
            </div>
            <button 
              onClick={() => navigate('/admin/users')}
              className="
                w-full mt-4 px-4 py-2 rounded-lg
                bg-slate-700/50 hover:bg-slate-700
                border border-slate-600/50 hover:border-slate-500
                text-slate-200 text-sm font-medium
                transition-all
                flex items-center justify-center gap-2
              "
            >
              <Users className="w-4 h-4" />
              View All Users
            </button>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card gradient hover>
          <CardDecoration color="sage" />
          <CardHeader icon={<Activity className="w-5 h-5 text-lime-400" />}>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <HealthMetric
                label="API Response Time"
                value="245ms"
                status="good"
              />
              <HealthMetric
                label="Database Connections"
                value="12/100"
                status="good"
              />
              <HealthMetric
                label="Storage Usage"
                value="2.4 GB / 50 GB"
                status="good"
              />
              <HealthMetric
                label="Error Rate"
                value="0.02%"
                status="good"
              />
            </div>
            <button 
              onClick={() => navigate('/admin/system-health')}
              className="
                w-full mt-4 px-4 py-2 rounded-lg
                bg-slate-700/50 hover:bg-slate-700
                border border-slate-600/50 hover:border-slate-500
                text-slate-200 text-sm font-medium
                transition-all
                flex items-center justify-center gap-2
              "
            >
              <Database className="w-4 h-4" />
              View Details
            </button>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Case Statistics */}
      <div className="flex justify-center mb-6">
        <div className="w-full max-w-6xl">
      <Card gradient hover>
        <CardDecoration color="blue" />
        <CardHeader icon={<TrendingUp className="w-5 h-5 text-blue-400" />}>
          <CardTitle>Case Statistics</CardTitle>
          <CardDescription>Overview of mediation case metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              label="Total Cases"
              value={stats.totalCases || (stats.activeCases + stats.resolvedCases)}
              sublabel="All time"
            />
            <MetricCard
              label="Active Cases"
              value={stats.activeCases}
              sublabel="In progress"
              trend={`${stats.activeCases} ongoing`}
            />
            <MetricCard
              label="Resolved Cases"
              value={stats.resolvedCases}
              sublabel="Completed"
              trend={stats.totalCases > 0 ? `${Math.round((stats.resolvedCases / stats.totalCases) * 100)}% success rate` : 'No data'}
            />
            <MetricCard
              label="Avg. Duration"
              value={stats.avgCaseDuration > 0 ? `${stats.avgCaseDuration} days` : '--'}
              sublabel="Resolution time"
              trend={stats.avgCaseDuration > 0 ? `${stats.avgCaseDuration} day average` : 'No data'}
            />
          </div>
        </CardContent>
      </Card>
        </div>
      </div>

      {/* Recent Activity */}
      <Card gradient hover className="mb-6">
        <CardDecoration color="coral" />
        <CardHeader icon={<Clock className="w-5 h-5 text-orange-400" />}>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity.length === 0 ? (
            <EmptyState
              icon={<Activity />}
              title="No recent activity"
              description="System activity will appear here"
            />
          ) : (
            <div className="space-y-3">
              {recentActivity.map((activity) => {
                // Map action types to icons
                const iconMap = {
                  'user_role_changed': <UserPlus />,
                  'user_deleted': <UserPlus />,
                  'case_created': <FileText />,
                  'case_updated': <FileText />,
                  'case_resolved': <CheckCircle2 />
                };
                
                // Format timestamp
                const formatTime = (timestamp) => {
                  const date = new Date(timestamp);
                  const now = new Date();
                  const diffMs = now - date;
                  const diffMins = Math.floor(diffMs / 60000);
                  const diffHours = Math.floor(diffMs / 3600000);
                  const diffDays = Math.floor(diffMs / 86400000);
                  
                  if (diffMins < 60) return `${diffMins} minutes ago`;
                  if (diffHours < 24) return `${diffHours} hours ago`;
                  if (diffDays === 1) return 'Yesterday';
                  return `${diffDays} days ago`;
                };
                
                return (
                  <ActivityItem
                    key={activity.id}
                    icon={iconMap[activity.action_type] || <Activity />}
                    title={activity.description}
                    description={`by ${activity.user_name || activity.user_email}`}
                    time={formatTime(activity.created_at)}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Actions */}
      <Card gradient hover>
        <CardDecoration color="coral" />
        <CardHeader icon={<AlertCircle className="w-5 h-5 text-orange-400" />}>
          <div className="flex items-center justify-between w-full">
            <CardTitle>Pending Actions</CardTitle>
            {stats.pendingInvites > 0 && (
              <span className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 text-xs font-semibold">
                {stats.pendingInvites} items
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {stats.pendingInvites === 0 ? (
            <EmptyState
              icon={<CheckCircle2 />}
              title="All caught up!"
              description="No pending administrative actions"
            />
          ) : (
            <div className="space-y-3">
              <PendingItem
                icon={<Mail />}
                title="3 invitation emails pending"
                action="Review & Send"
              />
              <PendingItem
                icon={<Shield />}
                title="2 role change requests"
                action="Approve/Deny"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Welcome Guide for Admins */}
      {showWelcome && (
        <AdminWelcomeGuide
          user={user}
          onClose={() => setShowWelcome(false)}
          onNavigate={(path) => window.location.href = path}
        />
      )}

      {/* AI Assistant Drawer */}
      <AIAssistantDrawer 
        isOpen={aiAssistantOpen}
        onClose={() => setAiAssistantOpen(false)}
        caseId={localStorage.getItem('activeCaseId')}
        userId={user?.user_id}
        userRole="admin"
        caseContext={{ role: user?.role, context: 'admin-dashboard' }}
      />
    </DashboardFrame>
  );
}

// Helper Components
function StatCard({ icon, label, value, color, highlight, healthy }) {
  const colorMap = {
    teal: "from-teal-500/20 to-teal-500/5",
    orange: "from-orange-500/20 to-orange-500/5",
    blue: "from-blue-500/20 to-blue-500/5",
    lime: "from-lime-500/20 to-lime-500/5",
    purple: "from-purple-500/20 to-purple-500/5"
  };

  return (
    <div className={`
      relative overflow-hidden rounded-lg p-4
      bg-gradient-to-br ${colorMap[color]}
      border ${highlight ? 'border-orange-500/50 animate-pulse' : healthy ? 'border-lime-500/50' : 'border-white/10'}
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

function ActionButton({ icon, label, description, primary, onClick }) {
  if (primary) {
    return (
      <button 
        onClick={onClick}
        className="
          px-4 py-4 rounded-lg
          bg-gradient-to-r from-teal-500 to-blue-500
          text-white text-left
          hover:shadow-lg hover:shadow-teal-500/25
          transition-all duration-200
          hover:scale-105
          relative overflow-hidden
          group
        "
      >
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            {React.cloneElement(icon, { className: "w-5 h-5" })}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{label}</div>
            <div className="text-xs opacity-90">{description}</div>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      className="
        px-4 py-4 rounded-lg
        bg-slate-700/30 hover:bg-slate-700/50
        border border-slate-600/50 hover:border-slate-500
        text-slate-200 text-left
        transition-all duration-200
        hover:scale-105
      "
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-600/50 flex items-center justify-center flex-shrink-0">
          {React.cloneElement(icon, { className: "w-5 h-5 text-slate-400" })}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-slate-400">{description}</div>
        </div>
      </div>
    </button>
  );
}

function UserRoleStats({ role, count, color }) {
  const colorMap = {
    blue: "from-blue-500 to-blue-600",
    teal: "from-teal-500 to-teal-600",
    orange: "from-orange-500 to-orange-600",
    purple: "from-purple-500 to-purple-600"
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{role}</span>
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold text-slate-100">{count}</span>
        <div className="w-16 h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-gradient-to-r ${colorMap[color]} rounded-full transition-all duration-500`}
            style={{ width: count > 0 ? '100%' : '0%' }}
          />
        </div>
      </div>
    </div>
  );
}

function HealthMetric({ label, value, status }) {
  const statusColors = {
    good: "text-lime-400",
    warning: "text-orange-400",
    error: "text-red-400"
  };

  const statusIcons = {
    good: <CheckCircle2 className="w-4 h-4" />,
    warning: <AlertCircle className="w-4 h-4" />,
    error: <AlertCircle className="w-4 h-4" />
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-100">{value}</span>
        <span className={statusColors[status]}>
          {statusIcons[status]}
        </span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sublabel, trend }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-bold text-slate-100 mb-1">{value}</div>
      <div className="text-sm text-slate-400 mb-1">{label}</div>
      <div className="text-xs text-slate-500">{sublabel}</div>
      {trend && (
        <div className="text-xs text-slate-500 mt-1">{trend}</div>
      )}
    </div>
  );
}

function ActivityItem({ icon, title, description, time }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-600/50 hover:border-slate-500/50 transition-all">
      <div className="w-8 h-8 rounded-lg bg-slate-600/50 flex items-center justify-center flex-shrink-0">
        {React.cloneElement(icon, { className: 'w-4 h-4 text-slate-400' })}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-200">{title}</div>
        <div className="text-xs text-slate-400">{description}</div>
        <div className="text-xs text-slate-500 mt-1">{time}</div>
      </div>
    </div>
  );
}

function PendingItem({ icon, title, action }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 hover:border-orange-500/50 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
          {React.cloneElement(icon, { className: 'w-4 h-4 text-orange-400' })}
        </div>
        <div className="text-sm font-medium text-slate-200">{title}</div>
      </div>
      <button className="px-3 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 text-xs font-medium transition-all">
        {action}
      </button>
    </div>
  );
}
