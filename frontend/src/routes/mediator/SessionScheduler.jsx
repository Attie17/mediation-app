import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardFrame from '../../components/DashboardFrame';
import { Card, CardHeader, CardTitle, CardContent, CardDecoration } from '../../components/ui/card-enhanced';
import { EmptyState } from '../../components/ui/empty-state';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders } from '../../config/api';
import AIInsightsPanel from '../../components/ai/AIInsightsPanel';
import showToast from '../../utils/toast';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Users,
  MapPin,
  X,
  Bell,
  ArrowLeft
} from 'lucide-react';

export default function SessionScheduler() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMode, setModalMode] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [sendingReminderId, setSendingReminderId] = useState(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const userId = user?.user_id || user?.id;

      if (!userId) {
        console.error('No user ID available');
        setSessions([]);
        return;
      }

      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.sessions.list(userId)}`, {
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      if (data.ok && data.sessions) {
        setSessions(data.sessions.all || []);
      } else {
        setSessions([]);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const upcomingSessions = sessions.filter((session) => {
    const sessionDateTime = new Date(`${session.session_date}T${session.session_time}`);
    return sessionDateTime >= new Date();
  });

  const pastSessions = sessions.filter((session) => {
    const sessionDateTime = new Date(`${session.session_date}T${session.session_time}`);
    return sessionDateTime < new Date();
  });

  const openCreateModal = () => {
    setActiveSession(null);
    setModalMode('create');
  };

  const openEditModal = (session) => {
    setActiveSession(session);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setActiveSession(null);
  };

  const handleCancelSession = async (session) => {
    if (!session) return;
    if (!window.confirm('Are you sure you want to cancel this session?')) return;

    try {
      setCancelingId(session.id);
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.sessions.delete(session.id)}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to cancel session');
      }

      showToast.success('Session cancelled successfully');
      await fetchSessions();
    } catch (err) {
      console.error('Error cancelling session:', err);
      showToast.error(err.message || 'Failed to cancel session');
    } finally {
      setCancelingId(null);
    }
  };

  const handleSendReminder = async (session) => {
    if (!session) return;
    if (!window.confirm(`Send reminder to all participants for "${session.title}"?`)) return;

    try {
      setSendingReminderId(session.id);
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/api/sessions/${session.id}/send-reminder`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send reminder');
      }

      const data = await response.json();
      showToast.success(`Reminder sent successfully to ${data.recipientCount || 0} participant(s)`);
      await fetchSessions();
    } catch (err) {
      console.error('Error sending reminder:', err);
      showToast.error(err.message || 'Failed to send reminder');
    } finally {
      setSendingReminderId(null);
    }
  };

  const handleFormSuccess = () => {
    closeModal();
    fetchSessions();
  };

  return (
    <DashboardFrame title="Session Scheduler">
      <div className="space-y-6">
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
            <h1 className="text-3xl font-bold text-slate-100 mb-2">
              Session Scheduler
            </h1>
            <p className="text-slate-400">
              Manage mediation sessions and appointments
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 hover:shadow-lg text-white font-medium transition-all"
          >
            <Plus className="w-5 h-5" />
            Schedule Session
          </button>
        </div>

        {/* Upcoming Sessions */}
        <Card gradient>
          <CardDecoration color="teal" />
          <CardHeader icon={<CalendarIcon className="w-5 h-5 text-teal-400" />}>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-slate-400">Loading sessions...</div>
            ) : upcomingSessions.length === 0 ? (
              <EmptyState
                icon={<CalendarIcon />}
                title="No Upcoming Sessions"
                description="Schedule a new session to get started"
              />
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onEdit={openEditModal}
                    onCancel={handleCancelSession}
                    onSendReminder={handleSendReminder}
                    isProcessing={cancelingId === session.id}
                    isSendingReminder={sendingReminderId === session.id}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Sessions */}
        {pastSessions.length > 0 && (
          <Card gradient>
            <CardDecoration color="slate" />
            <CardHeader icon={<Clock className="w-5 h-5 text-slate-400" />}>
              <CardTitle>Past Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pastSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isPast
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate('/mediator')}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Create Session Modal */}
      {modalMode && (
        <SessionFormModal
          mode={modalMode}
          initialSession={activeSession}
          onClose={closeModal}
          onSuccess={handleFormSuccess}
        />
      )}
    </DashboardFrame>
  );
}

