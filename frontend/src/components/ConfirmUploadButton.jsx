import React, { useState } from "react";

export default function ConfirmUploadButton({ uploadId, onDone, onOptimisticUpdate, onRefreshHistory }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    
    // Optimistic UI update
    if (onOptimisticUpdate) {
      onOptimisticUpdate(uploadId, { status: "Updating..." });
    }
    
    try {
      const res = await fetch("/api/uploads/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to confirm upload");
      
      // Refresh uploads list and history
      if (onDone) onDone(data.data);
      if (onRefreshHistory) onRefreshHistory(uploadId);
      
    } catch (err) {
      console.error("Confirm action failed:", err);
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
    <button
      className="ml-2 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
      onClick={handleConfirm}
      disabled={loading}
    >
      {loading ? "Confirming..." : "Confirm"}
    </button>
  );
}
