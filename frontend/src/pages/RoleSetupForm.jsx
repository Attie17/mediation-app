// Updated design - modern centered layout
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/apiClient';

const roleFields = {
  lawyer: [
    { name: 'lawFirm', label: 'Law Firm / Practice Name', type: 'text' },
    { name: 'regNumber', label: 'Registration Number (Law Society)', type: 'text' },
    { name: 'officeAddress', label: 'Office Address', type: 'text' },
    { name: 'clientPref', label: 'Client Management Preference', type: 'text' },
    { name: 'supportDocs', label: 'Upload Supporting Documents', type: 'file', optional: true }
  ],
  mediator: [
    { name: 'accreditation', label: 'Accreditation Number / Professional Body', type: 'text' },
    { name: 'experience', label: 'Years of Experience', type: 'number' },
    { name: 'specialization', label: 'Specialization', type: 'text' },
    { name: 'availability', label: 'Availability Calendar / Working Hours', type: 'text' },
    { name: 'mediationPref', label: 'Office or Online Mediation Preference', type: 'text' },
    { name: 'supportDocs', label: 'Upload Supporting Documents', type: 'file', optional: true }
  ],
  divorcee: [
    { name: 'dob', label: 'Date of Birth', type: 'date' },
    { name: 'address', label: 'Residential Address', type: 'text' },
    { name: 'spouseName', label: "Spouse's Name", type: 'text', optional: true },
    { name: 'caseRef', label: 'Case Reference', type: 'text', optional: true },
    { name: 'language', label: 'Preferred Language', type: 'text' },
    { name: 'children', label: 'Children Involved?', type: 'number', optional: true }
  ],
  admin: [
    { name: 'orgName', label: 'Organization Name', type: 'text' },
    { name: 'roleDesc', label: 'Role Description', type: 'text' },
    { name: 'permissions', label: 'Permissions Setup', type: 'checkbox', options: ['Manage Users', 'Manage Cases', 'View Reports', 'Billing'] }
  ]
};

const defaultRoleMeta = {
  title: 'Role Setup',
  tagline: 'Tell us a bit more about how you work so we can personalize your experience.',
  highlights: [
    'Keep your profile information in sync',
    'Unlock smart guidance tailored to your role',
    'Collaborate with your team in one workspace'
  ],
  nextStep: {
    title: 'Explore your dashboard',
    description: 'Once you save we’ll pull up the dashboard where tips and checklists guide you through what comes next.',
    takeaways: [
      'See your tasks and documents in one place',
      'Stay aware of deadlines and follow-ups',
      'Collaborate with mediators and participants'
    ]
  }
};

const roleMeta = {
  divorcee: {
    title: 'Divorcee Setup',
    tagline: 'Share a few details so we can tailor the mediation journey to your family’s needs.',
    highlights: [
      'Securely connect the right mediator',
      'Track document progress in real time',
      'Receive timely guidance at every step'
    ],
    nextStep: {
      title: 'Review your case dashboard',
      description: 'We’ll guide you to the dashboard where you can see your action plan, upload supporting documents, and monitor case milestones.',
      takeaways: [
        'See the checklist of documents to prepare',
        'Understand what happens after your submission',
        'Message your mediator or support team directly'
      ]
    }
  },
  mediator: {
    title: 'Mediator Profile',
    tagline: 'Help parties understand your expertise and availability before mediation begins.',
    highlights: [
      'Showcase credentials and experience',
      'Publish your availability preferences',
      'Receive well-matched case requests'
    ],
    nextStep: {
      title: 'Activate your case workspace',
      description: 'After saving we steer you to the mediator dashboard to review upcoming sessions, confirm availability, and contact assigned parties.',
      takeaways: [
        'View every case on a single timeline',
        'Share preparation notes with participants',
        'Schedule or confirm mediation sessions'
      ]
    }
  },
  lawyer: {
    title: 'Legal Partner Profile',
    tagline: 'Your professional details help us coordinate seamlessly with clients and mediators.',
    highlights: [
      'Clarify your practice focus areas',
      'Manage client expectations ahead of sessions',
      'Collaborate securely across the platform'
    ],
    nextStep: {
      title: 'Connect to client cases',
      description: 'Once you save we open the lawyer dashboard so you can link active matters, upload filings, and monitor mediation progress.',
      takeaways: [
        'Review case summaries at a glance',
        'Share legal documents securely',
        'Track outcomes and required follow-ups'
      ]
    }
  },
  admin: {
    title: 'Organization Setup',
    tagline: 'Configure the controls and visibility your team needs to run mediation operations.',
    highlights: [
      'Delegate responsibilities with confidence',
      'Monitor activity across cases in one view',
      'Keep sensitive information access-controlled'
    ],
    nextStep: {
      title: 'Tailor your organization workspace',
      description: 'We’ll take you straight to the admin console to invite team members, assign permissions, and finalize branding.',
      takeaways: [
        'Control who can access sensitive cases',
        'Set up reusable templates and reminders',
        'Manage billing and organization preferences'
      ]
    }
  }
};

const RoleSetupForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refreshMe } = useAuth();
  const params = new URLSearchParams(location.search);
  const urlRole = params.get('role');

  const role = React.useMemo(() => {
    if (urlRole && roleFields[urlRole]) {
      return urlRole;
    }
    if (user?.role && roleFields[user.role]) {
      return user.role;
    }
    return 'divorcee';
  }, [urlRole, user?.role]);
  
  // Initialize form with default date for dob field
  const getDefaultDate = () => {
    const today = new Date();
    // Default to 30 years ago for divorcee DOB
    today.setFullYear(today.getFullYear() - 30);
    return today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  };
  
  const [form, setForm] = useState({
    dob: role === 'divorcee' ? getDefaultDate() : ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fields = roleFields[role] || [];
  const { title, tagline, highlights, nextStep } = roleMeta[role] || defaultRoleMeta;
  const nextStepInfo = nextStep || defaultRoleMeta.nextStep;

  const handleChange = e => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setForm({ ...form, [name]: checked });
    } else if (type === 'file') {
      const fileLabel = value || files?.[0]?.name || '';
      setForm({ ...form, [name]: fileLabel });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const normalizedAddress = (() => {
        if (role === 'lawyer' && form.officeAddress) return { street: form.officeAddress.trim() };
        if (form.address) return { street: form.address.trim() };
        return undefined;
      })();

      const baseProfile = {
        role,
        ...(normalizedAddress ? { address: normalizedAddress } : {}),
        ...(role === 'lawyer' && form.lawFirm ? { name: form.lawFirm.trim() } : {}),
      };

      const sanitizedProfile = Object.fromEntries(
        Object.entries(baseProfile).filter(([, value]) => value !== undefined && value !== null && value !== '')
      );

      const payload = {
        ...sanitizedProfile,
        profileDetails: {
          role,
          submittedAt: new Date().toISOString(),
          ...form,
        },
      };

      console.log('[RoleSetupForm] Saving profile', { role, payload });

      const response = await apiFetch('/api/users/profile', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      console.log('[RoleSetupForm] Profile saved successfully', response);
      
      // Refresh user data in auth context
      await refreshMe();
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('[RoleSetupForm] Error saving profile:', err);
      const msg = err?.data?.error?.message || err.message || 'Failed to save profile';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 text-3xl shadow-lg">
              {role === 'divorcee' ? '👤' : role === 'lawyer' ? '⚖️' : role === 'mediator' ? '🤝' : '👔'}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{title}</h1>
          <p className="text-lg text-slate-300">{tagline}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 shadow-2xl p-8">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 w-1/2 transition-all" />
              </div>
              <span className="text-sm text-slate-400 font-medium">Step 1 of 2</span>
            </div>
            <p className="text-sm text-slate-400">Complete your profile to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
                {fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    {field.type === 'checkbox' ? (
                      <div>
                        <span className="text-sm font-semibold text-white">{field.label}</span>
                        <div className="mt-3 flex flex-wrap gap-3">
                          {field.options.map((opt) => (
                            <label key={opt} className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-2 text-sm text-slate-200 hover:border-cyan-500 hover:bg-slate-600/50 cursor-pointer transition">
                              <input
                                type="checkbox"
                                name={opt}
                                checked={!!form[opt]}
                                onChange={handleChange}
                                className="accent-cyan-500"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="text-sm font-semibold text-white flex items-center gap-2">
                          {field.label}
                          {field.optional && <span className="text-xs font-normal text-slate-400">Optional</span>}
                        </label>
                        <input
                          name={field.name}
                          type={field.type}
                          value={field.type === 'file' ? undefined : form[field.name] || ''}
                          placeholder={field.label}
                          onChange={handleChange}
                          required={!field.optional}
                          className={`mt-2 w-full rounded-lg border border-slate-600 bg-slate-700/50 px-4 py-3 text-sm text-white placeholder-slate-400 shadow-sm transition focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${
                            field.type === 'date' ? 'pr-10' : ''
                          } ${field.type === 'file' ? 'cursor-pointer border-dashed bg-slate-700 py-7 hover:border-cyan-400 hover:bg-slate-600/50' : ''}`}
                        />
                      </div>
                    )}
                  </div>
                ))}

                {error && (
                  <div className="rounded-lg border border-red-500/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4 text-base font-semibold text-white shadow-lg hover:from-cyan-600 hover:to-blue-600 transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save & Continue →'}
                </button>
              </form>

              <div className="mt-8 rounded-lg border border-slate-700 bg-slate-800/30 px-6 py-5">
                <div className="flex items-start gap-4">
                  <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-sm font-semibold text-white shadow-lg">2</span>
                  <div className="space-y-3 flex-1">
                    <div>
                      <h3 className="text-base font-semibold text-white">{nextStepInfo.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-400">{nextStepInfo.description}</p>
                    </div>
                    <ul className="space-y-2 text-sm text-slate-300">
                      {nextStepInfo.takeaways.map((point) => (
                        <li key={point} className="flex items-start gap-2">
                          <span className="mt-1.5 inline-flex h-1.5 w-1.5 flex-none rounded-full bg-cyan-400" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSetupForm;
