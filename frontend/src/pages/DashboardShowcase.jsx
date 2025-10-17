import React from 'react';
import { useAuth } from '../context/AuthContext';

// Import all dashboard components
import AdminDashboard from '../routes/admin';
import MediatorDashboard from '../routes/mediator';
import LawyerDashboard from '../routes/lawyer';
import DivorceeDashboard from '../routes/divorcee';

export default function DashboardShowcase() {
  const { user } = useAuth();
  const [selectedDashboard, setSelectedDashboard] = React.useState('admin');

  const dashboards = [
    { id: 'admin', name: 'Admin Dashboard', icon: '👨‍💼', component: AdminDashboard },
    { id: 'mediator', name: 'Mediator Dashboard', icon: '⚖️', component: MediatorDashboard },
    { id: 'lawyer', name: 'Lawyer Dashboard', icon: '👔', component: LawyerDashboard },
    { id: 'divorcee', name: 'Divorcee Dashboard', icon: '👤', component: DivorceeDashboard },
  ];

  const CurrentDashboard = dashboards.find(d => d.id === selectedDashboard)?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Dashboard Selector */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Dashboard Showcase 🎨
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Preview all dashboard styles • Logged in as: {user?.email || 'Guest'}
              </p>
            </div>
            
            {/* Dashboard Selector */}
            <div className="flex gap-2 flex-wrap">
              {dashboards.map((dashboard) => (
                <button
                  key={dashboard.id}
                  onClick={() => setSelectedDashboard(dashboard.id)}
                  className={`
                    px-4 py-2 rounded-lg font-medium text-sm transition-all
                    flex items-center gap-2
                    ${selectedDashboard === dashboard.id
                      ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-slate-600/50'
                    }
                  `}
                >
                  <span>{dashboard.icon}</span>
                  <span className="hidden sm:inline">{dashboard.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <p className="text-sm font-medium text-blue-300 mb-1">
                Viewing: {dashboards.find(d => d.id === selectedDashboard)?.name}
              </p>
              <p className="text-xs text-blue-300/70">
                All data shown here is placeholder. Switch between dashboards using the buttons above to compare styling.
              </p>
            </div>
          </div>
        </div>

        {/* Render Selected Dashboard */}
        {CurrentDashboard && <CurrentDashboard />}
      </div>

      {/* Quick Stats Panel */}
      <div className="fixed bottom-4 right-4 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 shadow-xl max-w-xs">
        <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <span>📊</span>
          Style Comparison
        </h3>
        <div className="space-y-2 text-xs">
          <StyleCheck
            label="Card Component"
            status="consistent"
            details="All use card-enhanced"
          />
          <StyleCheck
            label="Color Scheme"
            status="consistent"
            details="Teal, Blue, Orange, Lime"
          />
          <StyleCheck
            label="Layout Grid"
            status="varies"
            details="Admin: 5 cols, Others: 4 cols"
          />
          <StyleCheck
            label="Header Style"
            status="varies"
            details="Different greetings/emojis"
          />
          <StyleCheck
            label="Empty States"
            status="consistent"
            details="All use EmptyState component"
          />
        </div>
      </div>
    </div>
  );
}

// Helper component for style checks
function StyleCheck({ label, status, details }) {
  const statusColors = {
    consistent: 'text-lime-400',
    varies: 'text-orange-400',
    inconsistent: 'text-red-400'
  };

  const statusIcons = {
    consistent: '✓',
    varies: '⚠',
    inconsistent: '✗'
  };

  return (
    <div className="flex items-start gap-2">
      <span className={statusColors[status]}>
        {statusIcons[status]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-slate-300 font-medium">{label}</p>
        <p className="text-slate-500 text-[10px] truncate">{details}</p>
      </div>
    </div>
  );
}
