/**
 * MediatorWelcomeGuide - Welcome experience for mediators
 * Helps mediators access key features and stay on top of their cases
 */

import React from 'react';
import { FileText, MessageSquare, Calendar, Users, X, ArrowRight, Sparkles, ClipboardList, TrendingUp } from 'lucide-react';

export default function MediatorWelcomeGuide({ user, onClose, onNavigate, onOpenAI }) {
  
  const handleOptionSelect = (option) => {
    switch(option) {
      case 'cases':
        // Scroll to cases section or navigate
        onClose?.();
        break;
      case 'reviews':
        onNavigate?.('reviews');
        onClose?.();
        break;
      case 'sessions':
        onNavigate?.('sessions');
        onClose?.();
        break;
      case 'ai':
        onOpenAI?.();
        onClose?.();
        break;
      case 'analytics':
        // Scroll to analytics
        onClose?.();
        break;
      default:
        onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative border border-blue-500/20">
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
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Welcome back, {user?.name || user?.email?.split('@')[0] || 'Mediator'}! 👋
          </h1>
          <p className="text-lg text-slate-300 mb-2">
            Your mediation hub is ready to help you manage your caseload effectively.
          </p>
          <p className="text-slate-400">
            Access your cases, review documents, schedule sessions, and get AI-powered insights to support your clients.
          </p>
        </div>

        {/* Quick action cards */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleOptionSelect('cases')}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 rounded-xl p-4 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">View Your Cases</h3>
                <p className="text-sm text-slate-400">Access all active mediation cases and their details</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
            </div>
          </button>

          <button
            onClick={() => handleOptionSelect('reviews')}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-orange-500 rounded-xl p-4 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                <ClipboardList className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Review Pending Documents</h3>
                <p className="text-sm text-slate-400">Approve or request changes to submitted documents</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-orange-400 transition-colors" />
            </div>
          </button>

          <button
            onClick={() => handleOptionSelect('sessions')}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500 rounded-xl p-4 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                <Calendar className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Manage Sessions</h3>
                <p className="text-sm text-slate-400">Schedule and prepare for mediation sessions</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
            </div>
          </button>

          <button
            onClick={() => handleOptionSelect('analytics')}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-500 rounded-xl p-4 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-teal-500/20 flex items-center justify-center group-hover:bg-teal-500/30 transition-colors">
                <TrendingUp className="w-6 h-6 text-teal-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">View Analytics</h3>
                <p className="text-sm text-slate-400">Get AI insights on your caseload and performance</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-teal-400 transition-colors" />
            </div>
          </button>

          <button
            onClick={() => handleOptionSelect('ai')}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-green-500 rounded-xl p-4 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                <MessageSquare className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">AI Assistant</h3>
                <p className="text-sm text-slate-400">Get help with case analysis, documentation, and best practices</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-green-400 transition-colors" />
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-3">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Tip: You can access the AI Assistant anytime by pressing <kbd className="px-2 py-1 bg-slate-700 rounded text-xs">A</kbd></span>
          </div>
          <button
            onClick={onClose}
            className="text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors"
          >
            Get Started →
          </button>
        </div>
      </div>
    </div>
  );
}
