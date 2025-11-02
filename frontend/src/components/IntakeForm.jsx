import React, { useState } from 'react';
import config from '../config';

const API_BASE_URL = config.api.baseUrl;

const IntakeForm = () => {
  const [step, setStep] = useState('');
  const [outcome, setOutcome] = useState('');
  const [readiness, setReadiness] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    setError('');
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('No user ID found. Please log in.');
      setLoading(false);
      return;
    }
    try {
  const res = await fetch(`${API_BASE_URL}/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          step,
          answers: { outcome, readiness: Number(readiness) }
        })
      });
      if (!res.ok) throw new Error('Failed to save intake');
      setSuccess('Intake saved successfully!');
      setStep('');
      setOutcome('');
      setReadiness('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Intake Form</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">Step</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={step}
            onChange={e => setStep(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Outcome</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={outcome}
            onChange={e => setOutcome(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Readiness (1–10)</label>
          <input
            type="number"
            min="1"
            max="10"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={readiness}
            onChange={e => setReadiness(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Intake'}
        </button>
      </form>
      {success && <div className="mt-4 text-green-600 font-semibold">{success}</div>}
      {error && <div className="mt-4 text-red-600 font-semibold">{error}</div>}
    </div>
  );
};

export default IntakeForm;
