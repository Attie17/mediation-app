/**
 * AdminWelcomeGuide - Welcome experience for administrators
 * Helps admins access system management and oversight features
 */

import React from 'react';
import { Shield, Users, FileText, Settings, X, ArrowRight, Sparkles, BarChart3, Database, Lock } from 'lucide-react';

export default function AdminWelcomeGuide({ user, onClose, onNavigate }) {
  
  const handleOptionSelect = (option) => {
    switch(option) {
      case 'users':
        onNavigate?.('/admin/users');
        onClose?.();
        break;
      case 'cases':
        onNavigate?.('/admin/cases');
        onClose?.();
        break;
      case 'analytics':
        onNavigate?.('/admin/analytics');
        onClose?.();
        break;
      case 'settings':
        onNavigate?.('/admin/settings');
        onClose?.();
        break;
      case 'security':
        onNavigate?.('/admin/security');
        onClose?.();
        break;
      default:
        onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative border border-purple-500/20">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          aria-label="Close welcome"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Welcome content */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Welcome, {user?.name || user?.email?.split('@')[0] || 'Admin'}! 👋
          </h1>
          <p className="text-lg text-slate-300 mb-2">
            Your administrative dashboard is ready for system oversight.
          </p>
          <p className="text-slate-400">
            Manage users, oversee cases, monitor system health, and configure platform settings.
          </p>
        </div>

        {/* Admin action cards */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleOptionSelect('users')}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500 rounded-xl p-4 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Manage Users</h3>
                <p className="text-sm text-slate-400">Create, edit, and manage user accounts and permissions</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
            </div>
          </button>

          <button
            onClick={() => handleOptionSelect('cases')}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 rounded-xl p-4 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Oversee Cases</h3>
                <p className="text-sm text-slate-400">Monitor all mediation cases and their progress</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </div>
          </button>

          <button
            onClick={() => handleOptionSelect('analytics')}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-500 rounded-xl p-4 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-teal-500/20 flex items-center justify-center group-hover:bg-teal-500/30 transition-colors">
                <BarChart3 className="w-6 h-6 text-teal-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Platform Analytics</h3>
                <p className="text-sm text-slate-400">View system metrics, usage stats, and performance data</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-teal-400 transition-colors" />
            </div>
          </button>

          <button
            onClick={() => handleOptionSelect('security')}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-red-500 rounded-xl p-4 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                <Lock className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Security & Audit</h3>
                <p className="text-sm text-slate-400">Review security logs, access controls, and audit trails</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-red-400 transition-colors" />
            </div>
          </button>

          <button
            onClick={() => handleOptionSelect('settings')}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-orange-500 rounded-xl p-4 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                <Settings className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">System Settings</h3>
                <p className="text-sm text-slate-400">Configure platform settings and integrations</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-orange-400 transition-colors" />
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-3">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>You have full administrative access to all system features</span>
          </div>
          <button
            onClick={onClose}
            className="text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
          >
            Access Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}
