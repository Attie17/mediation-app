import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import config from '../config';

const API_BASE_URL = config.api.baseUrl;

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const displayName = user?.preferredName || user?.name || 'there';
  
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch role-specific stats
  const statsRes = await fetch(`${API_BASE_URL}/dashboard/stats/${user.role}/${user.id}`, {
        headers
      });

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.ok && statsData.stats) {
          setStats(statsData.stats);
        }
      }

      // Fetch user's cases
  const casesRes = await fetch(`${API_BASE_URL}/api/cases/user/${user.id}`, {
        headers
      });

      if (casesRes.ok) {
        const casesData = await casesRes.json();
        setCases(casesData.cases || []);
      } else if (casesRes.status === 404) {
        // Endpoint doesn't exist, use alternative approach
        setCases([]);
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = () => {
    navigate('/intake');
  };

  const handleCaseClick = (caseId) => {
    navigate(`/case/${caseId}`);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 sm:p-8 md:p-12 text-white">
      <div className="w-full max-w-3xl">
        <h3 className="text-2xl font-bold mb-6">Hello {displayName}, here is your dashboard.</h3>
        
        {loading && (
          <div className="text-white/70 mb-4">Loading dashboard...</div>
        )}

        {error && (
          <div className="text-red-300 mb-4 p-3 bg-red-500/20 rounded-lg">
            Error: {error}
          </div>
        )}

        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="bg-white/10 rounded-lg p-4">
                <div className="text-3xl font-bold">{value}</div>
                <div className="text-sm text-white/70 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {user?.role === 'divorcee' && (
            <button
              type="button"
              onClick={handleCreateCase}
              className="w-full rounded-full border border-white/70 text-white bg-white/20 hover:bg-white/30 transition text-base font-semibold flex items-center justify-center px-6 py-3"
            >
              + Create New Case
            </button>
          )}
          
          {/* Cases Section */}
          <div className="text-left">
            <h4 className="text-lg font-semibold mb-3">
              Your Cases {cases.length > 0 && `(${cases.length})`}
            </h4>
            {cases.length === 0 ? (
              <div className="text-white/60 text-sm">
                No cases yet. {user?.role === 'divorcee' && 'Click "Create New Case" to get started.'}
              </div>
            ) : (
              <div className="space-y-2">
                {cases.map((caseItem) => (
                  <button
                    key={caseItem.id}
                    onClick={() => handleCaseClick(caseItem.id)}
                    className="w-full rounded-lg border border-white/30 text-white bg-white/10 hover:bg-white/20 transition text-left px-4 py-3"
                  >
                    <div className="font-semibold">
                      {caseItem.title || `Case #${caseItem.id}`}
                    </div>
                    <div className="text-sm text-white/70">
                      Status: {caseItem.status || 'Open'}
                    </div>
                    {caseItem.description && (
                      <div className="text-xs text-white/50 mt-1 truncate">
                        {caseItem.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="w-full rounded-full border border-white/70 text-white bg-transparent hover:bg-white/10 transition text-base font-semibold flex items-center justify-center px-6 py-3"
          >
            Documents
          </button>
          <button
            type="button"
            className="w-full rounded-full border border-white/70 text-white bg-transparent hover:bg-white/10 transition text-base font-semibold flex items-center justify-center px-6 py-3"
          >
            Notifications
          </button>
        </div>
      </div>
    </div>
  );
}
