import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../lib/apiClient';
import { useNotificationPanel } from '../context/NotificationContext';
import { 
  Home, 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Bell, 
  LogOut, 
  Shield, 
  MessageSquare, 
  Calendar, 
  UserPlus, 
  Plus,
  FolderOpen,
  Upload,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Video,
  MapPin,
  AlertCircle,
  Building2,
  Briefcase,
  Activity,
  Mail,
  Sliders
} from 'lucide-react';

export default function Sidebar({ user, onLogout, onOpenChat, onCreateCase, onShowPrivacy, onShowGuide, onShowFAQ, onShowHelp }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Make notification panel optional (may not exist in all contexts)
  let toggleNotificationPanel = () => {};
  try {
    const panel = useNotificationPanel();
    toggleNotificationPanel = panel?.toggleNotificationPanel || toggleNotificationPanel;
  } catch (e) {
    // NotificationProvider not available in this context
  }
  
  const [activeCaseId, setActiveCaseId] = useState(() => localStorage.getItem('activeCaseId'));

  // Validate case ID format and ensure it's not from a different session
  const hasValidCase = Boolean(activeCaseId && activeCaseId.length > 10 && user?.user_id); // Basic check for UUID-like format
  
  // State for expandable sections
  const [sessionsExpanded, setSessionsExpanded] = useState(false);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Fetch unread message count from conversations API
  const syncActiveCaseId = useCallback(() => {
    const storedId = localStorage.getItem('activeCaseId');
    setActiveCaseId((prev) => (prev !== storedId ? storedId : prev));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    // Sync immediately on mount
    syncActiveCaseId();

    const handleStorage = (event) => {
      if (event?.key && event.key !== 'activeCaseId') return;
      syncActiveCaseId();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('case:active-changed', syncActiveCaseId);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('case:active-changed', syncActiveCaseId);
    };
  }, [syncActiveCaseId]);

  useEffect(() => {
    if (!user?.user_id) return;
    if (!activeCaseId) {
      setUnreadCount(0);
      return;
    }

    async function fetchUnreadCount() {
      try {
        // Get all conversations for this case
        const data = await apiFetch(`/api/conversations/case/${activeCaseId}`);
        if (data.ok && data.conversations) {
          // Sum up all unread_count values from all conversations
          const totalUnread = data.conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
          setUnreadCount(totalUnread);
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
        if (error?.status === 403 && typeof window !== 'undefined') {
          console.warn('Active case is no longer accessible. Clearing cached case identifiers.');
          ['activeCaseId', 'selectedCaseId', 'currentCaseId'].forEach((key) => localStorage.removeItem(key));
          setActiveCaseId(null);
          window.dispatchEvent(new Event('case:active-changed'));
        }
        setUnreadCount(0); // Reset on error
      }
    }
    
    fetchUnreadCount();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user?.user_id, activeCaseId]);

  // Mock data - replace with real data from props/API
  const upcomingSessions = [
    { id: 1, date: '2025-10-28', time: '2:00 PM', type: 'online', title: 'Initial Consultation' },
    { id: 2, date: '2025-11-02', time: '10:00 AM', type: 'in-person', title: 'Document Review' },
  ];
  
  const recentActivities = [
    { id: 1, date: '2025-10-24', action: 'Uploaded financial statement' },
    { id: 2, date: '2025-10-23', action: 'Mediator reviewed documents' },
    { id: 3, date: '2025-10-22', action: 'Added new case note' },
  ];

  const handleLogoutClick = () => {
    onLogout();
  };

  const menuSections = [
    {
      title: 'Dashboards',
      items: [
        { label: 'Admin Dashboard', path: '/admin', roles: ['admin'], icon: Shield },
        { label: 'Mediator Dashboard', path: '/mediator', roles: ['mediator'], icon: Users },
        { label: 'Lawyer Dashboard', path: '/lawyer', roles: ['lawyer'], icon: FileText },
        { label: 'Divorcee Dashboard', path: '/divorcee', roles: ['divorcee'], icon: Users },
      ]
    },
    // Help section for divorcee users
    {
      title: 'Need Help?',
      items: [
        { label: 'Privacy Policy', action: 'showPrivacy', roles: ['divorcee'], icon: Shield },
        { label: 'What to Expect', action: 'showGuide', roles: ['divorcee'], icon: Info },
        { label: 'FAQ', action: 'showFAQ', roles: ['divorcee'], icon: HelpCircle },
      ]
    },
    // Only show Cases section if user has a valid case
    ...(hasValidCase ? [{
      title: 'My Case',
      items: [
        { label: 'Messages', path: '/divorcee/messages', roles: ['divorcee','lawyer'], icon: MessageSquare, badge: unreadCount },
        { label: 'My Documents', path: `/cases/${activeCaseId}/uploads`, roles: ['divorcee','lawyer'], icon: Upload },
      ]
    }] : []),
    {
      title: 'Case Tools',
      items: [
        { label: 'Create New Case', action: 'createCase', roles: ['mediator'], icon: Plus },
        { label: 'Cases List', path: '/mediator/cases', roles: ['mediator'], icon: FolderOpen },
        { label: 'Sessions', path: '/mediator/sessions', roles: ['mediator'], icon: Calendar },
        { label: 'Contacts', path: '/mediator/contacts', roles: ['mediator'], icon: Users },
        { label: 'All Documents', path: '/mediator/documents', roles: ['mediator'], icon: FileText },
        { label: 'Invite Participants', path: '/mediator/invite', roles: ['mediator'], icon: UserPlus },
        { label: 'AI Assistant', action: 'openChat', roles: ['divorcee','mediator','lawyer','admin'], icon: MessageSquare },
        { label: 'Reviews', path: '/mediator/review', roles: ['mediator'], icon: AlertCircle },
        { label: 'Schedule Session', path: '/mediator/schedule', roles: ['mediator'], icon: Calendar },
        { label: 'Draft Report', path: '/mediator/reports', roles: ['mediator'], icon: FileText },
        { label: 'Help', action: 'showHelp', roles: ['divorcee','mediator','lawyer','admin'], icon: HelpCircle },
      ]
    },
    {
      title: 'Admin Tools',
      items: [
        { label: 'Organizations', path: '/admin/organizations', roles: ['admin'], icon: Building2 },
        { label: 'Case Assignments', path: '/admin/case-assignments', roles: ['admin'], icon: Briefcase },
        { label: 'User Management', path: '/admin/users', roles: ['admin'], icon: Users },
        { label: 'Role Management', path: '/admin/roles', roles: ['admin'], icon: Shield },
        { label: 'System Health', path: '/admin/system-health', roles: ['admin'], icon: Activity },
        { label: 'Invite Users', path: '/admin/invites', roles: ['admin'], icon: Mail },
        { label: 'System Settings', path: '/admin/settings', roles: ['admin'], icon: Sliders },
      ]
    },
    {
      title: 'Account',
      items: [
        { label: 'Profile Settings', path: '/profile', roles: ['divorcee','mediator','lawyer','admin'], icon: Settings },
        { label: 'Notifications', action: 'showNotifications', roles: ['divorcee','mediator','lawyer','admin'], icon: Bell },
      ]
    },
  ];

  return (
    <div className="w-64 bg-slate-800 border-r border-slate-700/50 flex flex-col h-screen overflow-hidden">
      {/* Logo */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div>
            <div className="text-white font-semibold">MediationApp</div>
            <div className="text-xs text-slate-400 capitalize">{user?.role || 'User'}</div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto py-4 px-3">
        {menuSections.map((section, sectionIndex) => {
          // Filter items user has access to
          const visibleItems = section.items.filter(item => 
            item.isPublic || (user && item.roles.includes(user.role))
          );
          
          // Don't render section if no visible items
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title || `section-${sectionIndex}`} className="mb-3">
              {section.title && (
                <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        if (item.action === 'openChat' && onOpenChat) {
                          onOpenChat();
                        } else if (item.action === 'createCase' && onCreateCase) {
                          onCreateCase();
                        } else if (item.action === 'showPrivacy' && onShowPrivacy) {
                          onShowPrivacy();
                        } else if (item.action === 'showGuide' && onShowGuide) {
                          onShowGuide();
                        } else if (item.action === 'showFAQ' && onShowFAQ) {
                          onShowFAQ();
                        } else if (item.action === 'showHelp' && onShowHelp) {
                          onShowHelp();
                        } else if (item.action === 'showNotifications') {
                          toggleNotificationPanel();
                        } else if (item.path) {
                          navigate(item.path);
                        }
                      }}
                      className={`
                        w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all
                        flex items-center gap-3
                        ${item.primary 
                          ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white hover:from-teal-600 hover:to-blue-600 shadow-lg' 
                          : isActive 
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                            : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge > 0 && (
                        <span className="bg-teal-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Recent Activity - Expandable for divorcees */}
        {user?.role === 'divorcee' && (
          <div className="mb-3">
            <button
              onClick={() => setActivityExpanded(!activityExpanded)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all
                flex items-center justify-between text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                <span>Recent Activity</span>
              </div>
              <div className="flex items-center gap-2">
                {recentActivities.length > 0 && (
                  <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {recentActivities.length}
                  </span>
                )}
                {activityExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </button>
            
            {activityExpanded && (
              <div className="ml-7 mt-1 space-y-1">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="px-3 py-2 text-xs bg-slate-700/30 rounded-lg border border-slate-600/30">
                      <div className="text-slate-200 mb-1">{activity.action}</div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{activity.date}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-slate-500 italic">
                    No recent activity
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Info & Logout at Bottom */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="mb-3 px-3">
          <div className="text-sm font-medium text-slate-200 truncate">{user?.email}</div>
          <div className="text-xs text-slate-400 capitalize">Role: {user?.role || 'None'}</div>
        </div>
        <button
          onClick={handleLogoutClick}
          className="w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all
            flex items-center gap-3 text-red-300 hover:bg-red-900/20 hover:text-red-200 border border-red-900/30 hover:border-red-500/50"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
