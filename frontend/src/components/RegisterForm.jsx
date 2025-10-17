import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://localhost:4000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        navigate('/login');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Network error');
    }
    setLoading(false);
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
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        disabled={loading}
      >
        {loading ? 'Registering...' : 'Register'}
      </button>
      {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}
    </form>
  );
}
// Create a RegisterForm component with React + Tailwind.
// Requirements:
// - Inputs: email, password
// - Submit button: "Register"
// - On submit, call POST http://localhost:4000/auth/register with email + password
// - If registration succeeds, redirect to /login
// - If error, show error message in red below the form
// - Use useState for email, password, loading, and error state
// - Tailwind styles: bordered inputs, green button, error in red
