import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const roles = [
  { value: 'lawyer', label: 'Lawyer' },
  { value: 'mediator', label: 'Mediator' },
  { value: 'divorcee', label: 'Divorcee/Participant' },
  { value: 'admin', label: 'Admin' }
];

const RegistrationForm = () => {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.fullName || !form.email || !form.password || !form.confirmPassword || !form.role) {
      setError('Please fill all required fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    // TODO: Call Supabase Auth signup here
    // On success, redirect to role setup
    navigate(`/setup?role=${form.role}`);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded shadow mt-12">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="fullName" type="text" placeholder="Full Name" className="w-full px-3 py-2 border rounded" value={form.fullName} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email Address" className="w-full px-3 py-2 border rounded" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" className="w-full px-3 py-2 border rounded" value={form.password} onChange={handleChange} required />
        <input name="confirmPassword" type="password" placeholder="Confirm Password" className="w-full px-3 py-2 border rounded" value={form.confirmPassword} onChange={handleChange} required />
        <input name="phone" type="text" placeholder="Phone Number (optional)" className="w-full px-3 py-2 border rounded" value={form.phone} onChange={handleChange} />
        <select name="role" className="w-full px-3 py-2 border rounded" value={form.role} onChange={handleChange} required>
          <option value="">Select Role</option>
          {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700">Register</button>
      </form>
    </div>
  );
};

export default RegistrationForm;
