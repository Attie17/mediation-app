import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardFrame from '../../components/DashboardFrame';
import { Card, CardHeader, CardTitle, CardContent, CardDecoration } from '../../components/ui/card-enhanced';
import { EmptyState } from '../../components/ui/empty-state';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders } from '../../config/api';
import AIInsightsPanel from '../../components/ai/AIInsightsPanel';
import DocumentViewer from '../../components/documents/DocumentViewer';
import { DocumentCardSkeleton } from '../../components/ui/skeleton';
import showToast from '../../utils/toast';
import { usePolling } from '../../hooks/usePolling';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Eye,
  Download,
  Calendar,
  User,
  AlertCircle,
  Maximize2,
  ArrowLeft
} from 'lucide-react';

export default function DocumentReview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const fetchPendingUploads = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();

      // Use new pending endpoint
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.uploads.pending}`, {
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch uploads');
      }

      const data = await response.json();
      setUploads(data.uploads || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching uploads:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Set up polling for pending uploads (every 30 seconds)
  usePolling(fetchPendingUploads, 30000);

  const handleApprove = async (uploadId) => {
    if (!confirm('Approve this document?')) return;
    
    try {
      setActionLoading(true);
      const headers = getAuthHeaders();

      // Use new review endpoint
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.uploads.review(uploadId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ 
          action: 'approve'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve document');
      }

      // Refresh the list
      await fetchPendingUploads();
      setSelectedUpload(null);
      showToast.success('Document approved successfully!');
    } catch (err) {
      console.error('Error approving upload:', err);
      showToast.error('Failed to approve document: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (uploadId, reason) => {
    if (!reason || reason.trim() === '') {
      showToast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setActionLoading(true);
      const headers = getAuthHeaders();

      // Use new review endpoint
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.uploads.review(uploadId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ 
          action: 'reject',
          notes: reason
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject document');
      }

      // Refresh the list
      await fetchPendingUploads();
      setSelectedUpload(null);
      showToast.success('Document rejected successfully!');
    } catch (err) {
      console.error('Error rejecting upload:', err);
      showToast.error('Failed to reject document: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDocType = (docType) => {
    return docType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardFrame title="Document Review">
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/mediator')}
          className="
            inline-flex items-center gap-2 px-4 py-2 rounded-lg
            bg-slate-800/50 border border-slate-700
            text-slate-300 hover:text-teal-400
            hover:border-teal-500/50
            transition-all duration-200
          "
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">
          Document Review
        </h1>
        <p className="text-slate-400">
          Review and approve uploaded documents from divorcees
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <DocumentCardSkeleton />
            <DocumentCardSkeleton />
            <DocumentCardSkeleton />
          </div>
          <div>
            <Card gradient>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-6 bg-slate-700/50 rounded animate-pulse" />
                  <div className="h-4 bg-slate-700/50 rounded animate-pulse" />
                  <div className="h-4 bg-slate-700/50 rounded animate-pulse w-3/4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : uploads.length === 0 ? (
        <Card gradient>
          <CardContent className="py-12">
            <EmptyState
              icon={<CheckCircle2 />}
              title="All Caught Up!"
              description="No documents pending review at this time."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload List */}
          <div className="lg:col-span-2 space-y-4">
            {uploads.map((upload) => (
              <Card
                key={upload.id}
                gradient
                hover
                className={`cursor-pointer ${selectedUpload?.id === upload.id ? 'ring-2 ring-teal-500' : ''}`}
                onClick={() => setSelectedUpload(upload)}
              >
                <CardDecoration color="orange" />
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-teal-400" />
                        <h3 className="text-lg font-semibold text-white">
                          {formatDocType(upload.doc_type)}
                        </h3>
                        <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-400">
                          Pending Review
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Case #{upload.case_id || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Uploaded: {formatDate(upload.created_at)}</span>
                        </div>
                        {upload.file_name && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="font-mono text-xs">{upload.file_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Eye className="w-5 h-5 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Review Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {!selectedUpload ? (
                <Card gradient>
                  <CardContent className="py-12">
                    <EmptyState
                      icon={<Eye />}
                      title="Select a Document"
                      description="Click on a document from the list to review it"
                    />
                  </CardContent>
                </Card>
              ) : (
                <ReviewPanel
                  upload={selectedUpload}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onPreview={() => setShowPreviewModal(true)}
                  loading={actionLoading}
                  formatDocType={formatDocType}
                  formatDate={formatDate}
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={() => navigate('/mediator')}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && selectedUpload && selectedUpload.file_path && (
        <DocumentViewer
          fileUrl={`${API_BASE_URL}${selectedUpload.file_path}`}
          fileName={selectedUpload.file_name || 'document.pdf'}
          fileType={selectedUpload.file_name?.split('.').pop() || 'pdf'}
          onClose={() => setShowPreviewModal(false)}
          embedded={false}
        />
      )}
    </DashboardFrame>
  );
}

function ReviewPanel({ upload, onApprove, onReject, onPreview, loading, formatDocType, formatDate }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  return (
    <Card gradient>
      <CardDecoration color="teal" />
      <CardHeader icon={<FileText className="w-5 h-5 text-teal-400" />}>
        <CardTitle>Document Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Document Info */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-2">Document Type</h4>
            <p className="text-slate-300">{formatDocType(upload.doc_type)}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-2">Case ID</h4>
            <p className="text-slate-300">#{upload.case_id || 'N/A'}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-2">Uploaded</h4>
            <p className="text-slate-300">{formatDate(upload.created_at)}</p>
          </div>

          {upload.file_name && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">File Name</h4>
              <p className="text-slate-300 font-mono text-xs break-all">{upload.file_name}</p>
            </div>
          )}

          {upload.file_path && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-2">Preview</h4>
              <div className="flex gap-2">
                <button
                  onClick={onPreview}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm"
                >
                  <Maximize2 className="w-4 h-4" />
                  Open Preview
                </button>
                <a
                  href={`${API_BASE_URL}${upload.file_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-white/10 space-y-3">
            {!showRejectForm ? (
              <>
                <button
                  onClick={() => onApprove(upload.id)}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {loading ? 'Processing...' : 'Approve Document'}
                </button>

                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  Reject Document
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-400">
                    Provide a clear reason for rejection so the user can resubmit correctly.
                  </p>
                </div>

                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  rows={4}
                  autoFocus
                />

                <div className="flex gap-2">
                  <button
                    onClick={() => onReject(upload.id, rejectionReason)}
                    disabled={loading || !rejectionReason.trim()}
                    className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors disabled:opacity-50 text-sm"
                  >
                    {loading ? 'Rejecting...' : 'Confirm Reject'}
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectionReason('');
                    }}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
