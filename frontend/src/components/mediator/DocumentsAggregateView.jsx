import React, { useState, useEffect } from 'react';
import { FileText, AlertCircle, CheckCircle2, Clock, ArrowRight, Filter } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

export default function DocumentsAggregateView({ userId, onNavigate }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, urgent
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAggregatedDocuments();
  }, [userId]);

  const fetchAggregatedDocuments = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      // Fetch all pending uploads for this mediator's cases
      const data = await apiFetch(`/api/uploads/mediator/${userId}/pending`);
      
      if (data.uploads) {
        setDocuments(data.uploads);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching aggregated documents:', err);
      setError('Unable to load documents');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredDocuments = () => {
    if (filter === 'all') return documents;
    if (filter === 'pending') return documents.filter(doc => doc.status === 'pending');
    if (filter === 'urgent') {
      // Urgent = uploaded more than 2 days ago
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      return documents.filter(doc => {
        const uploadDate = new Date(doc.created_at || doc.uploaded_at);
        return uploadDate < twoDaysAgo && doc.status === 'pending';
      });
    }
    return documents;
  };

  const filteredDocs = getFilteredDocuments();

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const formatDocType = (type) => {
    if (!type) return 'Document';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getUrgencyLevel = (dateString) => {
    if (!dateString) return 'normal';
    const uploadDate = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - uploadDate) / (1000 * 60 * 60 * 24));

    if (diffDays >= 3) return 'urgent';
    if (diffDays >= 1) return 'warning';
    return 'normal';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-slate-400">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-slate-400">{error}</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
        <p className="text-slate-100 font-medium mb-1">All Clear!</p>
        <p className="text-slate-400 text-sm">No pending documents across your cases</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
        <Filter className="w-4 h-4 text-slate-500" />
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({documents.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Pending ({documents.filter(d => d.status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('urgent')}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            filter === 'urgent'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Urgent ({getFilteredDocuments().length > 0 && filter !== 'urgent' ? 
            documents.filter(d => getUrgencyLevel(d.created_at) === 'urgent').length : 
            filteredDocs.length})
        </button>
      </div>

      {/* Documents List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredDocs.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-slate-400 text-sm">No {filter} documents</p>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const urgency = getUrgencyLevel(doc.created_at || doc.uploaded_at);
            const caseId = doc.case_id || doc.case_uuid || doc.caseId;

            return (
              <button
                key={doc.id}
                onClick={() => onNavigate?.(caseId)}
                className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer text-left flex items-center justify-between group"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`flex-shrink-0 mt-1 ${
                    urgency === 'urgent' ? 'text-red-400' :
                    urgency === 'warning' ? 'text-orange-400' :
                    'text-purple-400'
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium text-sm truncate">
                        {formatDocType(doc.doc_type)}
                      </p>
                      {urgency === 'urgent' && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 flex-shrink-0">
                          Urgent
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>Case #{caseId?.toString().slice(0, 8)}</span>
                      <span>•</span>
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(doc.created_at || doc.uploaded_at)}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </button>
            );
          })
        )}
      </div>

      {/* Summary */}
      {filteredDocs.length > 0 && (
        <div className="pt-3 border-t border-slate-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">
              Showing {filteredDocs.length} of {documents.length} documents
            </span>
            <button
              onClick={() => window.location.href = '/#/mediator/review'}
              className="text-teal-400 hover:text-teal-300 font-medium flex items-center gap-1 transition-colors"
            >
              Review All
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
