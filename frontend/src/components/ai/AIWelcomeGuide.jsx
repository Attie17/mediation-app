/**
 * AIWelcomeGuide - Welcome experience for divorcees
 * Greets divorcees and helps them choose where to begin
 */

import React, { useState } from 'react';
import { FileText, MessageSquare, BookOpen, Users, X, ArrowRight, Sparkles } from 'lucide-react';

export default function AIWelcomeGuide({ user, onClose, onNavigate, onOpenAI }) {
  const [step, setStep] = useState('welcome'); // 'welcome', 'options', 'guided'

  const handleOptionSelect = (option) => {
    switch(option) {
      case 'upload':
        onNavigate?.('/cases/' + localStorage.getItem('activeCaseId') + '/uploads');
        onClose?.();
        break;
      case 'learn':
        setStep('guided');
        break;
      case 'mediator':
        onOpenAI?.();
        onClose?.();
        break;
      case 'questions':
        onOpenAI?.();
        onClose?.();
        break;
      default:
        onClose?.();
    }
  };

  const handleSkip = () => {
    onClose?.();
  };

  if (step === 'welcome') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative border border-teal-500/20">
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            aria-label="Skip welcome"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Welcome content */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 mb-4">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Welcome back, {user?.name || user?.email?.split('@')[0] || 'there'}! 👋
            </h1>
            <p className="text-lg text-slate-300 mb-2">
              I'm your AI Assistant, here to guide you through the mediation process.
            </p>
            <p className="text-slate-400">
              Going through a divorce can be overwhelming, but you don't have to figure everything out alone. 
              I'm here to help every step of the way.
            </p>
          </div>

          {/* Option cards */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOptionSelect('upload')}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-teal-500 rounded-xl p-4 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-teal-500/20 flex items-center justify-center group-hover:bg-teal-500/30 transition-colors">
                  <FileText className="w-6 h-6 text-teal-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Upload Documents</h3>
                  <p className="text-sm text-slate-400">Start gathering and submitting required documents</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-teal-400 transition-colors" />
              </div>
            </button>

            <button
              onClick={() => handleOptionSelect('learn')}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 rounded-xl p-4 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Learn About the Process</h3>
                  <p className="text-sm text-slate-400">Understand how mediation works and what to expect</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
              </div>
            </button>

            <button
              onClick={() => handleOptionSelect('mediator')}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-purple-500 rounded-xl p-4 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Talk to Your Mediator</h3>
                  <p className="text-sm text-slate-400">Send a message to your mediation team</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
              </div>
            </button>

            <button
              onClick={() => handleOptionSelect('questions')}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-green-500 rounded-xl p-4 transition-all group text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                  <MessageSquare className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Ask Me Questions</h3>
                  <p className="text-sm text-slate-400">I can answer any questions about mediation, documents, or process</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-green-400 transition-colors" />
              </div>
            </button>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-2">
              💡 Tip: You can access me anytime by clicking "AI Assistant" in the sidebar
            </p>
            <button
              onClick={handleSkip}
              className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
            >
              Skip for now →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'guided') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative border border-blue-500/20">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">How Mediation Works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Document Upload</h3>
                  <p className="text-slate-400 text-sm">You'll upload financial documents, IDs, and other required paperwork. This helps your mediator understand your situation.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Mediator Review</h3>
                  <p className="text-slate-400 text-sm">Your mediator will review your documents and may ask clarifying questions. This usually takes 2-3 business days.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">First Session</h3>
                  <p className="text-slate-400 text-sm">You'll meet (virtually or in-person) with your mediator and ex-spouse to discuss arrangements. The mediator keeps things respectful and productive.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Agreement & Finalization</h3>
                  <p className="text-slate-400 text-sm">Once you reach agreements, your mediator drafts the settlement. You review it with your lawyer, then it becomes legally binding.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-blue-200 text-sm">
              <strong className="text-blue-100">Remember:</strong> Mediation is voluntary and collaborative. 
              The goal is a fair outcome for everyone, especially any children involved. You're in control of the decisions.
            </p>
          </div>

          <button
            onClick={() => handleOptionSelect('upload')}
            className="w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-teal-500 hover:to-blue-500 transition-all"
          >
            Got it! Let's Get Started
          </button>
        </div>
      </div>
    );
  }

  return null;
}
