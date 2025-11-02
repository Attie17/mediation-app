import React, { useState, useEffect } from 'react';
import { X, Building2, Loader, CheckCircle } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

const SUBSCRIPTION_TIERS = [
  { value: 'free', label: 'Free', description: 'Up to 5 users, 10 cases' },
  { value: 'basic', label: 'Basic', description: 'Up to 20 users, 50 cases' },
  { value: 'pro', label: 'Pro', description: 'Up to 100 users, unlimited cases' },
  { value: 'enterprise', label: 'Enterprise', description: 'Unlimited users & cases' }
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' }
];

const STATUS_STYLES = {
  active: {
    activeContainer: 'border-green-500 bg-green-500/10',
    radio: 'text-green-500 focus:ring-green-500'
  },
  inactive: {
    activeContainer: 'border-yellow-500 bg-yellow-500/10',
    radio: 'text-yellow-500 focus:ring-yellow-500'
  },
  suspended: {
    activeContainer: 'border-red-500 bg-red-500/10',
    radio: 'text-red-500 focus:ring-red-500'
  }
};

const INACTIVE_STATUS_CLASSES = 'border-slate-700 hover:border-slate-600 bg-slate-900/30';

export default function EditOrganizationModal({ isOpen, onClose, organization, onOrganizationUpdated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    email: '',
    phone: '',
    subscription_tier: 'basic',
    status: 'active',
    address: '',
    website: '',
    tagline: '',
    primary_color: '#3b82f6',
    secondary_color: '#10b981',
    logo_url: ''
  });

  // Pre-populate form when organization changes
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || '',
        display_name: organization.display_name || '',
        email: organization.email || '',
        phone: organization.phone || '',
        subscription_tier: organization.subscription_tier || 'basic',
        status: organization.status || 'active',
        address: organization.address || '',
        website: organization.website || '',
        tagline: organization.tagline || '',
        primary_color: organization.primary_color || '#3b82f6',
        secondary_color: organization.secondary_color || '#10b981',
        logo_url: organization.logo_url || ''
      });
    }
  }, [organization]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      if (!organization?.id) {
        throw new Error('No organization ID provided');
      }

      // Build payload
      const payload = {
        name: formData.name.trim(),
        display_name: formData.display_name.trim() || formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        subscription_tier: formData.subscription_tier,
        status: formData.status,
        address: formData.address.trim() || null,
        website: formData.website.trim() || null,
        tagline: formData.tagline.trim() || null,
        primary_color: formData.primary_color || '#3b82f6',
        secondary_color: formData.secondary_color || '#10b981',
        logo_url: formData.logo_url.trim() || null
      };

      const data = await apiFetch(`/api/organizations/${organization.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      // Success!
      setSuccess(true);
      
      if (onOrganizationUpdated) {
        onOrganizationUpdated(data.organization);
      }
      
      // Close after brief success message
      setTimeout(() => {
        setError('');
        setSuccess(false);
        onClose();
      }, 1500);
      
    } catch (err) {
      console.error('Error updating organization:', err);
      setError(err.message || 'Failed to update organization');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Edit Organization</h2>
              <p className="text-sm text-slate-400">Update organization details</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-400 text-sm font-medium">Organization updated successfully!</p>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Johannesburg Family Mediation"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                disabled={loading || success}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="e.g., JHB Family Mediation Services"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                disabled={loading || success}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="contact@organization.com"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  disabled={loading || success}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+27 11 123 4567"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  disabled={loading || success}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street, Johannesburg, 2000"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                disabled={loading || success}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.organization.com"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                disabled={loading || success}
              />
            </div>
          </div>

          {/* Branding Section */}
          <div className="space-y-4 bg-slate-800/30 p-4 rounded-lg border border-slate-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-400" />
              White-Label Branding
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Professional Divorce Mediation Services"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                disabled={loading || success}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Logo URL
              </label>
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                disabled={loading || success}
              />
              {formData.logo_url && (
                <div className="mt-2">
                  <img 
                    src={formData.logo_url} 
                    alt="Logo preview" 
                    className="h-12 object-contain"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-16 h-10 bg-slate-900/50 border border-slate-700 rounded cursor-pointer"
                    disabled={loading || success}
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    placeholder="#3b82f6"
                    className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    disabled={loading || success}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Secondary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="w-16 h-10 bg-slate-900/50 border border-slate-700 rounded cursor-pointer"
                    disabled={loading || success}
                  />
                  <input
                    type="text"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    placeholder="#10b981"
                    className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    disabled={loading || success}
                  />
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 bg-slate-900/30 p-3 rounded border border-slate-700">
              <strong>Note:</strong> These branding settings will be applied when mediators and divorcees from this organization use the platform.
            </div>
          </div>

          {/* Subscription & Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Subscription & Status</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Subscription Tier *
              </label>
              <div className="space-y-2">
                {SUBSCRIPTION_TIERS.map((tier) => (
                  <label
                    key={tier.value}
                    className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.subscription_tier === tier.value
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 hover:border-slate-600 bg-slate-900/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="subscription_tier"
                      value={tier.value}
                      checked={formData.subscription_tier === tier.value}
                      onChange={(e) => setFormData({ ...formData, subscription_tier: e.target.value })}
                      className="mt-1 text-blue-500 focus:ring-blue-500"
                      disabled={loading || success}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{tier.label}</span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{tier.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Status *
              </label>
              <div className="flex gap-3">
                {STATUS_OPTIONS.map((status) => {
                  const styles = STATUS_STYLES[status.value] || STATUS_STYLES.active;
                  const isSelected = formData.status === status.value;

                  return (
                    <label
                      key={status.value}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                        isSelected ? styles.activeContainer : INACTIVE_STATUS_CLASSES
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status.value}
                        checked={isSelected}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className={styles.radio}
                        disabled={loading || success}
                      />
                    <span className="text-white font-medium">{status.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              disabled={loading || success}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {success ? 'Updated!' : loading ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
