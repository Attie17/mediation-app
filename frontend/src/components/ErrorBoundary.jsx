import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

/**
 * Global Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree and displays a fallback UI
 * Prevents the entire app from crashing due to unhandled errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // In production, you would send this to your error tracking service
    // Example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      // If too many errors in a row, suggest page reload
      const tooManyErrors = errorCount > 3;

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-red-500/10 border-b border-red-500/20 p-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white mb-1">
                      Something went wrong
                    </h1>
                    <p className="text-slate-300">
                      {tooManyErrors 
                        ? 'Multiple errors detected. A page reload is recommended.'
                        : 'An unexpected error occurred. Don\'t worry, your data is safe.'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Details (Development Only) */}
              {isDevelopment && error && (
                <div className="p-6 border-b border-slate-700">
                  <h2 className="text-sm font-semibold text-slate-400 mb-2">Error Details:</h2>
                  <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-red-400 overflow-auto max-h-48">
                    <div className="mb-2">
                      <span className="text-slate-500">Message:</span> {error.toString()}
                    </div>
                    {errorInfo && errorInfo.componentStack && (
                      <div>
                        <span className="text-slate-500">Component Stack:</span>
                        <pre className="mt-1 text-slate-400 whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="p-6 bg-slate-800/50">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={this.handleReset}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg transition-colors"
                  >
                    <RefreshCcw className="w-4 h-4" />
                    Try Again
                  </button>
                  
                  {tooManyErrors && (
                    <button
                      onClick={this.handleReload}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
                    >
                      <RefreshCcw className="w-4 h-4" />
                      Reload Page
                    </button>
                  )}
                  
                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    Go Home
                  </button>
                </div>

                {/* Help Text */}
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-blue-300">
                    <strong>💡 Tip:</strong> If this error persists, try clearing your browser cache or 
                    contact support for assistance.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <div className="mt-4 text-center text-sm text-slate-400">
              Error ID: {Date.now().toString(36).toUpperCase()}
              {errorCount > 1 && ` • Errors: ${errorCount}`}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
