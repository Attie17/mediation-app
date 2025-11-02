import { AlertTriangle, Clock } from 'lucide-react';

export default function IdleWarningModal({ isOpen, timeRemaining, onStayActive, onLogout }) {
  if (!isOpen) return null;

  const secondsRemaining = Math.ceil(timeRemaining / 1000);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-2xl max-w-md w-full border border-orange-500/30 animate-fadeIn">
          {/* Header with warning icon */}
          <div className="p-6 border-b border-orange-500/30 bg-gradient-to-r from-orange-900/20 to-red-900/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-orange-400">Session Timeout Warning</h2>
                <p className="text-sm text-slate-400 mt-1">You've been inactive</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start gap-3 mb-6">
              <Clock className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-slate-300 mb-2">
                  For your security, you will be automatically logged out in:
                </p>
                <div className="text-3xl font-bold text-orange-400 mb-2">
                  {secondsRemaining} {secondsRemaining === 1 ? 'second' : 'seconds'}
                </div>
                <p className="text-sm text-slate-400">
                  Click "Stay Logged In" to continue your session, or "Logout Now" to end your session.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onStayActive}
                className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
              >
                Stay Logged In
              </button>
              <button
                onClick={onLogout}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg font-medium transition-colors duration-200 border border-slate-600"
              >
                Logout Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
