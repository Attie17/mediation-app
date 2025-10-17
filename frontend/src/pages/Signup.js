import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Check your email to confirm your account.');
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Sign Up</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" className="w-full border p-2 rounded" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <input type="password" className="w-full border p-2 rounded" placeholder="Confirm Password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded" disabled={loading}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>
      <div className="mt-4 text-center">
        Already have an account? <Link to="/login" className="text-blue-600 underline">Login</Link>
      </div>
    </div>
  );
}