function SessionCard({ session, isPast = false, onEdit, onCancel, isProcessing = false, onSendReminder, isSendingReminder = false }) {
  const sessionDateTime = new Date(`${session.session_date}T${session.session_time}`);
  const dateStr = sessionDateTime.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  const timeStr = sessionDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={`p-4 rounded-lg ${isPast ? 'bg-white/5 opacity-60' : 'bg-white/10'} hover:bg-white/15 transition-colors`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-white mb-2">{session.title}</h4>
          <div className="space-y-1 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{timeStr} ({session.duration_minutes || '60'} min)</span>
            </div>
            {session.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{session.location}</span>
              </div>
            )}
            {session.participants && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{session.participants.length} participants</span>
              </div>
            )}
            {session.status && (
              <div className="mt-2 flex items-center gap-2">
                <span className={`inline-block px-2 py-1 text-xs rounded ${
                  session.status === 'scheduled' ? 'bg-green-500/20 text-green-400' :
                  session.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                  session.status === 'completed' ? 'bg-slate-500/20 text-slate-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {session.status.replace('_', ' ').toUpperCase()}
                </span>
                {session.reminder_sent && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-purple-500/20 text-purple-400">
                    <Bell className="w-3 h-3" />
                    Reminder sent {session.reminder_count > 1 ? `(${session.reminder_count}x)` : ''}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        {!isPast && session.status !== 'cancelled' && (
          <div className="flex gap-2">
            <button 
              onClick={() => onSendReminder?.(session)}
              disabled={isSendingReminder}
              className="px-3 py-1 text-xs rounded bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors flex items-center gap-1 disabled:opacity-50"
              title="Send reminder to participants"
            >
              <Bell className="w-3 h-3" />
              {isSendingReminder ? 'Sending...' : 'Remind'}
            </button>
            <button 
              onClick={() => onEdit?.(session)}
              className="px-3 py-1 text-xs rounded bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors flex items-center gap-1"
            >
              <CalendarIcon className="w-3 h-3" />
              Reschedule
            </button>
            <button 
              onClick={() => onCancel?.(session)}
              disabled={isProcessing}
              className="px-3 py-1 text-xs rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              {isProcessing ? 'Cancelling...' : 'Cancel'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SessionFormModal({ mode = 'create', initialSession = null, onClose, onSuccess }) {
  const isEdit = mode === 'edit';
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    duration: '60',
    location: '',
    caseId: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEdit && initialSession) {
      const timeValue = initialSession.session_time || '';
      setFormData({
        title: initialSession.title || '',
        date: initialSession.session_date || '',
        time: timeValue.length > 5 ? timeValue.slice(0, 5) : timeValue,
        duration: String(initialSession.duration_minutes || 60),
        location: initialSession.location || '',
        caseId: initialSession.case_id ? String(initialSession.case_id) : '',
        notes: initialSession.notes || ''
      });
    } else {
      setFormData({
        title: '',
        date: '',
        time: '',
        duration: '60',
        location: '',
        caseId: '',
        notes: ''
      });
    }
  }, [isEdit, initialSession]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.title || !formData.date || !formData.time) {
      setError('Title, date, and time are required');
      return;
    }

    const headers = getAuthHeaders();
    const durationMinutes = Number.parseInt(formData.duration, 10);
    const normalizedDuration = Number.isFinite(durationMinutes) ? durationMinutes : 60;
    const payloadBase = {
      location: formData.location.trim() || null,
      notes: formData.notes.trim() || null,
      case_id: formData.caseId.trim() || null
    };

    try {
      setLoading(true);
      setError(null);

      if (isEdit && initialSession) {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.sessions.update(initialSession.id)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            title: formData.title,
            session_date: formData.date,
            session_time: formData.time,
            duration_minutes: normalizedDuration,
            ...payloadBase
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to update session');
        }
      } else {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.sessions.create}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: formData.title,
            date: formData.date,
            time: formData.time,
            duration: normalizedDuration,
            ...payloadBase
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create session');
        }

        showToast.success(isEdit ? 'Session updated successfully!' : 'Session created successfully!');
      }

      onSuccess();
    } catch (err) {
      console.error('Error submitting session form:', err);
      setError(err.message || 'Something went wrong');
      showToast.error(err.message || 'Failed to save session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border border-white/10 p-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-teal-500/20">
            <CalendarIcon className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isEdit ? 'Reschedule Session' : 'Schedule Session'}
            </h2>
            <p className="text-sm text-slate-400">
              {isEdit ? 'Update session date, time, and details' : 'Create a new mediation session'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Session Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="Initial mediation session"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                min={isEdit ? undefined : new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Time *
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Duration (minutes)
            </label>
            <select
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Location (Optional)
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Video call / Office address"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Related Case (Optional)
            </label>
            <input
              type="text"
              name="caseId"
              value={formData.caseId}
              onChange={handleChange}
              placeholder="Case ID (UUID)"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Agenda items, preparation notes..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-teal-500 to-blue-500 hover:shadow-lg text-white font-medium transition-all disabled:opacity-50"
            >
              {loading ? (isEdit ? 'Rescheduling...' : 'Creating...') : (isEdit ? 'Reschedule Session' : 'Create Session')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
