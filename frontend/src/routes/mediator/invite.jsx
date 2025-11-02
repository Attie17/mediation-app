import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardFrame from '../../components/DashboardFrame';
import { Card, CardHeader, CardTitle, CardContent, CardDecoration } from '../../components/ui/card-enhanced';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders } from '../../config/api';
import { UserPlus, Mail, Send, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import AIInsightsPanel from '../../components/ai/AIInsightsPanel';

export default function InviteParticipants() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    caseId: '',
    role: 'divorcee',
    message: ''
  });

  useEffect(() => {
    fetchCases();
  }, [user]);

  const fetchCases = async () => {
    if (!user?.user_id) return;
    
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.cases.list(user.user_id)}`, { headers });
      const data = await response.json();
      
      if (data.cases) {
        setCases(data.cases);
        // Auto-select first case if available
        if (data.cases.length > 0 && !formData.caseId) {
          setFormData(prev => ({ ...prev, caseId: data.cases[0].id }));
        }
      }
    } catch (err) {
      console.error('Error fetching cases:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.cases.invite(formData.caseId)}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          role: formData.role,
          message: formData.message || undefined
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Reset form
        setFormData({
          email: '',
          name: '',
          caseId: formData.caseId, // Keep the case selected
          role: 'divorcee',
          message: ''
        });
        
        // Hide success message after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(data.error?.message || 'Failed to send invitation');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Invite error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <DashboardFrame title="Invite Participants">
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

      <div className="max-w-3xl mx-auto">
        <Card gradient>
          <CardDecoration color="teal" />
          <CardHeader icon={<UserPlus className="w-5 h-5 text-teal-400" />}>
            <CardTitle>Send Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            {success && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-green-300">Invitation Sent!</div>
                  <div className="text-sm text-green-400/80 mt-1">
                    An invitation email has been sent to {formData.email}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-red-300">Error</div>
                  <div className="text-sm text-red-400/80 mt-1">{error}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Case Selection */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Select Case *
                </label>
                <select
                  name="caseId"
                  value={formData.caseId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg 
                    text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Choose a case...</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.title || c.description || `Case #${c.id.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Participant Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., John Smith"
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg 
                    text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="participant@example.com"
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg 
                      text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Role *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'divorcee' }))}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.role === 'divorcee'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-medium">Divorcee</div>
                    <div className="text-xs opacity-70 mt-1">Party to the divorce</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: 'lawyer' }))}
                    className={`px-4 py-3 rounded-lg border-2 transition-all ${
                      formData.role === 'lawyer'
                        ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="font-medium">Lawyer</div>
                    <div className="text-xs opacity-70 mt-1">Legal representative</div>
                  </button>
                </div>
              </div>

              {/* Optional Message */}
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Personal Message (Optional)
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Add a personal message to the invitation email..."
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg 
                    text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading || !formData.email || !formData.name || !formData.caseId}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white font-medium rounded-lg
                    hover:from-teal-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Invitation
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 bg-slate-700 text-white font-medium rounded-lg
                    hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* Help Text */}
            <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg">
              <div className="text-sm text-slate-400">
                <div className="font-medium text-slate-300 mb-2">ℹ️ About Invitations</div>
                <ul className="space-y-1 list-disc list-inside">
                  <li>An email will be sent with a registration link</li>
                  <li>The participant will be automatically added to the case upon registration</li>
                  <li>You can track their progress in the Case Workspace</li>
                  <li>Lawyers will have access to case documents and communication</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardFrame>
  );
}
