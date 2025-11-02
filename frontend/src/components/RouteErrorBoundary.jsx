import React from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Route Error Boundary Component
 * Smaller error boundary for use within specific routes/pages
 * Provides a less intrusive error UI compared to global error boundary
 */
class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('RouteErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error });

    // Log to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <RouteErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          fallbackPath={this.props.fallbackPath}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Route Error Fallback UI Component
 */
function RouteErrorFallback({ error, onRetry, fallbackPath = '/' }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">
            Oops! Something went wrong
          </h2>
          
          <p className="text-slate-300 text-sm mb-6">
            We encountered an error loading this section. Your data is safe.
          </p>

          {process.env.NODE_ENV === 'development' && error && (
            <div className="mb-4 p-3 bg-slate-900 rounded text-left">
              <p className="text-xs text-red-400 font-mono break-words">
                {error.toString()}
              </p>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onRetry}
              className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate(fallbackPath)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RouteErrorBoundary;
export { RouteErrorFallback };
