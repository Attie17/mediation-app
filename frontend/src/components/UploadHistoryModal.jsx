import React, { useState, useEffect } from "react";

export default function UploadHistoryModal({ docType, userId, onClose }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/uploads/history?userId=${userId}&docType=${docType}`)
      .then(res => res.json())
      .then(json => {
        setVersions(json.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [docType, userId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg">
        <h2 className="text-lg font-bold mb-4">Version History</h2>
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : error ? (
          <div className="text-red-600">Error: {error}</div>
        ) : (
          <ul className="space-y-2">
            {versions.map(v => (
              <li key={v.id} className="border rounded p-2 flex flex-col">
                <span className="font-semibold">Version {v.version}</span>
                <span className="text-xs text-gray-600">Uploaded: {new Date(v.uploaded_at).toLocaleString()}</span>
                <span className="text-xs text-gray-600">Status: {v.status}</span>
                {v.rejection_reason && <span className="text-xs text-red-600">Reason: {v.rejection_reason}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
