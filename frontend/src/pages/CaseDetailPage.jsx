import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail,
  Edit,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User
} from 'lucide-react';
import DashboardFrame from '../components/DashboardFrame';
import AIInsightsPanel from '../components/ai/AIInsightsPanel';
import config from '../config';

const API_BASE_URL = config.api.baseUrl;

const CaseDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [caseData, setCaseData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCaseDetails();
  }, [id, token]);

  const fetchCaseDetails = async () => {
    if (!token) return;
    
    setLoading(true);
    setError(null);

    try {
      // Fetch case details
  const caseResponse = await fetch(`${API_BASE_URL}/api/cases/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!caseResponse.ok) throw new Error('Failed to fetch case details');
      const caseResult = await caseResponse.json();
      // Handle both {case: {...}} and direct {...} response structures
      const caseData = caseResult.case || caseResult;
      console.log('Case data:', caseData); // Debug log
      setCaseData(caseData);

      // Fetch participants
  const participantsResponse = await fetch(`${API_BASE_URL}/api/cases/${id}/participants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (participantsResponse.ok) {
        const participantsData = await participantsResponse.json();
        setParticipants(participantsData);
      }

      // Fetch sessions
  const sessionsResponse = await fetch(`${API_BASE_URL}/api/cases/${id}/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData);
      }

    } catch (err) {
      console.error('Error fetching case details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      pending: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
      closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    return colors[status] || colors.open;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardFrame title="Case Details">
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Loading case details...</div>
        </div>
      </DashboardFrame>
    );
  }

  if (error) {
    return (
      <DashboardFrame title="Case Details">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400 text-xl">Error: {error}</div>
        </div>
      </DashboardFrame>
    );
  }

  if (!caseData) {
    return (
      <DashboardFrame title="Case Details">
        <div className="flex items-center justify-center h-64">
          <div className="text-white text-xl">Case not found</div>
        </div>
      </DashboardFrame>
    );
  }

  return (
    <DashboardFrame title={caseData.title || `Case #${caseData.id}`}>
      <div className="space-y-6">
        {/* Action Button */}
        <div className="flex justify-end">
          <button
            onClick={() => navigate(`/case/${id}`)}
            className="px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/30 rounded-lg transition-colors"
          >
            Go to Workspace →
          </button>
        </div>

        {/* Case Header */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <p className="text-slate-400">
                {caseData.description || 'No description provided'}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-lg border font-medium ${getStatusColor(caseData.status)}`}>
              {caseData.status?.replace(/_/g, ' ').toUpperCase() || 'OPEN'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
            <div>
              <div className="text-sm text-slate-400 mb-1">Created</div>
              <div className="text-white font-medium">{formatDate(caseData.created_at)}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">Last Updated</div>
              <div className="text-white font-medium">{formatDate(caseData.updated_at)}</div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">Case ID</div>
              <div className="text-white font-medium">#{caseData.id}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Participants */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-teal-400" />
              <h2 className="text-xl font-bold text-white">Participants</h2>
              <span className="ml-auto px-2 py-1 bg-teal-500/20 text-teal-400 text-sm rounded">
                {participants.length}
              </span>
            </div>

            {participants.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No participants yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-white">
                        {participant.user_name || participant.email || 'Unknown User'}
                      </div>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                        {participant.role || participant.user_role || 'Participant'}
                      </span>
                    </div>
                    {participant.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Mail className="w-4 h-4" />
                        {participant.email}
                      </div>
                    )}
                    {participant.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                        <Phone className="w-4 h-4" />
                        {participant.phone}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sessions */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Sessions</h2>
              <span className="ml-auto px-2 py-1 bg-blue-500/20 text-blue-400 text-sm rounded">
                {sessions.length}
              </span>
            </div>

            {sessions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No sessions scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="font-medium text-white mb-2">
                      {session.title || 'Mediation Session'}
                    </div>
                    <div className="space-y-1 text-sm text-slate-400">
                      {session.session_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(session.session_date)}
                        </div>
                      )}
                      {session.session_time && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {session.session_time}
                        </div>
                      )}
                      {session.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {session.location}
                        </div>
                      )}
                    </div>
                    {session.status && (
                      <div className="mt-2">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                          {session.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Additional Case Information */}
        {(caseData.case_type || caseData.priority || caseData.notes) && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Additional Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caseData.case_type && (
                <div>
                  <div className="text-sm text-slate-400 mb-1">Case Type</div>
                  <div className="text-white">{caseData.case_type}</div>
                </div>
              )}
              {caseData.priority && (
                <div>
                  <div className="text-sm text-slate-400 mb-1">Priority</div>
                  <div className="text-white">{caseData.priority}</div>
                </div>
              )}
            </div>
            {caseData.notes && (
              <div className="mt-4">
                <div className="text-sm text-slate-400 mb-1">Notes</div>
                <div className="text-white whitespace-pre-wrap">{caseData.notes}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardFrame>
  );
};

export default CaseDetailPage;
