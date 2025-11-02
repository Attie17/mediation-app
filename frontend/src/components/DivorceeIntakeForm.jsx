import React, { useState, useEffect } from 'react';

const STEPS = [
  'Case Details',
  'Personal Info',
  'Marriage Details',
  'Children',
  'Financial Situation',
  'Preferences / Concerns',
  'Summary'
];

const initialState = {
  caseInfo: { title: '', description: '' },
  personal: { name: '', dob: '', email: '', phone: '', address: '' },
  marriage: { marriageDate: '', separationDate: '', place: '' },
  children: [],
  financial: {
    employment: '',
    income: '',
    expenses: '',
    assets: '',
    debts: '',
    uploads: {
      incomeProof: null,
      bankStatement: null
    }
  },
  preferences: { custody: '', concerns: '', notes: '' }
};

const custodyOptions = [
  'No Preference',
  'Sole Custody',
  'Joint Custody',
  'Other'
];

function DivorceeIntakeForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => {
    const draft = localStorage.getItem('divorceeIntakeDraft');
    return draft ? JSON.parse(draft) : initialState;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validation, setValidation] = useState({});

  // Save draft to localStorage on every step change
  useEffect(() => {
    localStorage.setItem('divorceeIntakeDraft', JSON.stringify(form));
  }, [form, step]);

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('divorceeIntakeDraft');
    if (draft) setForm(JSON.parse(draft));
  }, []);

  // Navigation
  const next = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  // Field change helpers
  const handleChange = (section, field, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };
  const handleChildChange = (idx, field, value) => {
    setForm((prev) => {
      const children = [...prev.children];
      children[idx] = { ...children[idx], [field]: value };
      return { ...prev, children };
    });
  };
  const addChild = () => {
    setForm((prev) => ({ ...prev, children: [...prev.children, { name: '', birthdate: '', notes: '' }] }));
  };
  const removeChild = (idx) => {
    setForm((prev) => {
      const children = prev.children.filter((_, i) => i !== idx);
      return { ...prev, children };
    });
  };

  // File upload
  const handleFileUpload = async (field, file) => {
    const data = new FormData();
    data.append('file', file);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/uploads/file', {
        method: 'POST',
        body: data
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Upload failed');
      setForm((prev) => ({
        ...prev,
        financial: {
          ...prev.financial,
          uploads: {
            ...prev.financial.uploads,
            [field]: result
          }
        }
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Validation per step
  const validateStep = () => {
    let valid = true;
    let v = {};
    if (step === 0) {
      const { title } = form.caseInfo;
      if (!title) { v.title = 'Required'; valid = false; }
    }
    if (step === 1) {
      const { name, dob, email, phone, address } = form.personal;
      if (!name) { v.name = 'Required'; valid = false; }
      if (!dob) { v.dob = 'Required'; valid = false; }
      if (!email) { v.email = 'Required'; valid = false; }
      if (!phone) { v.phone = 'Required'; valid = false; }
      if (!address) { v.address = 'Required'; valid = false; }
    }
    if (step === 2) {
      const { marriageDate, separationDate, place } = form.marriage;
      if (!marriageDate) { v.marriageDate = 'Required'; valid = false; }
      if (!separationDate) { v.separationDate = 'Required'; valid = false; }
      if (!place) { v.place = 'Required'; valid = false; }
    }
    if (step === 4) {
      const { employment, income, expenses } = form.financial;
      if (!employment) { v.employment = 'Required'; valid = false; }
      if (!income) { v.income = 'Required'; valid = false; }
      if (!expenses) { v.expenses = 'Required'; valid = false; }
    }
    if (step === 5) {
      if (!form.preferences.custody) { v.custody = 'Required'; valid = false; }
    }
    setValidation(v);
    return valid;
  };

  // Final submit
  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // Build payload matching backend POST /api/cases structure
      const payload = {
        title: form.caseInfo.title,
        description: form.caseInfo.description || '',
        personalInfo: {
          name: form.personal.name,
          dateOfBirth: form.personal.dob,
          email: form.personal.email,
          phone: form.personal.phone,
          address: form.personal.address
        },
        marriageDetails: {
          marriageDate: form.marriage.marriageDate,
          separationDate: form.marriage.separationDate,
          place: form.marriage.place
        },
        children: form.children.map(child => ({
          name: child.name,
          birthdate: child.birthdate,
          notes: child.notes || ''
        })),
        financialSituation: {
          employment: form.financial.employment,
          income: form.financial.income,
          expenses: form.financial.expenses,
          assets: form.financial.assets || '',
          debts: form.financial.debts || ''
        },
        preferences: {
          custody: form.preferences.custody,
          concerns: form.preferences.concerns || '',
          notes: form.preferences.notes || ''
        },
        status: 'open'
      };

      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create case');

      // Success
      setSuccess(true);
      localStorage.removeItem('divorceeIntakeDraft');
      setTimeout(() => {
        window.location.href = `/dashboard`;
      }, 1500);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Renderers for each step
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <Input 
              label="Case Title" 
              placeholder="e.g., Smith v. Smith Divorce Mediation"
              value={form.caseInfo.title} 
              onChange={v => handleChange('caseInfo', 'title', v)} 
              error={validation.title} 
            />
            <div>
              <label className="block text-sm font-medium mb-1">Case Description (Optional)</label>
              <textarea
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Brief description of the case..."
                value={form.caseInfo.description || ''}
                onChange={e => handleChange('caseInfo', 'description', e.target.value)}
              />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <Input label="Full Name" value={form.personal.name} onChange={v => handleChange('personal', 'name', v)} error={validation.name} />
            <Input label="Date of Birth" type="date" value={form.personal.dob} onChange={v => handleChange('personal', 'dob', v)} error={validation.dob} />
            <Input label="Email" value={form.personal.email} onChange={v => handleChange('personal', 'email', v)} error={validation.email} />
            <Input label="Phone" value={form.personal.phone} onChange={v => handleChange('personal', 'phone', v)} error={validation.phone} />
            <Input label="Address" value={form.personal.address} onChange={v => handleChange('personal', 'address', v)} error={validation.address} />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <Input label="Date of Marriage" type="date" value={form.marriage.marriageDate} onChange={v => handleChange('marriage', 'marriageDate', v)} error={validation.marriageDate} />
            <Input label="Date of Separation" type="date" value={form.marriage.separationDate} onChange={v => handleChange('marriage', 'separationDate', v)} error={validation.separationDate} />
            <Input label="Place of Marriage" value={form.marriage.place} onChange={v => handleChange('marriage', 'place', v)} error={validation.place} />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            {form.children.map((child, idx) => (
              <div key={idx} className="border rounded p-4 mb-2 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold">Child {idx + 1}</div>
                  <button type="button" className="text-red-500" onClick={() => removeChild(idx)}>Remove</button>
                </div>
                <Input label="Name" value={child.name} onChange={v => handleChildChange(idx, 'name', v)} />
                <Input label="Birthdate" type="date" value={child.birthdate} onChange={v => handleChildChange(idx, 'birthdate', v)} />
                <Input label="Notes" value={child.notes} onChange={v => handleChildChange(idx, 'notes', v)} />
              </div>
            ))}
            <button type="button" className="px-4 py-2 bg-blue-100 rounded" onClick={addChild}>Add Child</button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <Input label="Employment Status" value={form.financial.employment} onChange={v => handleChange('financial', 'employment', v)} error={validation.employment} />
            <Input label="Monthly Income" type="number" value={form.financial.income} onChange={v => handleChange('financial', 'income', v)} error={validation.income} />
            <Input label="Monthly Expenses" type="number" value={form.financial.expenses} onChange={v => handleChange('financial', 'expenses', v)} error={validation.expenses} />
            <Input label="Assets" value={form.financial.assets} onChange={v => handleChange('financial', 'assets', v)} />
            <Input label="Debts" value={form.financial.debts} onChange={v => handleChange('financial', 'debts', v)} />
            <FileUpload label="Proof of Income" file={form.financial.uploads.incomeProof} onUpload={f => handleFileUpload('incomeProof', f)} />
            <FileUpload label="Bank Statement" file={form.financial.uploads.bankStatement} onUpload={f => handleFileUpload('bankStatement', f)} />
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <Select label="Custody Preference" value={form.preferences.custody} options={custodyOptions} onChange={v => handleChange('preferences', 'custody', v)} error={validation.custody} />
            <Input label="Main Concerns" value={form.preferences.concerns} onChange={v => handleChange('preferences', 'concerns', v)} />
            <Input label="Notes" value={form.preferences.notes} onChange={v => handleChange('preferences', 'notes', v)} />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <SummaryCard title="Personal Info" data={form.personal} />
            <SummaryCard title="Marriage Details" data={form.marriage} />
            <SummaryCard title="Children" data={form.children} isList />
            <SummaryCard title="Financial Situation" data={form.financial} uploads={form.financial.uploads} />
            <SummaryCard title="Preferences / Concerns" data={form.preferences} />
            <div className="flex justify-center mt-6">
              <button type="button" className="px-6 py-2 bg-green-600 text-white rounded" onClick={handleSubmit} disabled={loading}>Submit</button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded shadow p-6 mt-8">
      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-2">Step {step + 1} of {STEPS.length}</div>
        <div className="font-bold text-lg">{STEPS[step]}</div>
        <div className="h-2 bg-gray-200 rounded mt-2">
          <div className="h-2 bg-blue-500 rounded" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>
      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-2">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-2 rounded mb-2">Success! Redirecting...</div>}
      {loading && <div className="flex justify-center my-4"><div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500"></div></div>}
      {renderStep()}
      <div className="flex justify-between mt-8">
        <button onClick={back} disabled={step === 0 || loading} className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50">Back</button>
        <button onClick={() => localStorage.setItem('divorceeIntakeDraft', JSON.stringify(form))} className="px-4 py-2 bg-yellow-200 rounded">Save Draft</button>
        {step < STEPS.length - 1 && <button onClick={next} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Next</button>}
      </div>
    </div>
  );
}

// --- Helper Components ---
function Input({ label, value, onChange, type = 'text', error }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        className={`w-full border rounded px-3 py-2 ${error ? 'border-red-400' : 'border-gray-300'}`}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
}

function Select({ label, value, options, onChange, error }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        className={`w-full border rounded px-3 py-2 ${error ? 'border-red-400' : 'border-gray-300'}`}
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">Select...</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
}

function FileUpload({ label, file, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const handleFile = async (e) => {
    setError(null);
    const f = e.target.files[0];
    if (!f) return;
    setUploading(true);
    try {
      await onUpload(f);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input type="file" onChange={handleFile} disabled={uploading} />
      {file && <div className="text-xs text-green-700 mt-1">Uploaded: {file.original_filename || file.filename || 'File'} ✔️</div>}
      {uploading && <div className="text-xs text-blue-700 mt-1">Uploading...</div>}
      {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
    </div>
  );
}

function SummaryCard({ title, data, isList, uploads }) {
  return (
    <div className="bg-gray-50 rounded p-4 mb-2">
      <div className="font-semibold mb-2">{title}</div>
      {isList ? (
        <ul className="list-disc ml-6">
          {Array.isArray(data) && data.length > 0 ? data.map((item, idx) => (
            <li key={idx}>{Object.entries(item).map(([k, v]) => `${k}: ${v}`).join(', ')}</li>
          )) : <li>No data</li>}
        </ul>
      ) : (
        <ul>
          {Object.entries(data).map(([k, v]) => (
            <li key={k}><span className="font-medium">{k}:</span> {typeof v === 'object' && v !== null ? JSON.stringify(v) : v}</li>
          ))}
          {uploads && (
            <li><span className="font-medium">Uploads:</span> {Object.values(uploads).filter(Boolean).map(f => f.original_filename || f.filename).join(', ') || 'None'}</li>
          )}
        </ul>
      )}
    </div>
  );
}

export default DivorceeIntakeForm;
