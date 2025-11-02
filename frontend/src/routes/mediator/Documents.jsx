import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardFrame from '../../components/DashboardFrame';
import { Card, CardHeader, CardTitle, CardContent, CardDecoration } from '../../components/ui/card-enhanced';
import { EmptyState } from '../../components/ui/empty-state';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders } from '../../config/api';
import DocumentViewer from '../../components/documents/DocumentViewer';
import { DocumentCardSkeleton } from '../../components/ui/skeleton';
import { 
  FileText, 
  Folder,
  Eye,
  Download,
  Calendar,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  Maximize2,
  Filter,
  Search,
  FolderOpen,
  Upload,
  ArrowLeft
} from 'lucide-react';

export default function MediatorDocuments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved, new
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState('all');

  useEffect(() => {
    if (user?.user_id) {
      fetchDocumentsData();
    }
  }, [user?.user_id]);

  const fetchDocumentsData = async () => {
    if (!user?.user_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const headers = getAuthHeaders();

      // Fetch mediator's cases (only cases where user is the mediator, not all participant cases)
      const casesResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.cases.list(user.user_id, 'mediator')}`, {
        headers
      });

      if (!casesResponse.ok) {
        throw new Error('Failed to fetch cases');
      }

      const casesData = await casesResponse.json();
      const userCases = casesData.cases || [];
      console.log('📋 Cases data received:', userCases);
      console.log('📋 First case sample:', userCases[0]);
      setCases(userCases);

      // Fetch all documents across all cases
      const documentsPromises = userCases.map(async (caseItem) => {
        try {
          const uploadsResponse = await fetch(
            `${API_BASE_URL}/api/cases/${caseItem.id}/uploads`,
            { headers }
          );
          
          if (!uploadsResponse.ok) return [];
          
          const uploadsData = await uploadsResponse.json();
          return (uploadsData.uploads || []).map(upload => ({
            ...upload,
            case_title: caseItem.title,
            couple_name: caseItem.couple_name,
            case_id: caseItem.id,
            case_status: caseItem.status
          }));
        } catch (err) {
          console.error(`Error fetching uploads for case ${caseItem.id}:`, err);
          return [];
        }
      });

      const allUploadsArrays = await Promise.all(documentsPromises);
      const flattenedUploads = allUploadsArrays.flat();
      
      // Sort by upload date (newest first)
      flattenedUploads.sort((a, b) => 
        new Date(b.created_at || b.uploaded_at) - new Date(a.created_at || a.uploaded_at)
      );

      setAllDocuments(flattenedUploads);
      setError(null);
    } catch (err) {
      console.error('Error fetching documents data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get case statistics
  const getCaseStats = () => {
    const stats = {};
    
    cases.forEach(caseItem => {
      const caseDocs = allDocuments.filter(doc => doc.case_id === caseItem.id);
      stats[caseItem.id] = {
        total: caseDocs.length,
        pending: caseDocs.filter(doc => doc.status === 'pending').length,
        approved: caseDocs.filter(doc => doc.confirmed || doc.status === 'approved').length,
        new: caseDocs.filter(doc => !doc.viewed_by_mediator).length
      };
    });
    
    return stats;
  };

  const caseStats = getCaseStats();

  // Filter documents based on selected filters
  const getFilteredDocuments = () => {
    let filtered = allDocuments;

    // Filter by case
    if (selectedCase !== 'all') {
      filtered = filtered.filter(doc => doc.case_id === selectedCase);
    }

    // Filter by status
    if (filterStatus === 'pending') {
      filtered = filtered.filter(doc => doc.status === 'pending');
    } else if (filterStatus === 'approved') {
      filtered = filtered.filter(doc => doc.confirmed || doc.status === 'approved');
    } else if (filterStatus === 'new') {
      filtered = filtered.filter(doc => !doc.viewed_by_mediator);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.doc_type?.toLowerCase().includes(term) ||
        doc.original_filename?.toLowerCase().includes(term) ||
        doc.case_title?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const filteredDocuments = getFilteredDocuments();

  const formatDocType = (docType) => {
    return docType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      if (diffHours === 0) return 'Just now';
      return `${diffHours}h ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getStatusBadge = (document) => {
    if (document.status === 'pending') {
      return <span className="px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-400">Pending Review</span>;
    }
    if (document.confirmed || document.status === 'approved') {
      return <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">Approved</span>;
    }
    if (document.status === 'rejected') {
      return <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">Rejected</span>;
    }
    return null;
  };

  const handlePreview = async (document) => {
    setSelectedDocument(document);
    setShowPreviewModal(true);
    
    // Mark as viewed by mediator
    try {
      const headers = getAuthHeaders();
      // Optional: Track document views
      await fetch(`${API_BASE_URL}/api/uploads/${document.id}/view`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          viewed_by: user?.user_id,
          viewed_at: new Date().toISOString()
        })
      }).catch(err => {
        // Silently fail - this is just for analytics
        console.debug('Failed to track document view:', err);
      });
    } catch (err) {
      // Ignore errors for view tracking
      console.debug('View tracking error:', err);
    }
  };

  if (loading) {
    return (
      <DashboardFrame title="Documents">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          <DocumentCardSkeleton />
          <DocumentCardSkeleton />
          <DocumentCardSkeleton />
          <DocumentCardSkeleton />
          <DocumentCardSkeleton />
          <DocumentCardSkeleton />
        </div>
      </DashboardFrame>
    );
  }

  return (
    <DashboardFrame title="Documents">
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
          Documents Library
        </h1>
        <p className="text-slate-400">
          View and manage all documents across your cases
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Cases Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Folder className="w-5 h-5 text-teal-400" />
          Cases with Documents
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.length === 0 ? (
            <Card gradient>
              <CardContent className="py-6">
                <EmptyState
                  icon={<FolderOpen />}
                  title="No Cases Yet"
                  description="Create a new case to get started"
                />
              </CardContent>
            </Card>
          ) : (
            cases.map(caseItem => {
              const stats = caseStats[caseItem.id] || { total: 0, pending: 0, approved: 0, new: 0 };
              const isSelected = selectedCase === caseItem.id;
              
              return (
                <Card
                  key={caseItem.id}
                  gradient
                  hover
                  className={`cursor-pointer ${isSelected ? 'ring-2 ring-teal-500' : ''}`}
                  onClick={() => setSelectedCase(isSelected ? 'all' : caseItem.id)}
                >
                  <CardDecoration color="teal" />
                  <CardContent>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">{caseItem.couple_name || caseItem.title}</h3>
                        <p className="text-sm text-slate-400">{caseItem.title}</p>
                      </div>
                      <Folder className="w-5 h-5 text-teal-400" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">{stats.total} docs</span>
                      </div>
                      {stats.pending > 0 && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-400" />
                          <span className="text-orange-400">{stats.pending} pending</span>
                        </div>
                      )}
                      {stats.new > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-blue-400" />
                          <span className="text-blue-400">{stats.new} new</span>
                        </div>
                      )}
                      {stats.approved > 0 && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                          <span className="text-green-400">{stats.approved} approved</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filterStatus === 'all'
                ? 'bg-teal-500/20 text-teal-400'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('new')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filterStatus === 'new'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            New
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filterStatus === 'pending'
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filterStatus === 'approved'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            Approved
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            Documents
            {selectedCase !== 'all' && (
              <span className="text-sm text-slate-400 font-normal">
                ({filteredDocuments.length} in selected case)
              </span>
            )}
          </h2>
          {selectedCase !== 'all' && (
            <button
              onClick={() => setSelectedCase('all')}
              className="text-sm text-teal-400 hover:text-teal-300"
            >
              Show all cases
            </button>
          )}
        </div>

        {filteredDocuments.length === 0 ? (
          <Card gradient>
            <CardContent className="py-12">
              <EmptyState
                icon={<FileText />}
                title={searchTerm ? "No Matching Documents" : "No Documents"}
                description={
                  searchTerm 
                    ? "Try adjusting your search or filters"
                    : "Documents will appear here when participants upload them"
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredDocuments.map((document) => (
              <Card
                key={document.id}
                gradient
                hover
                className="cursor-pointer"
                onClick={() => handlePreview(document)}
              >
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-teal-400 flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-white font-semibold">
                            {formatDocType(document.doc_type)}
                          </h3>
                          {getStatusBadge(document)}
                          {!document.viewed_by_mediator && (
                            <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">New</span>
                          )}
                        </div>
                        <div className="space-y-1 text-sm text-slate-400">
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4" />
                            <span className="truncate">{document.couple_name || document.case_title || `Case #${document.case_id?.slice(0, 8)}`}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Uploaded {formatDate(document.created_at || document.uploaded_at)}</span>
                          </div>
                          {document.original_filename && (
                            <div className="flex items-center gap-2">
                              <Upload className="w-4 h-4" />
                              <span className="font-mono text-xs truncate">{document.original_filename}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(document);
                        }}
                        className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                        title="Preview"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      {document.storage_path && (
                        <a
                          href={`${API_BASE_URL}${document.storage_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-lg bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={() => navigate('/mediator')}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && selectedDocument && selectedDocument.storage_path && (
        <DocumentViewer
          fileUrl={`${API_BASE_URL}${selectedDocument.storage_path}`}
          fileName={selectedDocument.original_filename || 'document.pdf'}
          fileType={selectedDocument.original_filename?.split('.').pop() || 'pdf'}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedDocument(null);
          }}
          embedded={false}
        />
      )}
    </DashboardFrame>
  );
}
