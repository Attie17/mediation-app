import React, { useState } from 'react';

export default function RejectUploadButton({ uploadId, onDone, isMediator, onOptimisticUpdate, onRefreshHistory }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isMediator) return null;

  const handleReject = async () => {
    setLoading(true);
    setError(null);
    
    // Optimistic UI update
    if (onOptimisticUpdate) {
      onOptimisticUpdate(uploadId, { status: "Updating..." });
    }
    
    try {
      const res = await fetch('/api/uploads/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ uploadId, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reject upload');
      
      setOpen(false);
      setReason('');
      
      // Refresh uploads list and history
      if (onDone) onDone(data.data);
      if (onRefreshHistory) onRefreshHistory(uploadId);
      
    } catch (err) {
      console.error("Reject action failed:", err);
      setError(err.message);
      // Show simple alert
      alert("Action failed, please try again.");
      
      // Revert optimistic update on error
      if (onOptimisticUpdate) {
        onOptimisticUpdate(uploadId, { status: "pending" }); // Revert to likely previous state
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="rounded bg-red-600 text-white px-4 py-2 hover:bg-red-700"
        onClick={() => setOpen(true)}
      >
        Reject / Request re-upload
      </button>
      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-2">Reject Upload</h2>
            <textarea
              className="w-full border rounded p-2 mb-4"
              rows={4}
              placeholder="Enter rejection reason..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              disabled={loading}
            />
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => { setOpen(false); setError(null); }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={handleReject}
                disabled={loading || !reason.trim()}
              >
                {loading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
