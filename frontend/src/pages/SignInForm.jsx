import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignInForm() {
  console.log('SignInForm mounted');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (e) => {
    console.log('SignInForm submit');
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const data = new FormData(e.currentTarget);
      const email = data.get('email')?.toString();
      const password = data.get('password')?.toString();
      
      if (!email || !password) throw new Error('Email and password are required');
      
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('[SignInForm] Error:', err);
      const msg = err?.data?.error?.message || err.message || 'Sign in failed';
      setError(err.status === 404 ? 'Server endpoint not found. Please check backend configuration.' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-6 sm:p-8 md:p-12 text-white">
      <div className="w-full max-w-md">
        <h3 className="text-2xl font-bold mb-6 text-center">Sign in to Accord</h3>
        <form className="space-y-4" onSubmit={onSubmit} autoComplete="off" spellCheck={false}>
          <input
            type="email"
            name="email"
            placeholder="Email address"
            className="w-full rounded-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
            autoComplete="off"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className="w-full rounded-md px-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
            autoComplete="current-password"
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <div className="text-center text-sm text-slate-300 mt-4">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold underline"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
