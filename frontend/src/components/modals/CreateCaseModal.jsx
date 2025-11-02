import React, { useState } from 'react';
import { X, Plus, Users, FileText, AlertCircle } from 'lucide-react';
import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders } from '../../config/api';
import showToast from '../../utils/toast';

export default function CreateCaseModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    participantEmail: '',
    participantName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();
      
      // Create the case
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.cases.create}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          status: formData.status
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create case');
      }

      const data = await response.json();
      const caseId = data.case?.id || data.id;

      // If participant email provided, send invitation
      if (formData.participantEmail && caseId) {
        try {
          await fetch(`${API_BASE_URL}${API_ENDPOINTS.cases.invite(caseId)}`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              email: formData.participantEmail,
              name: formData.participantName,
              role: 'divorcee'
            })
          });
          showToast.success('Case created and invitation sent!');
        } catch (inviteErr) {
          console.warn('Failed to send participant invitation:', inviteErr);
          showToast.success('Case created, but failed to send invitation');
        }
      } else {
        showToast.success('Case created successfully!');
      }

      // Reset form and close
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        participantEmail: '',
        participantName: ''
      });
      
      if (onSuccess) {
        onSuccess(data);
      }
      onClose();
      
    } catch (err) {
      console.error('Error creating case:', err);
      setError(err.message);
      showToast.error(err.message || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        participantEmail: '',
        participantName: ''
      });
      setError(null);
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg shadow-2xl max-w-2xl w-full border border-slate-700 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/20 rounded-lg">
                <Plus className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Create New Case</h2>
                <p className="text-sm text-slate-400 mt-1">Start a new mediation case</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Case Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                Case Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Case Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Smith vs. Smith Divorce Mediation"
                  className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description <span className="text-slate-500">(Optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the case..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Initial Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>
            </div>

            {/* Participant Information (Optional) */}
            <div className="space-y-4 pt-4 border-t border-slate-700">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-400" />
                Add Initial Participant <span className="text-slate-500 font-normal">(Optional)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Participant Name
                  </label>
                  <input
                    type="text"
                    value={formData.participantName}
                    onChange={(e) => setFormData({ ...formData, participantName: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Participant Email
                  </label>
                  <input
                    type="email"
                    value={formData.participantEmail}
                    onChange={(e) => setFormData({ ...formData, participantEmail: e.target.value })}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <p className="text-xs text-slate-500">
                You can add more participants after creating the case
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Case
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
