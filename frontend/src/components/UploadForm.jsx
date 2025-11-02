import React, { useState } from 'react';
import StatusCell from './StatusCell';
import config from '../config';

const API_BASE_URL = config.api.baseUrl;

const UploadForm = () => {

  const [docType, setDocType] = useState('id_document');
  const [privacyTier, setPrivacyTier] = useState('Mediator-Only');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError('');
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('No user ID found. Please log in.');
      setLoading(false);
      return;
    }
    try {
  const res = await fetch(`${API_BASE_URL}/uploads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          docType,
          privacyTier
        })
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Failed to save upload');
      setSuccess(result.data?.[0] || result.data || {});
      setDocType('id_document');
      setPrivacyTier('Mediator-Only');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Upload Form</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">Document Type</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={docType}
            onChange={e => setDocType(e.target.value)}
            required
          >
            <option value="id_document">ID Document</option>
            <option value="marriage_certificate">Marriage Certificate</option>
            <option value="bank_statement">Bank Statement</option>
            <option value="proof_of_income">Proof of Income</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Privacy Tier</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={privacyTier}
            onChange={e => setPrivacyTier(e.target.value)}
            required
          >
            <option value="Mediator-Only">Mediator-Only</option>
            <option value="Shared">Shared</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Upload'}
        </button>
      </form>
      {success && (
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            <span className="text-green-600 font-semibold">Upload saved!</span>
          </div>
          <span className="block text-sm text-green-700">File Path: {success.file_path}</span>
          <span className="block text-sm">
            <StatusCell confirmed={success.confirmed} />
          </span>
        </div>
      )}
      {error && <div className="mt-4 text-red-600 font-semibold">{error}</div>}
    </div>
  );
};

export default UploadForm;
