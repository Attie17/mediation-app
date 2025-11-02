import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, UserPlus, Send, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDecoration } from '../../components/ui/card-enhanced';
import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders } from '../../config/api';
import showToast from '../../utils/toast';

export default function InviteUserPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    role: 'divorcee',
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setMessage(null);
      
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.admin.invite}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        showToast.success(`Invitation sent successfully to ${formData.email}!`);
        // Reset form
        setFormData({ email: '', role: 'divorcee', name: '' });
        // Navigate back after 2 seconds
        setTimeout(() => navigate('/admin'), 2000);
      } else {
        const errorMsg = data.error || 'Failed to send invitation';
        setMessage({ type: 'error', text: errorMsg });
        showToast.error(errorMsg);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      const errorMsg = 'Network error. Please try again.';
      setMessage({ type: 'error', text: errorMsg });
      showToast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/admin')}
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
        <div className="mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Invite User</h1>
            <p className="text-slate-400">Send an invitation email to a new user</p>
          </div>
        </div>

        {/* Invite Form */}
        <Card gradient>
          <CardDecoration color="teal" />
          <CardHeader icon={<Mail className="w-5 h-5 text-teal-400" />}>
            <CardTitle>User Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            {message && (
              <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-300' : 'bg-red-500/20 border border-red-500/30 text-red-300'}`}>
                {message.text}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-slate-700/50 border border-slate-600 text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="divorcee">Divorcee</option>
                  <option value="mediator">Mediator</option>
                  <option value="lawyer">Lawyer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  loading 
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-teal-500 to-blue-500 text-white hover:shadow-lg hover:shadow-teal-500/25'
                }`}
              >
                <Send className="w-4 h-4" />
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
