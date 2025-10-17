import React, { useEffect, useState, useCallback } from "react";

export default function UploadHistoryPanel({ uploadId, onClose, refreshTrigger }) {
  const [events, setEvents] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [historyRes, versionsRes] = await Promise.all([
        fetch(`/api/uploads/history?uploadId=${uploadId}`),
        fetch(`/api/uploads/${uploadId}/versions`)
      ]);
      
      const historyData = await historyRes.json();
      const versionsData = await versionsRes.json();
      
      setEvents((historyData || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      setVersions((versionsData.versions || []).sort((a, b) => b.version - a.version));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [uploadId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Re-fetch when refresh trigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchHistory();
    }
  }, [refreshTrigger, fetchHistory]);

  return (
    <div className="fixed inset-0 right-0 flex items-stretch justify-end z-50">
      <div className="bg-black bg-opacity-30 absolute inset-0" onClick={onClose}></div>
      <div className="bg-white w-full max-w-md h-full shadow-lg p-6 overflow-y-auto relative">
        <header className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">History</h2>
            <div className="text-xs text-gray-500">
              {events.length > 0 && events[0].uploads && 
                `${events[0].uploads.doc_type} (User: ${events[0].uploads.users?.email || 'Unknown'})`
              }
            </div>
          </div>
          <button className="text-gray-500 hover:text-gray-700 text-lg font-bold" onClick={onClose}>×</button>
        </header>
        <div className="space-y-8">
          <section>
            <h3 className="font-semibold mb-2">Versions</h3>
            {loading ? (
              <div className="text-gray-400">Loading...</div>
            ) : error ? (
              <div className="text-red-600">Error: {error}</div>
            ) : versions.length === 0 ? (
              <div className="text-gray-400">No history yet</div>
            ) : (
              <ul className="space-y-2">
                {versions.map(v => {
                  return (
                    <li 
                      key={v.id} 
                      className={`border rounded p-2 flex flex-col bg-gray-50 border-gray-200`}
                      title={v.rejection_reason ? `Rejection reason: ${v.rejection_reason}` : undefined}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          v{v.version || 1}
                        </span>
                        <span className="font-mono text-sm">
                          Upload {v.id}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          v.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          v.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {v.status || 'pending'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 mt-1">Uploaded: {new Date(v.uploaded_at || v.created_at).toLocaleString()}</span>
                      {v.rejection_reason && <span className="text-xs text-red-600 mt-1">Reason: {v.rejection_reason}</span>}
                      <a href={v.signedUrl || v.file_path} target="_blank" rel="noopener noreferrer" className="text-xs underline mt-1 text-blue-600 hover:text-blue-800">View/Download</a>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          <section>
            <h3 className="font-semibold mb-2">Audit Trail</h3>
            {loading ? (
              <div className="text-gray-400">Loading...</div>
            ) : error ? (
              <div className="text-red-600">Error: {error}</div>
            ) : events.length === 0 ? (
              <div className="text-gray-400">No history yet</div>
            ) : (
              <ul className="space-y-2">
                {events.map(ev => {
                  let actionLabel = ev.action;
                  let actionIcon = "";
                  
                  if (ev.action === "replaced") {
                    actionIcon = "🔄";
                    actionLabel = "Document replaced with new version";
                  } else if (ev.action === "resubmitted") {
                    actionIcon = "↩️";
                    actionLabel = "Resubmitted after rejection";
                  } else if (ev.action === "uploaded") {
                    actionIcon = "📁";
                    actionLabel = "Document uploaded";
                  } else if (ev.action === "confirmed") {
                    actionIcon = "✅";
                    actionLabel = "Document confirmed";
                  } else if (ev.action === "rejected") {
                    actionIcon = "❌";
                    actionLabel = "Document rejected";
                  }
                  
                  return (
                    <li key={ev.id} className="border rounded p-2 flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-gray-700">
                          {actionIcon && <span className="mr-1">{actionIcon}</span>}
                          {actionLabel}
                        </span>
                        {ev.metadata?.oldVersion && ev.metadata?.newVersion && (
                          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                            v{ev.metadata.oldVersion} → v{ev.metadata.newVersion}
                          </span>
                        )}
                        {ev.metadata?.version && !ev.metadata?.oldVersion && (
                          <span className="text-xs bg-blue-100 px-1.5 py-0.5 rounded">
                            v{ev.metadata.version}
                          </span>
                        )}
                        {ev.metadata?.docType && (
                          <span className="text-xs text-gray-500">
                            ({ev.metadata.docType})
                          </span>
                        )}
                      </div>
                      {ev.reason && <span className="text-xs text-red-700 mb-1">Reason: {ev.reason}</span>}
                      <span className="text-xs text-gray-600">By: {ev.actor_role} ({ev.actor_id})</span>
                      <span className="text-xs text-gray-500">{new Date(ev.created_at).toLocaleString()}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
