import React from 'react';
import { Home, LogOut, AlertCircle } from 'lucide-react';

export default function ConfirmHomeModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-orange-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-white mb-2">
          Leave This Page?
        </h2>

        {/* Message */}
        <p className="text-center text-slate-300 mb-6">
          Do you want to <span className="font-semibold text-orange-400">logout</span> and return to the home page? 
          <br />
          <span className="text-sm text-slate-400 mt-2 block">
            You will need to sign in again to access your dashboard.
          </span>
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="
              flex-1 px-4 py-3 rounded-lg
              bg-slate-700 hover:bg-slate-600
              text-slate-200 font-medium
              transition-all duration-200
              border border-slate-600
            "
          >
            Stay Here
          </button>
          <button
            onClick={onConfirm}
            className="
              flex-1 px-4 py-3 rounded-lg
              bg-gradient-to-r from-orange-500 to-red-500
              hover:from-orange-600 hover:to-red-600
              text-white font-medium
              transition-all duration-200
              flex items-center justify-center gap-2
              shadow-lg hover:shadow-xl
            "
          >
            <LogOut className="w-4 h-4" />
            Logout & Leave
          </button>
        </div>
      </div>
    </div>
  );
}
