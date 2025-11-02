import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * LoadingScreen Component
 * Displayed while lazy-loaded route components are being loaded
 * Provides visual feedback during code splitting transitions
 */
export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        {/* Spinner */}
        <div className="mb-6 flex justify-center">
          <Loader2 className="w-12 h-12 text-teal-400 animate-spin" />
        </div>

        {/* Loading Text */}
        <h2 className="text-xl font-semibold text-white mb-2">
          Loading...
        </h2>
        <p className="text-slate-400 text-sm">
          Please wait while we prepare your page
        </p>

        {/* Progress Dots */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
          <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
          <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
      </div>
    </div>
  );
}

/**
 * InlineLoadingSpinner Component
 * Smaller loading indicator for inline use (e.g., within panels)
 */
export function InlineLoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400">{message}</p>
      </div>
    </div>
  );
}
