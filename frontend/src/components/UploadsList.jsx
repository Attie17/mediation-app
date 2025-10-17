import React, { useState, useEffect, useCallback } from "react";
import StatusBadge from "./StatusBadge";
import RejectUploadButton from "./RejectUploadButton";
import ConfirmUploadButton from "./ConfirmUploadButton";
import ReplaceUploadButton from "./ReplaceUploadButton";
import UploadHistoryPanel from "./UploadHistoryPanel";


// map raw doc_type keys to friendly labels
const docTypeLabels = {
  id_document: "ID Document",
  marriage_certificate: "Marriage Certificate",
  bank_statement: "Bank Statement",
  proof_of_address: "Proof of Address",
  income_statement: "Income Statement",
  proof_of_income: "Proof of Income",
  // add more as needed
};

function formatDocType(key) {
  return docTypeLabels[key] || key.replace(/_/g, " ");
}

function getRequirementStatus(docType, uploads, caseRequirements) {
  // Find if this doc type is required
  const requirement = caseRequirements.find(req => req.doc_type === docType && req.required);
  if (!requirement) return null; // Not required
  
  // Check if there's a confirmed upload for this doc type
  const hasConfirmedUpload = uploads.some(upload => 
    upload.doc_type === docType && upload.status === 'confirmed'
  );
  
  return hasConfirmedUpload ? 'provided' : 'missing';
}

export default function UploadsList({ userId, isMediator, isDivorcee, onAction, caseRequirements = [] }) {
  const [historyPanel, setHistoryPanel] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUploads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = userId ? `/api/uploads?userId=${userId}` : '/api/uploads';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch uploads');
      const json = await res.json();
      setUploads(json.uploads || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const handleUploadAction = (updatedUpload) => {
    // Optimistic update: immediately update the local state
    setUploads(prev => prev.map(upload => 
      upload.id === updatedUpload.id ? { ...upload, ...updatedUpload } : upload
    ));
    // Also refresh the full list to ensure data consistency
    fetchUploads();
    // Call parent callback for any additional actions
    if (onAction) onAction(updatedUpload);
  };

  const handleOptimisticUpdate = (uploadId, updates) => {
    // Immediately update UI with optimistic changes
    setUploads(prev => prev.map(upload => 
      upload.id === uploadId ? { ...upload, ...updates } : upload
    ));
  };

  const handleRefreshHistory = (uploadId) => {
    // If history panel is open for this upload, trigger its refresh
    if (historyPanel?.open && historyPanel.uploadId === uploadId) {
      // The history panel will handle its own refresh via the callback
      setHistoryPanel(prev => ({ ...prev, refreshTrigger: Date.now() }));
    }
  };

  useEffect(() => {
    fetchUploads();
  }, [userId, fetchUploads]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600 font-semibold">
        Error: {error}
      </div>
    );
  }

    if (!uploads.length) {
      return (
        <div className="text-center py-10 text-gray-500">
          No documents uploaded yet.
        </div>
      );
    }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead>
            <tr className="bg-gray-100">
              <th scope="col" className="px-4 py-2 text-left">Document Type</th>
              <th scope="col" className="px-4 py-2 text-left">User</th>
              <th scope="col" className="px-4 py-2 text-left">Version</th>
              <th scope="col" className="px-4 py-2 text-left">Status / Actions</th>
              <th scope="col" className="px-4 py-2 text-left">Upload Date</th>
              <th scope="col" className="px-4 py-2 text-left">Actions</th>
              <th scope="col" className="px-4 py-2 text-left">History</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((upload, idx) => {
              const requirementStatus = getRequirementStatus(upload.doc_type, uploads, caseRequirements);
              
              return (
              <tr
                key={upload.id}
                className={
                  idx % 2 === 0
                    ? "bg-white"
                    : "bg-gray-50"
                }
              >
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span>{formatDocType(upload.doc_type)}</span>
                    {requirementStatus === 'missing' && (
                      <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs">
                        Missing
                      </span>
                    )}
                    {requirementStatus === 'provided' && (
                      <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs">
                        Provided
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">{upload.users?.email || 'Unknown'}</td>
                <td className="px-4 py-2 font-mono text-sm">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    v{upload.version || 1}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={upload.status} reason={upload.rejection_reason} />
                    {upload.status === "rejected" && upload.rejection_reason && (
                      <span className="ml-2 text-xs text-red-600" title={upload.rejection_reason}>
                        &#9432;
                      </span>
                    )}
                    {isMediator && (
                      <>
                        <ConfirmUploadButton 
                          uploadId={upload.id} 
                          onDone={handleUploadAction}
                          onOptimisticUpdate={handleOptimisticUpdate}
                          onRefreshHistory={handleRefreshHistory}
                        />
                        <RejectUploadButton 
                          uploadId={upload.id} 
                          isMediator={true} 
                          onDone={handleUploadAction}
                          onOptimisticUpdate={handleOptimisticUpdate}
                          onRefreshHistory={handleRefreshHistory}
                        />
                      </>
                    )}
                    {isDivorcee && (upload.status === "rejected" || upload.status === "confirmed") && (
                      <ReplaceUploadButton docType={upload.doc_type} uploadId={upload.id} onDone={onAction} />
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">
                  {upload.uploaded_at
                    ? new Date(upload.uploaded_at).toISOString().split('T')[0]
                    : "-"}
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <ConfirmUploadButton 
                      uploadId={upload.id} 
                      onDone={handleUploadAction}
                      onOptimisticUpdate={handleOptimisticUpdate}
                      onRefreshHistory={handleRefreshHistory}
                    />
                    <RejectUploadButton 
                      uploadId={upload.id} 
                      isMediator={true} 
                      onDone={handleUploadAction}
                      onOptimisticUpdate={handleOptimisticUpdate}
                      onRefreshHistory={handleRefreshHistory}
                    />
                  </div>
                </td>
                <td className="px-4 py-2">
                  <button
                    className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => setHistoryPanel({ open: true, uploadId: upload.id })}
                  >
                    History
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {historyPanel?.open && (
        <UploadHistoryPanel
          uploadId={historyPanel.uploadId}
          onClose={() => setHistoryPanel(null)}
          refreshTrigger={historyPanel.refreshTrigger}
        />
      )}
    </>
  );
}
