import React from 'react';
import { Menu, X } from 'lucide-react';
import LogoutButton from './LogoutButton';

export default function TopNavigationBar({ user, onMenuClick }) {
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
            </div>
          </div>

          {/* Right side - User + Logout */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-700/50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-400 flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {user.email?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-slate-200">
                    {user.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="text-xs text-slate-400 capitalize">
                    {user.role || 'No role'}
                  </div>
                </div>
              </div>
            )}
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
