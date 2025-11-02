import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/apiClient';

const roleConfig = {
  admin: {
    title: 'Administrator Setup',
    emoji: '👤',
    color: 'cyan',
    tagline: 'Manage and oversee all mediation activities',
    fields: []
  },
  mediator: {
    title: 'Mediator Profile',
    emoji: '⚖️',
    color: 'emerald',
    tagline: 'Help families find peaceful resolutions',
    fields: [
      { name: 'licenseNumber', label: 'License Number', type: 'text', required: true },
      { name: 'specialization', label: 'Specialization', type: 'text', required: false },
      { name: 'yearsExperience', label: 'Years of Experience', type: 'number', required: false },
    ]
  },
  lawyer: {
    title: 'Lawyer Profile',
    emoji: '💼',
    color: 'blue',
    tagline: 'Provide expert legal guidance',
    fields: [
      { name: 'barNumber', label: 'Bar Number', type: 'text', required: true },
      { name: 'lawFirm', label: 'Law Firm', type: 'text', required: false },
      { name: 'practiceAreas', label: 'Practice Areas', type: 'text', required: false },
    ]
  },
  divorcee: {
    title: 'Welcome to Your Mediation Journey',
    emoji: '💙',
    color: 'rose',
    tagline: 'We\'re here to support you through this transition',
    fields: [
      { name: 'caseNumber', label: 'Case Number (if available)', type: 'text', required: false },
      { name: 'preferredContactMethod', label: 'Preferred Contact Method', type: 'select', 
        options: ['Email', 'Phone', 'Text'], required: false },
    ]
  }
};

export default function RoleSetupNew() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'divorcee';
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    ...Object.fromEntries(
      roleConfig[role]?.fields.map(field => [field.name, '']) || []
    )
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const config = roleConfig[role] || roleConfig.divorcee;

  useEffect(() => {
    if (user?.firstName) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if user is authenticated
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('You must be logged in to save your profile. Please sign in first.');
        setLoading(false);
        return;
      }

      // Combine first and last name
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      
      // Prepare payload matching backend expectations
      const payload = {
        name: fullName,
        phone: formData.phone || undefined,
        role,
        profileDetails: {
          role,
          submittedAt: new Date().toISOString(),
          ...formData
        }
      };

      await apiFetch('/api/users/profile', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const dashboardRoutes = {
        admin: '/admin',
        mediator: '/mediator',
        lawyer: '/lawyer',
        divorcee: '/divorcee'
      };
      
      navigate(dashboardRoutes[role] || '/divorcee');
    } catch (err) {
      setError(err.message || 'Failed to save profile');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 text-3xl">
              {config.emoji}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {config.title}
            </h1>
            <p className="text-slate-400 text-lg">
              {config.tagline}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-400">Step {step} of 2</span>
              <span className="text-sm font-medium text-cyan-400">{step === 1 ? 'Basic Info' : 'Role Details'}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                    placeholder="(555) 123-4567"
                  />
                </div>

                {config.fields.length === 0 ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Complete Setup ✓'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-3 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center group"
                  >
                    Continue →
                  </button>
                )}
              </div>
            )}

            {step === 2 && config.fields.length > 0 && (
              <div className="space-y-4">
                {config.fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {field.label} {field.required && '*'}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        required={field.required}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select...</option>
                        {field.options?.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        required={field.required}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Saving...' : 'Complete Setup ✓'}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </form>

        </div>
      </div>
    </div>
  );
}
