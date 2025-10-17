import React, { useEffect, useState } from "react";

export default function UploadHistory({ uploadId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/uploads/${uploadId}/audit`)
      .then(res => res.json())
      .then(json => {
        setEvents(json.data || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || "Failed to fetch audit history");
        setLoading(false);
      });
  }, [uploadId]);

  if (loading) return <div className="text-gray-400">Loading history...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!events.length) return <div className="text-gray-400">No history found.</div>;

  return (
    <div className="space-y-3 mt-2">
      {events.map(ev => (
        <div key={ev.id} className="border rounded p-3 bg-gray-50">
          <div className="font-semibold text-sm text-blue-700">{ev.action}</div>
          {ev.reason && <div className="text-xs text-red-700 mb-1">Reason: {ev.reason}</div>}
          <div className="text-xs text-gray-600">By: {ev.actor_role} ({ev.actor_id})</div>
          <div className="text-xs text-gray-500">{new Date(ev.created_at).toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
