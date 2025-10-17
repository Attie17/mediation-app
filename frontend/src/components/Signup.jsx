import React, { useState } from 'react';
import supabase from '../supabaseClient';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else setSuccess(true);
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white rounded shadow p-6">
      <h2 className="text-xl font-bold mb-4">Sign Up</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" className="w-full border rounded px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && <div className="text-green-700 text-sm">Check your email for verification link.</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</button>
      </form>
    </div>
  );
}

export default Signup;
