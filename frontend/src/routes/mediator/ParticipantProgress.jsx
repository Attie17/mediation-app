import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DashboardFrame from '../../components/DashboardFrame';
import { Card, CardHeader, CardTitle, CardContent, CardDecoration } from '../../components/ui/card-enhanced';
import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders } from '../../config/api';
import { CardSkeleton } from '../../components/ui/skeleton';
import { 
  Users, 
  CheckCircle2, 
  Circle, 
  Clock,
  Mail,
  FileText,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import AIInsightsPanel from '../../components/ai/AIInsightsPanel';

export default function ParticipantProgress() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchParticipantProgress();
  }, [caseId, token]);

  const fetchParticipantProgress = async () => {
    if (!token || !caseId) return;
    
    setLoading(true);
    setError(null);

    try {
      const headers = getAuthHeaders();
      
      // Fetch participants
      const participantsResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.cases.participants(caseId)}`, {
        headers
      });

      if (!participantsResponse.ok) {
        const errorData = await participantsResponse.json();
        throw new Error(errorData.error || 'Failed to fetch participants');
      }
      
      const participantsResult = await participantsResponse.json();
      
      // Handle response format { success: true, participants: [...] }
      const participantsList = participantsResult.participants || participantsResult || [];
      
      // For each participant, fetch their document upload progress
      const participantsWithProgress = await Promise.all(
        participantsList.map(async (participant) => {
          if (!participant.user_id) return { ...participant, progress: null };

          try {
            // Fetch divorcee stats to get document progress
            const statsResponse = await fetch(
              `${API_BASE_URL}${API_ENDPOINTS.dashboard.stats('divorcee', participant.user_id)}`,
              { headers }
            );

            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              return {
                ...participant,
                progress: {
                  documentsUploaded: statsData.stats?.documentsUploaded || 0,
                  documentsPending: statsData.stats?.documentsPending || 0,
                  caseStatus: statsData.stats?.caseStatus || 'unknown',
                  totalRequired: 16 // Standard number of required documents
                }
              };
            }
          } catch (err) {
            console.error(`Error fetching progress for ${participant.email}:`, err);
          }

          return { ...participant, progress: null };
        })
      );

      setParticipants(participantsWithProgress);
    } catch (err) {
      console.error('Error fetching participant progress:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStageStatus = (participant) => {
    if (!participant.user_id) {
      return {
        stage: 'invited',
        stageLabel: 'Invited - Awaiting Registration',
        progress: 0,
        stages: [
          { name: 'Invited', status: 'completed', icon: Mail },
          { name: 'Registered', status: 'pending', icon: Circle },
          { name: 'Profile Complete', status: 'pending', icon: Circle },
          { name: 'Documents', status: 'pending', icon: Circle }
        ]
      };
    }

    const progress = participant.progress;
    if (!progress) {
      return {
        stage: 'registered',
        stageLabel: 'Registered - Profile Setup',
        progress: 25,
        stages: [
          { name: 'Invited', status: 'completed', icon: CheckCircle2 },
          { name: 'Registered', status: 'completed', icon: CheckCircle2 },
          { name: 'Profile Complete', status: 'in-progress', icon: Clock },
          { name: 'Documents', status: 'pending', icon: Circle }
        ]
      };
    }

    const docProgress = (progress.documentsUploaded / progress.totalRequired) * 100;

    if (progress.documentsUploaded === 0) {
      return {
        stage: 'profile_complete',
        stageLabel: 'Profile Complete - Ready to Upload',
        progress: 50,
        stages: [
          { name: 'Invited', status: 'completed', icon: CheckCircle2 },
          { name: 'Registered', status: 'completed', icon: CheckCircle2 },
          { name: 'Profile Complete', status: 'completed', icon: CheckCircle2 },
          { name: 'Documents', status: 'in-progress', icon: Clock }
        ]
      };
    }

    if (progress.documentsUploaded < progress.totalRequired) {
      return {
        stage: 'uploading',
        stageLabel: `Uploading Documents (${progress.documentsUploaded}/${progress.totalRequired})`,
        progress: 50 + (docProgress / 2), // 50-100%
        stages: [
          { name: 'Invited', status: 'completed', icon: CheckCircle2 },
          { name: 'Registered', status: 'completed', icon: CheckCircle2 },
          { name: 'Profile Complete', status: 'completed', icon: CheckCircle2 },
          { name: 'Documents', status: 'in-progress', icon: Clock }
        ]
      };
    }

    return {
      stage: 'complete',
      stageLabel: 'All Documents Uploaded ✓',
      progress: 100,
      stages: [
        { name: 'Invited', status: 'completed', icon: CheckCircle2 },
        { name: 'Registered', status: 'completed', icon: CheckCircle2 },
        { name: 'Profile Complete', status: 'completed', icon: CheckCircle2 },
        { name: 'Documents', status: 'completed', icon: CheckCircle2 }
      ]
    };
  };

  if (loading) {
    return (
      <DashboardFrame title="Participant Progress">
        <div className="space-y-4 p-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </DashboardFrame>
    );
  }

  if (error) {
    return (
      <DashboardFrame title="Participant Progress">
        <div className="text-center py-12 text-red-400">Error: {error}</div>
      </DashboardFrame>
    );
  }

  return (
    <DashboardFrame title="Participant Onboarding Progress">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/mediator')}
            className="
              inline-flex items-center gap-2 px-4 py-2 rounded-lg
              bg-slate-800/50 border border-slate-700
              text-slate-300 hover:text-teal-400
              hover:border-teal-500/50
              transition-all duration-200
            "
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        {/* Participants List */}
        <div className="space-y-4">
          {participants.length === 0 ? (
            <Card gradient>
              <CardContent className="text-center py-12 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No participants yet</p>
              </CardContent>
            </Card>
          ) : (
            participants.map((participant) => {
              const status = getStageStatus(participant);
              
              return (
                <Card key={participant.id} gradient hover>
                  <CardDecoration color="teal" />
                  <CardContent className="p-6">
                    {/* Participant Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          {participant.name || participant.user_name || participant.email}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {participant.email}
                          </span>
                          <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs">
                            {participant.role || 'divorcee'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Overall Progress */}
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white mb-1">
                          {Math.round(status.progress)}%
                        </div>
                        <div className="text-xs text-slate-400">Complete</div>
                      </div>
                    </div>

                    {/* Current Stage Label */}
                    <div className="mb-4 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-sm font-medium text-teal-400">
                        {status.stageLabel}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal-500 to-blue-500 transition-all duration-500"
                          style={{ width: `${status.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Stage Indicators */}
                    <div className="grid grid-cols-4 gap-4">
                      {status.stages.map((stage, index) => {
                        const Icon = stage.icon;
                        const statusColors = {
                          completed: 'text-green-400 bg-green-500/20 border-green-500/30',
                          'in-progress': 'text-blue-400 bg-blue-500/20 border-blue-500/30',
                          pending: 'text-slate-500 bg-slate-500/10 border-slate-500/20'
                        };

                        return (
                          <div key={index} className="text-center">
                            <div className={`mx-auto w-12 h-12 rounded-full border-2 flex items-center justify-center mb-2 ${statusColors[stage.status]}`}>
                              <Icon className="w-6 h-6" />
                            </div>
                            <div className={`text-xs font-medium ${
                              stage.status === 'completed' ? 'text-green-400' :
                              stage.status === 'in-progress' ? 'text-blue-400' :
                              'text-slate-500'
                            }`}>
                              {stage.name}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Document Details (if available) */}
                    {participant.progress && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-green-400">
                              {participant.progress.documentsUploaded}
                            </div>
                            <div className="text-xs text-slate-400">Uploaded</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-orange-400">
                              {participant.progress.documentsPending}
                            </div>
                            <div className="text-xs text-slate-400">Pending Review</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-red-400">
                              {participant.progress.totalRequired - participant.progress.documentsUploaded}
                            </div>
                            <div className="text-xs text-slate-400">Missing</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action if not registered */}
                    {!participant.user_id && (
                      <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-orange-400">
                          <strong>Awaiting Registration:</strong> Participant has been invited but hasn't created their account yet.
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardFrame>
  );
}
