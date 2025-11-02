import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterForm() {
  console.log('RegisterForm mounted');
  const navigate = useNavigate();
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { register: authRegister } = useAuth();
  
  const onSubmit = async (e) => {
    console.log('RegisterForm submit');
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = new FormData(e.currentTarget);
      const email = data.get('email')?.toString();
      const password = data.get('password')?.toString();
      const confirmPassword = data.get('confirmPassword')?.toString();
      const name = data.get('name')?.toString();
      const role = data.get('role')?.toString();
      
      if (!email || !password) throw new Error('Email & password required');
      if (password !== confirmPassword) throw new Error('Passwords do not match');
      
      await authRegister(email, password, name, role);
      // Redirect to role setup to complete profile
      navigate(`/setup?role=${role || 'divorcee'}`);
    } catch (err) {
      console.error('[RegisterForm] Error:', err);
      const msg = err?.data?.error?.message || err.message || 'Registration failed';
      setError(err.status === 404 ? 'Server endpoint not found. Please check backend configuration.' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-6 sm:p-8 md:p-12 text-white">
      <div className="w-full max-w-md">
        <h3 className="text-2xl font-bold mb-6 text-center">Create your account</h3>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full name"
            className="w-full rounded-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email address"
            className="w-full rounded-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
            required
          />
          <select
            name="role"
            defaultValue="divorcee"
            className="w-full rounded-md px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            required
          >
            <option value="" disabled>Select your role</option>
            <option value="divorcee">Divorcee</option>
            <option value="mediator">Mediator</option>
            <option value="lawyer">Lawyer</option>
            <option value="admin">Admin</option>
          </select>
          <input
            type="password"
            name="password"
            placeholder="Password (min 8 chars, upper/lower/digit/special)"
            className="w-full rounded-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
            minLength={8}
            required
            title="Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&#)"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm password"
            className="w-full rounded-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
            minLength={8}
            required
          />
          {error && (
            <div className="rounded-md bg-red-500 bg-opacity-90 px-4 py-3 text-white text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="w-full rounded-full bg-white text-blue-700 font-semibold py-3 mt-2 hover:bg-blue-50 transition"
          >
            {loading ? 'Creating account…' : 'Register'}
          </button>
          <div className="text-center text-sm text-slate-300 mt-4">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/signin')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold underline"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
