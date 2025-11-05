import React from "react";
import { useNavigate, Outlet, useLocation, Navigate } from "react-router-dom";
import { LogIn, UserPlus, Home as HomeIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { NotificationProvider } from "../context/NotificationContext";
import TopNavigationBar from "../components/TopNavigationBar";
import Sidebar from "../components/Sidebar";
import HomeButton from "../components/HomeButton";
import { NavigationCard, QuickActionCard } from "../components/NavigationCards";
import ChatDrawer from "../components/chat/ChatDrawer";
import AIAssistantDrawer from "../components/ai/AIAssistantDrawer";
import CreateCaseModal from "../components/CreateCaseModal";
import PrivacyModal from "../components/modals/PrivacyModal";
import ProcessGuideModal from "../components/modals/ProcessGuideModal";
import FAQModal from "../components/modals/FAQModal";
import CommunicationMenu from "../components/communication/CommunicationMenu";

function HamburgerMenuOverlay({ open, onClose, user, navigate, onLogout }) {
  const caseId = localStorage.getItem('activeCaseId');
  const hasValidCase = caseId && caseId.length > 10; // Basic check for UUID-like format
  const location = useLocation();

  // ...existing code...
}

import { supabase } from '../lib/supabase';
import { useEffect, useState } from 'react';

function GuestSidebar({ onNavigate }) {
  const menuItems = [
    // Removed Home - not needed
    { label: 'Sign In', path: '/signin', icon: LogIn },
    { label: 'Register', path: '/register', icon: UserPlus },
  ];

  return (
    <div className="w-64 bg-slate-800 border-r border-slate-700/50 flex flex-col h-screen overflow-hidden">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <div>
            <div className="text-white font-semibold">MediationApp</div>
            <div className="text-xs text-slate-400">Guest access</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Quick Links
        </div>
        <div className="space-y-1">
          {menuItems.map(({ label, path, icon: Icon }) => (
            <button
              key={label}
              onClick={() => onNavigate(path)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-3 text-slate-300 hover:bg-slate-700/50 hover:text-white"
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-slate-700/50 text-xs text-slate-500">
        Sign in to access your personalised dashboards.
      </div>
    </div>
  );
}

function DashboardLandingPage({ user, navigate }) {
  // Redirect divorcees to their dedicated dashboard
  if (user?.role === 'divorcee') {
    return <Navigate to="/divorcee" replace />;
  }

  // Redirect mediators to their dedicated dashboard
  if (user?.role === 'mediator') {
    return <Navigate to="/mediator" replace />;
  }

  // Redirect admins to their dedicated dashboard
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Redirect lawyers to their dedicated dashboard
  if (user?.role === 'lawyer') {
    return <Navigate to="/lawyer" replace />;
  }

  const caseId = localStorage.getItem('activeCaseId') || '';
  const [counts, setCounts] = useState({ cases: null, documents: null, messages: null, contacts: null });
  const [loading, setLoading] = useState(true);

  // Get user's first name
  const getFirstName = () => {
    if (user?.email) {
      return user.email.split('@')[0].split('.')[0];
    }
    return "there";
  };

  // Fetch live counts from Supabase
  useEffect(() => {
    let isMounted = true;
    async function fetchCounts() {
      setLoading(true);
      try {
        // Cases: count all cases where user is participant
        let casesCount = null;
        if (user?.id) {
          const { count: cCount } = await supabase
            .from('case_participants')
            .select('case_id', { count: 'exact', head: true })
            .eq('user_id', user.id);
          casesCount = cCount ?? 0;
        }

        // Documents: count uploads for active case
        let documentsCount = null;
        if (caseId) {
          const { count: dCount } = await supabase
            .from('uploads')
            .select('id', { count: 'exact', head: true })
            .eq('case_id', caseId);
          documentsCount = dCount ?? 0;
        }

        // Messages: count unread messages for user in active case
        let messagesCount = null;
        if (user?.id && caseId) {
          const { count: mCount } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('case_id', caseId)
            .neq('sender_id', user.id)
            .eq('read', false);
          messagesCount = mCount ?? 0;
        }

        // Contacts: count participants in active case
        let contactsCount = null;
        if (caseId) {
          const { count: pCount } = await supabase
            .from('case_participants')
            .select('id', { count: 'exact', head: true })
            .eq('case_id', caseId);
          contactsCount = pCount ?? 0;
        }

        if (isMounted) {
          setCounts({
            cases: casesCount,
            documents: documentsCount,
            messages: messagesCount,
            contacts: contactsCount
          });
        }
      } catch (e) {
        if (isMounted) setCounts({ cases: null, documents: null, messages: null, contacts: null });
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchCounts();
    return () => { isMounted = false; };
  }, [user?.id, caseId]);

  // Quick action cards based on live data
  const getQuickActions = () => {
    // Role-specific paths for mediators
    if (user?.role === 'mediator') {
      return [
        {
          icon: '📋',
          label: 'My Cases',
          value: loading ? '...' : (counts.cases !== null ? `${counts.cases} active` : '—'),
          gradient: 'from-teal-400 to-blue-400',
          path: '/mediator/cases'
        },
        {
          icon: '📄',
          label: 'Documents',
          value: loading ? '...' : (counts.documents !== null ? `${counts.documents} pending` : '—'),
          gradient: 'from-orange-400 to-red-400',
          path: '/mediator/review'
        },
        {
          icon: '💬',
          label: 'Messages',
          value: loading ? '...' : (counts.messages !== null ? `${counts.messages} unread` : '—'),
          gradient: 'from-blue-400 to-purple-400',
          path: '/mediator' // Opens dashboard with chat
        },
        {
          icon: '👥',
          label: 'Contacts',
          value: loading ? '...' : 'View all',
          gradient: 'from-teal-400 to-cyan-400',
          path: '/mediator/contacts'
        }
      ];
    }
    
    // Default paths for divorcees, lawyers, etc.
    return [
      {
        icon: '📋',
        label: 'My Cases',
        value: loading ? '...' : (counts.cases !== null ? `${counts.cases} active` : '—'),
        gradient: 'from-teal-400 to-blue-400',
        path: caseId ? `/case/${caseId}` : '/dashboard'
      },
      {
        icon: '📄',
        label: 'Documents',
        value: loading ? '...' : (counts.documents !== null ? `${counts.documents} uploaded` : '—'),
        gradient: 'from-orange-400 to-red-400',
        path: caseId ? `/case/${caseId}` : '/dashboard'
      },
      {
        icon: '💬',
        label: 'Messages',
        value: loading ? '...' : (counts.messages !== null ? `${counts.messages} unread` : '—'),
        gradient: 'from-blue-400 to-purple-400',
        path: caseId ? `/case/${caseId}` : '/dashboard'
      },
      {
        icon: '👥',
        label: 'Contacts',
        value: loading ? '...' : (counts.contacts !== null ? `${counts.contacts} total` : '—'),
        gradient: 'from-teal-400 to-cyan-400',
        path: '/profile'
      }
    ];
  };

  // Replace emoji greeting with styled header and optional date
  const getGreetingHeader = () => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
    const date = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
    return `${greeting}, ${getFirstName()} (${date})`;
  };

  // Add AI summary component placeholder
  const AISummaryPlaceholder = () => (
    <div className="bg-slate-800 text-slate-300 p-4 rounded-md shadow-md mb-6">
      <p>
        {loading
          ? 'Loading live dashboard data...'
          : `All systems steady — ${counts.cases ?? '—'} active cases, ${counts.messages ?? '—'} new messages.`}
      </p>
    </div>
  );

  // Navigation sections
  const navigationSections = [
    {
      title: 'Dashboards',
      items: [
        { 
          icon: '🏠', 
          label: 'My Dashboard', 
          path: `/${user?.role}`, 
          roles: ['divorcee','mediator','lawyer','admin'],
          gradient: 'from-teal-500/20 to-blue-500/5'
        },
        { 
          icon: '👤', 
          label: 'Divorcee Dashboard', 
          path: '/divorcee', 
          roles: ['divorcee','admin'],
          gradient: 'from-blue-500/20 to-blue-500/5'
        },
        { 
          icon: '⚖️', 
          label: 'Mediator Dashboard', 
          path: '/mediator', 
          roles: ['mediator','admin'],
          gradient: 'from-teal-500/20 to-teal-500/5'
        },
        { 
          icon: '👔', 
          label: 'Lawyer Dashboard', 
          path: '/lawyer', 
          roles: ['lawyer','admin'],
          gradient: 'from-orange-500/20 to-orange-500/5'
        },
        { 
          icon: '👨‍💼', 
          label: 'Admin Dashboard', 
          path: '/admin', 
          roles: ['admin'],
          gradient: 'from-purple-500/20 to-purple-500/5'
        },
      ]
    },
    {
      title: 'Cases',
      items: [
        { 
          icon: '📋', 
          label: 'Case Overview', 
          path: `/case/${caseId}`, 
          roles: ['divorcee','mediator','lawyer','admin'],
          gradient: 'from-teal-500/20 to-blue-500/5'
        },
        { 
          icon: '📄', 
          label: 'Case Details', 
          path: `/cases/${caseId}`, 
          roles: ['divorcee','mediator','lawyer','admin'],
          gradient: 'from-blue-500/20 to-blue-500/5'
        },
        { 
          icon: '📎', 
          label: 'Case Uploads', 
          path: `/cases/${caseId}/uploads`, 
          roles: ['divorcee','mediator','lawyer','admin'],
          gradient: 'from-orange-500/20 to-orange-500/5'
        },
      ]
    },
    {
      title: 'Admin',
      items: [
        { 
          icon: '👥', 
          label: 'User Management', 
          path: '/admin/users', 
          roles: ['admin'],
          gradient: 'from-purple-500/20 to-purple-500/5'
        },
        { 
          icon: '🔐', 
          label: 'Role Management', 
          path: '/admin/roles', 
          roles: ['admin'],
          gradient: 'from-purple-500/20 to-purple-500/5'
        },
      ]
    },
    {
      title: 'Account',
      items: [
        { 
          icon: '⚙️', 
          label: 'Profile Setup', 
          path: '/profile', 
          roles: ['divorcee','mediator','lawyer','admin'],
          gradient: 'from-slate-600/20 to-slate-700/5'
        },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Welcome Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <h1 className="text-4xl font-bold text-white mb-2">
          {getGreetingHeader()}
        </h1>
        <p className="text-slate-400 text-lg">
          {user?.role === 'mediator' && "You have 5 active cases and 3 pending reviews"}
          {user?.role === 'divorcee' && "Your case is 65% complete. Keep up the great work!"}
          {user?.role === 'lawyer' && "You're representing 12 clients in mediation"}
          {user?.role === 'admin' && "System running smoothly. All services operational."}
          {!user?.role && "Welcome to your mediation dashboard"}
        </p>
      </div>

      {/* AI Summary Placeholder */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AISummaryPlaceholder />
      </div>

      {/* Centered wrapper for all action rows */}
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8">
        {/* Quick Actions */}
        <h2 className="mt-4 text-xl font-semibold text-white text-center">Quick Actions</h2>
        
        <div className="flex justify-center mt-2">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[4.8rem] w-full max-w-[920px]">
            {getQuickActions().map((action, idx) => (
              <a 
                key={idx}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(action.path);
                }}
                className="group relative h-full w-full overflow-hidden rounded-xl ring-1 ring-white/10 shadow-sm hover:shadow-lg transition-all focus:outline-none cursor-pointer"
              >
                <span className={`absolute inset-0 bg-gradient-to-br ${action.gradient}`} />
                <span className="relative z-10 grid place-items-center h-full w-full px-3">
                  <span className="flex items-center justify-center gap-3 min-w-0 text-white">
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-white/20 grid place-items-center shrink-0">
                      <span className="text-lg">{action.icon}</span>
                    </span>
                    <span className="leading-tight min-w-0 text-left">
                      <span className="block text-[13px] sm:text-sm font-semibold truncate">{action.label}</span>
                      <span className="block text-[11px] sm:text-xs/4 text-white/90 truncate">{action.value}</span>
                    </span>
                  </span>
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Dashboards */}
        <h2 className="mt-6 text-xl font-semibold text-white text-center">Dashboards</h2>

        {/* 3 cards per row on desktop - centered */}
        <div className="flex justify-center mt-3">
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-[4.8rem] w-full max-w-[920px]">

          {/* My Dashboard */}
          <a
            onClick={() => user && navigate(`/${user.role}`)}
            className="group relative h-full w-full overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none cursor-pointer"
          >
            <span className="absolute inset-0 bg-gradient-to-br from-white/12 to-white/6" />
            <span className="relative z-10 grid place-items-center h-full w-full px-4 text-white">
              <span className="flex items-center justify-center gap-3 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-white/10 grid place-items-center shrink-0">
                  <span className="text-lg">🏠</span>
                </span>
                <span className="leading-tight min-w-0 text-left">
                  <span className="block text-[13px] sm:text-sm font-semibold truncate">My Dashboard</span>
                  <span className="block text-[11px] sm:text-xs text-white/80 truncate">Access</span>
                </span>
              </span>
            </span>
          </a>

          {/* Divorcee Dashboard */}
          {user?.role === 'divorcee' || user?.role === 'admin' ? (
            <a
              onClick={() => navigate('/divorcee')}
              className="group relative h-full w-full overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none cursor-pointer"
            >
              <span className="absolute inset-0 bg-gradient-to-br from-white/12 to-white/6" />
              <span className="relative z-10 grid place-items-center h-full w-full px-4 text-white">
                <span className="flex items-center justify-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-white/10 grid place-items-center shrink-0">
                    <span className="text-lg">👤</span>
                  </span>
                  <span className="leading-tight min-w-0 text-left">
                    <span className="block text-[13px] sm:text-sm font-semibold truncate">Divorcee Dashboard</span>
                    <span className="block text-[11px] sm:text-xs text-white/80 truncate">Access</span>
                  </span>
                </span>
              </span>
            </a>
          ) : (
            <div
              aria-disabled="true"
              className="relative h-full w-full overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-sm cursor-not-allowed select-none"
            >
              <span className="absolute inset-0 bg-gradient-to-br from-white/12 to-white/6" />
              <span className="absolute inset-0 bg-black/20" />
              <span className="absolute top-2 right-2 z-20">
                <span className="inline-grid place-items-center rounded-full bg-red-500/90 w-6 h-6">
                  <span aria-hidden className="text-white text-sm">🚫</span>
                </span>
              </span>
              <span className="relative z-10 grid place-items-center h-full w-full px-4 text-white">
                <span className="flex items-center justify-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-white/10 grid place-items-center shrink-0">
                    <span className="text-lg">👤</span>
                  </span>
                  <span className="leading-tight min-w-0 text-left">
                    <span className="block text-[13px] sm:text-sm font-semibold">Divorcee Dashboard</span>
                    <span className="block text-[11px] sm:text-xs text-white/80">Locked</span>
                  </span>
                </span>
              </span>
            </div>
          )}

          {/* Mediator Dashboard */}
          {user?.role === 'mediator' || user?.role === 'admin' ? (
            <a
              onClick={() => navigate('/mediator')}
              className="group relative h-full w-full overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none cursor-pointer"
            >
              <span className="absolute inset-0 bg-gradient-to-br from-white/12 to-white/6" />
              <span className="relative z-10 grid place-items-center h-full w-full px-4 text-white">
                <span className="flex items-center justify-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-white/10 grid place-items-center shrink-0">
                    <span className="text-lg">⚖️</span>
                  </span>
                  <span className="leading-tight min-w-0 text-left">
                    <span className="block text-[13px] sm:text-sm font-semibold truncate">Mediator Dashboard</span>
                    <span className="block text-[11px] sm:text-xs text-white/80 truncate">Access</span>
                  </span>
                </span>
              </span>
            </a>
          ) : (
            <div
              aria-disabled="true"
              className="relative h-full w-full overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-sm cursor-not-allowed select-none"
            >
              <span className="absolute inset-0 bg-gradient-to-br from-white/12 to-white/6" />
              <span className="absolute inset-0 bg-black/20" />
              <span className="absolute top-2 right-2 z-20">
                <span className="inline-grid place-items-center rounded-full bg-red-500/90 w-6 h-6">
                  <span aria-hidden className="text-white text-sm">🚫</span>
                </span>
              </span>
              <span className="relative z-10 grid place-items-center h-full w-full px-4 text-white">
                <span className="flex items-center justify-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-white/10 grid place-items-center shrink-0">
                    <span className="text-lg">⚖️</span>
                  </span>
                  <span className="leading-tight min-w-0 text-left">
                    <span className="block text-[13px] sm:text-sm font-semibold">Mediator Dashboard</span>
                    <span className="block text-[11px] sm:text-xs text-white/80">Locked</span>
                  </span>
                </span>
              </span>
            </div>
          )}

          {/* Lawyer Dashboard */}
          {user?.role === 'lawyer' || user?.role === 'admin' ? (
            <a
              onClick={() => navigate('/lawyer')}
              className="group relative h-full w-full overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none cursor-pointer"
            >
              <span className="absolute inset-0 bg-gradient-to-br from-white/12 to-white/6" />
              <span className="relative z-10 grid place-items-center h-full w-full px-4 text-white">
                <span className="flex items-center justify-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-white/10 grid place-items-center shrink-0">
                    <span className="text-lg">👔</span>
                  </span>
                  <span className="leading-tight min-w-0 text-left">
                    <span className="block text-[13px] sm:text-sm font-semibold truncate">Lawyer Dashboard</span>
                    <span className="block text-[11px] sm:text-xs text-white/80 truncate">Access</span>
                  </span>
                </span>
              </span>
            </a>
          ) : (
            <div
              aria-disabled="true"
              className="relative h-full w-full overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-sm cursor-not-allowed select-none"
            >
              <span className="absolute inset-0 bg-gradient-to-br from-white/12 to-white/6" />
              <span className="absolute inset-0 bg-black/20" />
              <span className="absolute top-2 right-2 z-20">
                <span className="inline-grid place-items-center rounded-full bg-red-500/90 w-6 h-6">
                  <span aria-hidden className="text-white text-sm">🚫</span>
                </span>
              </span>
              <span className="relative z-10 grid place-items-center h-full w-full px-4 text-white">
                <span className="flex items-center justify-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-white/10 grid place-items-center shrink-0">
                    <span className="text-lg">👔</span>
                  </span>
                  <span className="leading-tight min-w-0 text-left">
                    <span className="block text-[13px] sm:text-sm font-semibold">Lawyer Dashboard</span>
                    <span className="block text-[11px] sm:text-xs text-white/80">Locked</span>
                  </span>
                </span>
              </span>
            </div>
          )}

          {/* Admin Dashboard */}
          {user?.role === 'admin' ? (
            <a
              onClick={() => navigate('/admin')}
              className="group relative h-full w-full overflow-hidden rounded-2xl ring-1 ring-white/10 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none cursor-pointer"
            >
              <span className="absolute inset-0 bg-gradient-to-br from-white/12 to-white/6" />
              <span className="relative z-10 grid place-items-center h-full w-full px-4 text-white">
                <span className="flex items-center justify-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-white/10 grid place-items-center shrink-0">
                    <span className="text-lg">👨‍💼</span>
                  </span>
                  <span className="leading-tight min-w-0 text-left">
                    <span className="block text-[13px] sm:text-sm font-semibold truncate">Admin Dashboard</span>
                    <span className="block text-[11px] sm:text-xs text-white/80 truncate">Access</span>
                  </span>
                </span>
              </span>
            </a>
          ) : (
            <div
              aria-disabled="true"
              className="relative h-full w-full overflow-hidden rounded-2xl ring-1 ring-white/15 shadow-sm cursor-not-allowed select-none"
            >
              <span className="absolute inset-0 bg-gradient-to-br from-white/12 to-white/6" />
              <span className="absolute inset-0 bg-black/20" />
              <span className="absolute top-2 right-2 z-20">
                <span className="inline-grid place-items-center rounded-full bg-red-500/90 w-6 h-6">
                  <span aria-hidden className="text-white text-sm">🚫</span>
                </span>
              </span>
              <span className="relative z-10 grid place-items-center h-full w-full px-4 text-white">
                <span className="flex items-center justify-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-white/10 grid place-items-center shrink-0">
                    <span className="text-lg">👨‍💼</span>
                  </span>
                  <span className="leading-tight min-w-0 text-left">
                    <span className="block text-[13px] sm:text-sm font-semibold">Admin Dashboard</span>
                    <span className="block text-[11px] sm:text-xs text-white/80">Locked</span>
                  </span>
                </span>
              </span>
            </div>
          )}

          </div>
        </div>
      </div>
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = React.useState(false);
  const [createCaseModalOpen, setCreateCaseModalOpen] = React.useState(false);
  const [showPrivacy, setShowPrivacy] = React.useState(false);
  const [showGuide, setShowGuide] = React.useState(false);
  const [showFAQ, setShowFAQ] = React.useState(false);
  const [communicationMenuOpen, setCommunicationMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const handleOpenChat = () => {
    // All roles get the communication menu now
    setCommunicationMenuOpen(true);
  };

  const handleCommunicationOptionSelected = (option, userId = null) => {
    setCommunicationMenuOpen(false);
    
    switch(option) {
      case 'ai':
        setAiAssistantOpen(true);
        break;
      case 'mediator':
        // Navigate to appropriate messages page based on role
        if (user?.role === 'divorcee') {
          navigate('/divorcee/messages?filter=mediator');
        } else if (user?.role === 'lawyer') {
          navigate('/lawyer/messages?filter=mediator');
        } else if (user?.role === 'mediator') {
          navigate('/mediator/messages?filter=mediator');
        } else {
          navigate('/messages?filter=mediator');
        }
        break;
      case 'divorcee':
      case 'other-divorcee':
        if (user?.role === 'divorcee') {
          navigate('/divorcee/messages?filter=divorcee');
        } else if (user?.role === 'mediator') {
          navigate('/mediator/messages?filter=divorcee');
        } else if (user?.role === 'lawyer') {
          navigate('/lawyer/messages?filter=divorcee');
        } else {
          navigate('/messages?filter=divorcee');
        }
        break;
      case 'lawyer':
        if (user?.role === 'mediator') {
          navigate('/mediator/messages?filter=lawyer');
        } else if (user?.role === 'admin') {
          navigate('/admin/messages?filter=lawyer');
        } else {
          navigate('/messages?filter=lawyer');
        }
        break;
      case 'group':
      case 'group-of-3':
        if (user?.role === 'divorcee') {
          navigate('/divorcee/messages?filter=group');
        } else if (user?.role === 'mediator') {
          navigate('/mediator/messages?filter=group');
        } else {
          navigate('/messages?filter=group');
        }
        break;
      case 'admin':
        // Everyone can contact admin
        const basePath = user?.role ? `/${user.role}/messages` : '/messages';
        navigate(`${basePath}?filter=admin`);
        break;
      case 'user':
        // Admin selected specific user
        if (userId) {
          navigate(`/admin/messages?userId=${userId}`);
        }
        break;
      case 'broadcast':
        // Admin broadcast feature
        navigate('/admin/broadcast');
        break;
      default:
        console.warn('Unknown communication option:', option);
    }
  };

  const handleCreateCase = () => {
    setCreateCaseModalOpen(true);
  };

  const handleShowPrivacy = () => {
    setShowPrivacy(true);
  };

  const handleShowGuide = () => {
    setShowGuide(true);
  };

  const handleShowFAQ = () => {
    setShowFAQ(true);
  };

  const handleCaseCreated = (newCase) => {
    setCreateCaseModalOpen(false);
    // Navigate to the new case
    if (newCase?.id) {
      navigate(`/case/${newCase.id}`);
    }
  };

  // Debug: Log when menu state changes
  React.useEffect(() => {
    console.log('🍔 Menu state changed:', menuOpen);
  }, [menuOpen]);

  // Check if we're on the root or should show the landing page
  // Show landing page only on root '/'
  const showLandingPage = location.pathname === '/';
  const isSignInRoute = location.pathname === '/signin';
  const shouldShowLandingPage = user && showLandingPage;

  // Public landing page for non-logged-in visitors
  const PublicLandingPage = () => (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white">
            Welcome to Mediation App
          </h1>
          <p className="text-xl md:text-2xl text-slate-300">
            Streamline your mediation process with our comprehensive platform
          </p>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Connect with mediators, lawyers, and manage your divorce mediation cases efficiently. 
            Secure document sharing, real-time communication, and AI-powered insights.
          </p>
        </div>

        {/* Action Buttons */}
  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8" style={{ pointerEvents: 'none' }}>
          <button
            onClick={() => navigate('/signin')}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-lg font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto"
            style={{ pointerEvents: 'auto' }}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-4 bg-slate-700 text-white text-lg font-semibold rounded-lg hover:bg-slate-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto border border-slate-600"
            style={{ pointerEvents: 'auto' }}
          >
            Register
          </button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16">
          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <div className="text-4xl mb-3">⚖️</div>
            <h3 className="text-lg font-semibold text-white mb-2">Professional Mediation</h3>
            <p className="text-slate-400">Connect with certified mediators and legal professionals</p>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <div className="text-4xl mb-3">📁</div>
            <h3 className="text-lg font-semibold text-white mb-2">Secure Documents</h3>
            <p className="text-slate-400">Share and manage case documents safely and efficiently</p>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="text-lg font-semibold text-white mb-2">AI Insights</h3>
            <p className="text-slate-400">Get intelligent case analysis and recommendations</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Authenticated users (and the sign-in route) share the app frame
  if (user || isSignInRoute) {
    const sidebar = user
      ? <Sidebar 
          user={user} 
          onLogout={handleLogout} 
          onOpenChat={handleOpenChat} 
          onCreateCase={handleCreateCase}
          onShowPrivacy={handleShowPrivacy}
          onShowGuide={handleShowGuide}
          onShowFAQ={handleShowFAQ}
          onShowHelp={handleShowFAQ}
        />
      : <GuestSidebar onNavigate={navigate} />;

    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Sidebar */}
        {sidebar}
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar (simplified, no hamburger) */}
          <div className="bg-slate-800/50 border-b border-slate-700/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-white">
                {location.pathname === '/' ? 'Home' : location.pathname.split('/')[1].charAt(0).toUpperCase() + location.pathname.split('/')[1].slice(1)}
              </h1>
              <div className="flex items-center gap-3">
                {user && location.pathname !== '/' && <HomeButton />}
                <div className="px-3 py-1.5 rounded-lg bg-slate-700/50">
                  <div className="text-sm font-medium text-slate-200">
                    {user ? (user.email?.split('@')[0] || 'User') : 'Guest'}
                  </div>
                  {user && (
                    <div className="text-xs text-slate-400 capitalize">
                      {user.role || 'No role'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-auto">
            {shouldShowLandingPage ? (
              <DashboardLandingPage user={user} navigate={navigate} />
            ) : (
              <Outlet />
            )}
          </div>
        </div>
        
        {/* Chat Drawer - For case messaging */}
        {user && <ChatDrawer open={chatOpen} onOpenChange={setChatOpen} />}
        
        {/* AI Assistant Drawer - For personalized AI help */}
        {user && (
          <AIAssistantDrawer 
            isOpen={aiAssistantOpen}
            onClose={() => setAiAssistantOpen(false)}
            caseId={localStorage.getItem('activeCaseId')}
            userId={user?.user_id}
            caseContext={{ role: user?.role }}
          />
        )}
        
        {/* Create Case Modal */}
        {user && (
          <CreateCaseModal 
            isOpen={createCaseModalOpen} 
            onClose={() => setCreateCaseModalOpen(false)}
            onCaseCreated={handleCaseCreated}
          />
        )}

        {/* Help Modals */}
        <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
        <ProcessGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
        <FAQModal isOpen={showFAQ} onClose={() => setShowFAQ(false)} />
        
        {/* Communication Menu for All Roles */}
        {user && (
          <CommunicationMenu 
            isOpen={communicationMenuOpen}
            onClose={() => setCommunicationMenuOpen(false)}
            onSelectOption={handleCommunicationOptionSelected}
            userRole={user.role}
          />
        )}
      </div>
    );
  }

  // If not logged in and on root path, show public landing page
  if (!user && location.pathname === '/') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <TopNavigationBar 
          user={user} 
          onMenuClick={() => {}} 
        />
        <PublicLandingPage />
      </div>
    );
  }
  
  // If not logged in and NOT on root, show auth forms (signin/register)
  if (!user && location.pathname !== '/') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
        <TopNavigationBar 
          user={user} 
          onMenuClick={() => {}} 
        />
        <Outlet />
      </div>
    );
  }
}

// Wrap HomePage with NotificationProvider
function HomePageWithProvider() {
  return (
    <NotificationProvider>
      <HomePage />
    </NotificationProvider>
  );
}

export default HomePageWithProvider;
