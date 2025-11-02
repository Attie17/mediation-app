import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardFrame from '../DashboardFrame';
import InviteParticipantModal from '../InviteParticipantModal';
import { UserPlus, ArrowLeft, Calendar, Clock, Video, MapPin } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

export default function CaseOverviewPage() {
  const { caseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState([]);

  useEffect(() => {
    const userId = user?.user_id || user?.id;
    if (caseId && userId) {
      fetchCaseData();
      fetchUpcomingSessions();
    }
  }, [caseId, user?.user_id, user?.id]);

  const fetchUpcomingSessions = async () => {
    try {
      const userId = user?.user_id || user?.id;
      const data = await apiFetch(`/api/sessions?caseId=${caseId}&userId=${userId}`);
      
      if (data && Array.isArray(data)) {
        // Filter for upcoming sessions and sort by date
        const now = new Date();
        const upcoming = data
          .filter(session => new Date(session.scheduled_at || session.date) > now)
          .sort((a, b) => new Date(a.scheduled_at || a.date) - new Date(b.scheduled_at || b.date));
        
        // Remove duplicates by session ID
        const uniqueSessions = upcoming.reduce((acc, session) => {
          if (!acc.find(s => s.id === session.id)) {
            acc.push(session);
          }
          return acc;
        }, []);
        
        // Show max 3 upcoming sessions
        setUpcomingSessions(uniqueSessions.slice(0, 3));
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      // Don't show error to user, just log it
    }
  };

  const fetchCaseData = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = user?.user_id || user?.id;
      const userRole = user?.role || 'mediator';

      const data = await apiFetch(`/api/cases/${caseId}?userId=${userId}&userRole=${userRole}`);
      
      setCaseData(data);
    } catch (err) {
      console.error('Error fetching case data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardFrame title="Case Overview">
        <div className="flex items-center justify-center py-12">
          <div className="text-white/70">Loading case data...</div>
        </div>
      </DashboardFrame>
    );
  }

  if (error) {
    return (
      <DashboardFrame title="Case Overview">
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-200">
          <p className="font-semibold">Error loading case</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-3 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
          >
            Back to Dashboard
          </button>
        </div>
      </DashboardFrame>
    );
  }

  if (!caseData) {
    return (
      <DashboardFrame title="Case Overview">
        <div className="text-white/70">No case data found</div>
      </DashboardFrame>
    );
  }

  const { case: caseInfo, participants, documents } = caseData;
  const requirements = documents?.topics || [];
  const progressPercent = documents?.overallPct || 0;
  
  // Calculate stats from documents
  const stats = {
    totalRequirements: requirements.reduce((sum, topic) => sum + (topic.total || 0), 0),
    confirmedCount: requirements.reduce((sum, topic) => sum + (topic.complete || 0), 0),
    uploadedCount: requirements.reduce((sum, topic) => sum + (topic.total || 0) - (topic.complete || 0), 0),
    missingCount: 0 // Not provided by backend
  };
  
  const totalRequirements = stats.totalRequirements;
  const confirmedCount = stats.confirmedCount;

  return (
    <DashboardFrame title={caseInfo?.title || `Case #${caseId}`}> 
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(user?.role === 'mediator' ? '/mediator' : '/dashboard')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </button>

        {/* Case Header */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-2">
                {caseInfo?.title || `Case #${caseId}`}
              </h2>
              <p className="text-white/70 text-sm">
                Created: {new Date(caseInfo?.created_at).toLocaleDateString()}
              </p>
              {caseInfo?.description && (
                <p className="text-white/80 mt-3">{caseInfo.description}</p>
              )}
            </div>
            <div className="flex items-start gap-4">
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{progressPercent}%</div>
                <div className="text-sm text-white/70">Complete</div>
              </div>
              {(user?.role === 'mediator' || user?.role === 'admin') && (
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/30 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="text-sm font-medium">Invite</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 bg-white/10 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-green-500 h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Upcoming Sessions */}
        {(user?.role === 'mediator' || user?.role === 'admin') && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-400" />
                Upcoming Sessions
              </h3>
              <button
                onClick={() => navigate('/mediator/schedule')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/30 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Schedule Session</span>
              </button>
            </div>
            {upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.map((session) => {
                  const sessionDate = new Date(session.scheduled_at || session.date);
                  const dateStr = sessionDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  });
                  const timeStr = sessionDate.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  });
                  
                  return (
                    <div 
                      key={session.id}
                      className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/10"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-2">
                            {session.title || session.session_type || 'Mediation Session'}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-white/70">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{dateStr} at {timeStr}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {session.session_type === 'online' || session.type === 'online' ? (
                                <>
                                  <Video className="w-4 h-4" />
                                  <span>Online</span>
                                </>
                              ) : (
                                <>
                                  <MapPin className="w-4 h-4" />
                                  <span>In Person</span>
                                </>
                              )}
                            </div>
                          </div>
                          {session.notes && (
                            <p className="text-sm text-white/60 mt-2">{session.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-white/60">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-white/30" />
                <p className="text-sm">No upcoming sessions scheduled</p>
                <button
                  onClick={() => navigate('/mediator/schedule')}
                  className="mt-3 text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors"
                >
                  Schedule your first session →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Participants - Full Width Button Style */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-white">Participants</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/60">{participants?.length || 0} total</span>
              <button
                onClick={() => navigate(`/mediator/progress/${caseId}`)}
                className="px-3 py-1 text-xs bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/30 rounded-lg transition-colors"
              >
                View Progress
              </button>
            </div>
          </div>
          {participants && participants.length > 0 ? (
            <div className="space-y-2">
              {participants.map((participant) => {
                const roleColors = {
                  divorcee: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                  mediator: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
                  lawyer: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                  admin: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                };
                const roleColor = roleColors[participant.role] || roleColors.divorcee;
                
                return (
                  <div 
                    key={participant.userId || participant.user_id || participant.id}
                    className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-white font-medium">
                          {participant.displayName || participant.display_name || participant.user?.full_name || participant.email || 'Unknown User'}
                        </div>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium border ${roleColor}`}>
                          {participant.role}
                        </span>
                      </div>
                    </div>
                    {participant.email && (
                      <div className="text-xs text-white/50 mt-2">
                        {participant.email}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-white/60 text-center py-4">
              No participants yet
            </div>
          )}
        </div>
      </div>

      {/* Invite Participant Modal */}
      <InviteParticipantModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        caseId={caseId}
        onSuccess={() => {
          fetchCaseData(); // Refresh case data after adding participant
        }}
      />
    </DashboardFrame>
  );
}
