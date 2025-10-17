import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, FileText, Users, Settings, Bell, LogOut, Shield } from 'lucide-react';

export default function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const caseId = localStorage.getItem('activeCaseId');
  const hasValidCase = caseId && caseId.length > 10; // Basic check for UUID-like format

  const handleLogoutClick = () => {
    onLogout();
  };

  const menuSections = [
    {
      title: 'Navigation',
      items: [
        { label: 'Home', path: '/', roles: ['divorcee','mediator','lawyer','admin'], icon: Home, isPublic: true },
      ]
    },
    {
      title: 'Dashboards',
      items: [
        { label: 'My Dashboard', path: user ? `/${user.role}` : '/signin', roles: ['divorcee','mediator','lawyer','admin'], icon: LayoutDashboard },
        { label: 'Admin Dashboard', path: '/admin', roles: ['admin'], icon: Shield },
        { label: 'Mediator Dashboard', path: '/mediator', roles: ['mediator','admin'], icon: Users },
        { label: 'Lawyer Dashboard', path: '/lawyer', roles: ['lawyer','admin'], icon: FileText },
        { label: 'Divorcee Dashboard', path: '/divorcee', roles: ['divorcee','admin'], icon: Users },
      ]
    },
    // Only show Cases section if user has a valid case
    ...(hasValidCase ? [{
      title: 'Cases',
      items: [
        { label: 'Case Overview', path: `/case/${caseId}`, roles: ['divorcee','mediator','lawyer','admin'], icon: FileText },
        { label: 'Case Details', path: `/cases/${caseId}`, roles: ['divorcee','mediator','lawyer','admin'], icon: FileText },
        { label: 'Case Uploads', path: `/cases/${caseId}/uploads`, roles: ['divorcee','mediator','lawyer','admin'], icon: FileText },
      ]
    }] : []),
    {
      title: 'Admin Tools',
      items: [
        { label: 'User Management', path: '/admin/users', roles: ['admin'], icon: Users },
        { label: 'Role Management', path: '/admin/roles', roles: ['admin'], icon: Shield },
      ]
    },
    {
      title: 'Account',
      items: [
        { label: 'Profile Settings', path: '/profile', roles: ['divorcee','mediator','lawyer','admin'], icon: Settings },
        { label: 'Notifications', path: '/notifications', roles: ['divorcee','mediator','lawyer','admin'], icon: Bell },
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
            <div key={section.title || `section-${sectionIndex}`} className="mb-6">
              {section.title && (
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <button
                      key={item.label}
                      onClick={() => item.path && navigate(item.path)}
                      className={`
                        w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                        flex items-center gap-3
                        ${isActive 
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' 
                          : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
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
