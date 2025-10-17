import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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

const RoleSetupForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const role = params.get('role');
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  const fields = roleFields[role] || [];

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    // TODO: Save to Supabase DB (role_profiles)
    // On success, redirect to /home
    navigate('/home');
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded shadow mt-12">
      <h2 className="text-2xl font-bold mb-4">{role ? `${role.charAt(0).toUpperCase() + role.slice(1)} Setup` : 'Role Setup'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(field => (
          <div key={field.name}>
            {field.type === 'checkbox' ? (
              <div>
                <label className="block font-semibold mb-2">{field.label}</label>
                {field.options.map(opt => (
                  <label key={opt} className="inline-flex items-center mr-4">
                    <input type="checkbox" name={opt} onChange={handleChange} />
                    <span className="ml-2">{opt}</span>
                  </label>
                ))}
              </div>
            ) : (
              <input
                name={field.name}
                type={field.type}
                placeholder={field.label}
                className="w-full px-3 py-2 border rounded"
                onChange={handleChange}
                required={!field.optional}
              />
            )}
          </div>
        ))}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700">Save & Continue</button>
      </form>
    </div>
  );
};

export default RoleSetupForm;
