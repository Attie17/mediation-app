// Create a LoginForm component with React + Tailwind.
// Requirements:
// - Inputs: email, password
// - Submit button: "Login"
// - On submit, call POST {API_BASE_URL}/auth/login with email + password
// - If login succeeds, save userId in localStorage and redirect to /dashboard
// - If login fails, show an error message in red
// - Use useState for form values, loading, and error state
// - Tailwind styles: bordered inputs, blue button, error in red

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="max-w-sm mx-auto p-4 border rounded shadow" onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block mb-1">Email</label>
        <input
          type="email"
          className="w-full border px-3 py-2 rounded"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Password</label>
        <input
          type="password"
          className="w-full border px-3 py-2 rounded"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
      {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}
    </form>
  );
}
