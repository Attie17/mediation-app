import React from 'react';
import { AlertTriangle, Clock, LogOut, RefreshCw } from 'lucide-react';

/**
 * SessionTimeoutWarning Component
 * Modal that appears 2 minutes before session timeout
 * Allows user to extend session or logout immediately
 */
export default function SessionTimeoutWarning({ open, secondsRemaining, onExtend, onLogout }) {
  if (!open) return null;

  // Format seconds as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage (inversely)
  const totalWarningTime = 2 * 60; // 2 minutes
  const progressPercent = Math.max(0, (secondsRemaining / totalWarningTime) * 100);

  // Determine urgency level
  const isUrgent = secondsRemaining < 30;
  const isCritical = secondsRemaining < 10;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`
            bg-slate-800 border rounded-xl shadow-2xl max-w-md w-full overflow-hidden
            animate-in zoom-in-95 duration-200
            ${isCritical ? 'border-red-500 shadow-red-500/20' : isUrgent ? 'border-orange-500 shadow-orange-500/20' : 'border-yellow-500 shadow-yellow-500/20'}
          `}
        >
          {/* Header */}
          <div className={`
            p-6 border-b
            ${isCritical ? 'bg-red-500/10 border-red-500/20' : isUrgent ? 'bg-orange-500/10 border-orange-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}
          `}>
            <div className="flex items-center gap-4">
              <div className={`
                flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center
                ${isCritical ? 'bg-red-500/20 animate-pulse' : isUrgent ? 'bg-orange-500/20' : 'bg-yellow-500/20'}
              `}>
                {isCritical ? (
                  <AlertTriangle className="w-7 h-7 text-red-400 animate-bounce" />
                ) : (
                  <Clock className="w-7 h-7 text-yellow-400" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-1">
                  {isCritical ? 'Session Expiring!' : 'Session Timeout Warning'}
                </h2>
                <p className="text-sm text-slate-300">
                  {isCritical 
                    ? 'Your session is about to expire'
                    : 'You\'ll be logged out soon due to inactivity'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Countdown Timer */}
            <div className="text-center">
              <div className={`
                text-5xl font-bold tabular-nums mb-2
                ${isCritical ? 'text-red-400 animate-pulse' : isUrgent ? 'text-orange-400' : 'text-yellow-400'}
              `}>
                {formatTime(secondsRemaining)}
              </div>
              <p className="text-sm text-slate-400">
                Time remaining until auto-logout
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="relative w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`
                    absolute top-0 left-0 h-full transition-all duration-1000 ease-linear
                    ${isCritical ? 'bg-red-500' : isUrgent ? 'bg-orange-500' : 'bg-yellow-500'}
                  `}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Info Text */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
              <p className="text-sm text-slate-300 text-center">
                Your session will automatically end after <strong>15 minutes</strong> of inactivity for security reasons.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onExtend}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Stay Logged In
              </button>
              <button
                onClick={onLogout}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
