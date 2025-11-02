import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown } from 'lucide-react';
import LogoutButton from './LogoutButton';
import NotificationDropdown from './NotificationDropdown';

// Helper function to capitalize first letter
const capitalizeFirstLetter = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function TopNavigationBar({ user, onMenuClick }) {
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState('default');
  const [showDevAccessDialog, setShowDevAccessDialog] = useState(false);
  
  // Check if running on localhost
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const hasDevAccess = localStorage.getItem('devAccess') === 'true' || isLocalhost;
  const isDevMode = localStorage.getItem('devMode') === 'true';
  
  const dropdownRef = useRef(null);
  const devMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowRoleSwitcher(false);
      }
      if (devMenuRef.current && !devMenuRef.current.contains(event.target)) {
        setShowDevMenu(false);
      }
    };

    if (showRoleSwitcher || showDevMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showRoleSwitcher, showDevMenu]);

  const switchRole = (newRole) => {
    const devUsers = {
      admin: {
        id: '862b3a3e-8390-57f8-a307-12004a341a2e',
        email: 'admin@dev.local',
        name: 'Dev Admin',
        role: 'admin'
      },
      mediator: {
        id: '1a472c78-438c-4b3e-a14d-05ce39d5bfc2',
        email: 'mediator@dev.local',
        name: 'Dev Mediator',
        role: 'mediator'
      },
      divorcee: {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'bob@example.com',
        name: 'Bob Divorcee',
        role: 'divorcee',
        user_id: '22222222-2222-2222-2222-222222222222'
      },
      lawyer: {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'lawyer@dev.local',
        name: 'Dev Lawyer',
        role: 'lawyer'
      }
    };

    const newUser = devUsers[newRole];
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('activeCaseId', newRole === 'divorcee' ? '3bcb2937-0e55-451a-a9fd-659187af84d4' : '4');
    
    // Reload to apply new role
    window.location.reload();
  };

  const handleDevLogin = () => {
    const devAdmin = {
      id: '862b3a3e-8390-57f8-a307-12004a341a2e',
      email: 'admin@dev.local',
      name: 'Dev Admin',
      role: 'admin'
    };

    // Set authentication
    localStorage.setItem('auth_token', 'dev-fake-token');
    localStorage.setItem('token', 'dev-fake-token');
    localStorage.setItem('user', JSON.stringify(devAdmin));
    localStorage.setItem('activeCaseId', '4');
    localStorage.setItem('devMode', 'true');
    
    // Redirect to dashboard
    window.location.href = '/dashboard';
  };

  const loginAsRole = (role, organizationId = null) => {
    const devUsers = {
      admin: {
        id: '862b3a3e-8390-57f8-a307-12004a341a2e',
        user_id: '862b3a3e-8390-57f8-a307-12004a341a2e',
        email: 'admin@dev.local',
        name: 'Dev Admin',
        role: 'admin',
        organization_id: organizationId || 'b325cbce-0a4c-4658-ac15-f6b4e8bbe62e'
      },
      mediator: {
        id: '1a472c78-438c-4b3e-a14d-05ce39d5bfc2',
        user_id: '1a472c78-438c-4b3e-a14d-05ce39d5bfc2',
        email: 'mediator@dev.local',
        name: 'Dev Mediator',
        role: 'mediator',
        organization_id: organizationId || 'b325cbce-0a4c-4658-ac15-f6b4e8bbe62e'
      },
      divorcee: {
        id: '22222222-2222-2222-2222-222222222222',
        user_id: '22222222-2222-2222-2222-222222222222',
        email: 'bob@example.com',
        name: 'Bob Divorcee',
        role: 'divorcee',
        organization_id: organizationId || 'b325cbce-0a4c-4658-ac15-f6b4e8bbe62e'
      },
      lawyer: {
        id: '11111111-1111-1111-1111-111111111111',
        user_id: '11111111-1111-1111-1111-111111111111',
        email: 'lawyer@dev.local',
        name: 'Dev Lawyer',
        role: 'lawyer',
        organization_id: organizationId || 'b325cbce-0a4c-4658-ac15-f6b4e8bbe62e'
      }
    };

    const selectedUser = devUsers[role];
    
    // Set authentication
    localStorage.setItem('auth_token', 'dev-fake-token');
    localStorage.setItem('token', 'dev-fake-token');
    localStorage.setItem('user', JSON.stringify(selectedUser));
    localStorage.setItem('activeCaseId', role === 'divorcee' ? '3bcb2937-0e55-451a-a9fd-659187af84d4' : '4');
    localStorage.setItem('devMode', 'true');
    
    // Navigate directly to role dashboard
    const dashboardPaths = {
      admin: '/admin',
      mediator: '/mediator',
      divorcee: '/divorcee',
      lawyer: '/lawyer'
    };
    window.location.replace(dashboardPaths[role] || '/dashboard');
  };
  return (
    <div className="sticky top-0 z-50 bg-slate-800 border-b border-slate-700/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Menu + Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300 hover:text-white"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <span className="text-white font-semibold text-lg hidden sm:block">
                MediationApp
              </span>
              {(isDevMode || isLocalhost) && (
                <div className="relative" ref={devMenuRef}>
                  <button
                    onClick={() => {
                      if (!hasDevAccess && !isLocalhost) {
                        setShowDevAccessDialog(true);
                      } else {
                        setShowDevMenu(!showDevMenu);
                      }
                    }}
                    className="ml-2 px-2 py-0.5 text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded hover:bg-orange-500/30 hover:border-orange-500/50 transition-all cursor-pointer flex items-center gap-1"
                    title="Click to select role and login"
                  >
                    🔧 DEV <ChevronDown className="w-3 h-3" />
                  </button>

                  {/* Dev Role Menu Dropdown */}
                  {showDevMenu && (
                    <div className="absolute left-0 mt-2 w-64 rounded-lg bg-slate-800 border border-orange-500/30 shadow-xl z-50">
                      <div className="p-2 border-b border-slate-700">
                        <div className="text-xs text-orange-400 px-2 py-1 font-medium">🔧 Login as Developer</div>
                      </div>
                      
                      {/* Organization Selector */}
                      <div className="p-2 border-b border-slate-700">
                        <label className="block text-xs text-slate-400 mb-1 px-2">Organization</label>
                        <select
                          value={selectedOrg}
                          onChange={(e) => setSelectedOrg(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm bg-slate-700 text-slate-200 rounded border border-slate-600 focus:border-orange-500 focus:outline-none"
                        >
                          <option value="default">Default Organization</option>
                          <option value="new">+ New Organization</option>
                        </select>
                      </div>
                      
                      <div className="p-2">
                        <button
                          onClick={() => loginAsRole('admin', selectedOrg === 'default' ? 'b325cbce-0a4c-4658-ac15-f6b4e8bbe62e' : null)}
                          className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors text-slate-200 hover:bg-slate-700/50 flex items-center gap-2"
                        >
                          <span className="text-lg">👨‍💼</span>
                          <div>
                            <div className="font-medium">Admin</div>
                            <div className="text-xs text-slate-400">Full system access</div>
                          </div>
                        </button>
                        <button
                          onClick={() => loginAsRole('mediator', selectedOrg === 'default' ? 'b325cbce-0a4c-4658-ac15-f6b4e8bbe62e' : null)}
                          className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors text-slate-200 hover:bg-slate-700/50 flex items-center gap-2"
                        >
                          <span className="text-lg">⚖️</span>
                          <div>
                            <div className="font-medium">Mediator</div>
                            <div className="text-xs text-slate-400">Case management</div>
                          </div>
                        </button>
                        <button
                          onClick={() => loginAsRole('divorcee', selectedOrg === 'default' ? 'b325cbce-0a4c-4658-ac15-f6b4e8bbe62e' : null)}
                          className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors text-slate-200 hover:bg-slate-700/50 flex items-center gap-2"
                        >
                          <span className="text-lg">�</span>
                          <div>
                            <div className="font-medium">Divorcee</div>
                            <div className="text-xs text-slate-400">End user view</div>
                          </div>
                        </button>
                        <button
                          onClick={() => loginAsRole('lawyer', selectedOrg === 'default' ? 'b325cbce-0a4c-4658-ac15-f6b4e8bbe62e' : null)}
                          className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors text-slate-200 hover:bg-slate-700/50 flex items-center gap-2"
                        >
                          <span className="text-lg">👔</span>
                          <div>
                            <div className="font-medium">Lawyer</div>
                            <div className="text-xs text-slate-400">Legal representative</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Notifications + User + Logout */}
          <div className="flex items-center gap-4">
            {/* Notification Dropdown */}
            {user && <NotificationDropdown />}
            
            {user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                  className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-400 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.email?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-sm font-medium text-slate-200">
                      {capitalizeFirstLetter(user.email?.split('@')[0]) || 'User'}
                    </div>
                    <div className="text-xs text-slate-400 capitalize flex items-center gap-1">
                      {user.role || 'No role'}
                      {isDevMode && <ChevronDown className="w-3 h-3" />}
                    </div>
                  </div>
                </button>

                {/* Role Switcher Dropdown */}
                {isDevMode && showRoleSwitcher && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg bg-slate-800 border border-slate-700 shadow-xl z-50">
                    <div className="p-2 border-b border-slate-700">
                      <div className="text-xs text-slate-400 px-2 py-1">🔧 Dev Mode - Switch Role</div>
                    </div>
                    <div className="p-2">
                      {['admin', 'mediator', 'divorcee', 'lawyer'].map((role) => (
                        <button
                          key={role}
                          onClick={() => switchRole(role)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                            user.role === role
                              ? 'bg-teal-500/20 text-teal-400'
                              : 'text-slate-300 hover:bg-slate-700/50'
                          }`}
                        >
                          <span className="capitalize">{role}</span>
                          {user.role === role && <span className="ml-2 text-xs">✓</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
