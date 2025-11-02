import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders } from '../../config/api';
import { Calendar, Clock, MapPin, Users, Search, Filter, Plus, Video, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card-enhanced';
import AIInsightsPanel from '../../components/ai/AIInsightsPanel';

export default function MediatorSessionsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('upcoming'); // 'upcoming', 'past', 'all'

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    if (!user?.user_id) return;
    
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.sessions.list(user.user_id)}`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const filteredSessions = sessions.filter(s => {
    const sessionDate = new Date(s.session_date);
    const matchesSearch = s.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.case_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    
    let matchesTime = true;
    if (timeFilter === 'upcoming') matchesTime = sessionDate >= now;
    if (timeFilter === 'past') matchesTime = sessionDate < now;
    
    return matchesSearch && matchesStatus && matchesTime;
  });

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      in_progress: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
      completed: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      cancelled: 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return colors[status] || colors.scheduled;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    return new Date(a.session_date) - new Date(b.session_date);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <div>
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

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Sessions</h1>
            <p className="text-slate-400">Manage and track all your mediation sessions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/mediator/schedule')}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Schedule Session
            </button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                  <option value="all">All Time</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                >
                  <option value="all">All Status</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading sessions...</p>
          </div>
        ) : sortedSessions.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-12 text-center">
              <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No sessions found</h3>
              <p className="text-slate-400 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'You don\'t have any sessions scheduled'}
              </p>
              <button
                onClick={() => navigate('/mediator/schedule')}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Schedule Your First Session
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedSessions.map((session) => {
              const sessionDate = new Date(session.session_date);
              const isPast = sessionDate < now;
              
              return (
                <Card 
                  key={session.id}
                  className={`bg-slate-800/50 border-slate-700/50 hover:border-teal-500/50 transition-all cursor-pointer ${isPast ? 'opacity-60' : ''}`}
                  onClick={() => {
                    // Navigate to session detail or start session
                    if (session.meeting_link) {
                      window.open(session.meeting_link, '_blank');
                    }
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-white">
                            {session.title || 'Untitled Session'}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(session.status)}`}>
                            {session.status || 'scheduled'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-400" />
                            <span>{formatDate(session.session_date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-teal-400" />
                            <span>{formatTime(session.session_date)} ({session.duration_minutes || 60} min)</span>
                          </div>
                          {session.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-orange-400" />
                              <span>{session.location}</span>
                            </div>
                          )}
                        </div>

                        {session.notes && (
                          <p className="text-sm text-slate-400 mt-3 line-clamp-2">
                            {session.notes}
                          </p>
                        )}
                      </div>
                      
                      {session.meeting_link && !isPast && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(session.meeting_link, '_blank');
                          }}
                          className="ml-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Video className="w-4 h-4" />
                          Join
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{sessions.length}</div>
                <div className="text-sm text-slate-400">Total Sessions</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {sessions.filter(s => new Date(s.session_date) >= now && s.status === 'scheduled').length}
                </div>
                <div className="text-sm text-slate-400">Upcoming</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-lime-400">
                  {sessions.filter(s => s.status === 'completed').length}
                </div>
                <div className="text-sm text-slate-400">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-400">
                  {sessions.filter(s => s.status === 'cancelled').length}
                </div>
                <div className="text-sm text-slate-400">Cancelled</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
