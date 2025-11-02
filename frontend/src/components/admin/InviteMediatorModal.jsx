import React, { useState } from 'react';
import { X, Mail, Loader, CheckCircle, UserPlus } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

export default function InviteMediatorModal({ isOpen, onClose, organizationId, organizationName, onInviteSent }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    role: 'mediator',
    message: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      if (!formData.email || !formData.email.includes('@')) {
        throw new Error('Valid email is required');
      }

      const payload = {
        email: formData.email.trim(),
        role: formData.role,
        message: formData.message.trim()
      };

      await apiFetch(`/api/organizations/${organizationId}/invite`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setSuccess(true);
      
      if (onInviteSent) {
        onInviteSent();
      }
      
      // Close after brief success message
      setTimeout(() => {
        resetForm();
        onClose();
      }, 2000);
      
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError(err.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      role: 'mediator',
      message: ''
    });
    setError('');
    setSuccess(false);
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <UserPlus className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Invite User</h2>
              <p className="text-sm text-slate-400">{organizationName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 flex items-start gap-3">
              <span className="text-red-400 mt-0.5">⚠️</span>
              <div>
                <div className="font-semibold">Error</div>
                <div className="text-sm">{error}</div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 flex items-center gap-3">
              <CheckCircle className="w-5 h-5" />
              <span>Invitation sent successfully!</span>
            </div>
          )}

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="mediator@example.com"
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                disabled={loading || success}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              An invitation email will be sent to this address
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Role *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'mediator', label: 'Mediator', desc: 'Manages cases and sessions' },
                { value: 'lawyer', label: 'Lawyer', desc: 'Represents clients' }
              ].map(role => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: role.value })}
                  disabled={loading || success}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${formData.role === role.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-900/30 hover:border-slate-600'
                    }
                    disabled:opacity-50
                  `}
                >
                  <div className="font-semibold text-white">{role.label}</div>
                  <div className="text-xs text-slate-400 mt-1">{role.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Personal Message */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Personal Message (Optional)
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Welcome to our team! We're excited to have you join us."
              rows={4}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              disabled={loading || success}
            />
            <p className="mt-1 text-xs text-slate-500">
              This message will be included in the invitation email
            </p>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-slate-300">
            <div className="flex items-start gap-3">
              <span className="text-lg">ℹ️</span>
              <div>
                <div className="font-semibold mb-1">What happens next?</div>
                <ul className="space-y-1 text-slate-400">
                  <li>• An email invitation will be sent to the provided address</li>
                  <li>• The recipient will have 7 days to accept the invitation</li>
                  <li>• They'll create their account and set a password</li>
                  <li>• Once accepted, they'll have access to the platform</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Sent!
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
