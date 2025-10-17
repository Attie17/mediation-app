import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import CaseRequirementsPanel from '../components/CaseRequirementsPanel';
import CaseParticipants from '../components/CaseParticipants';
import CaseNotes from '../components/CaseNotes';
import { apiFetch } from '../lib/apiClient';

const CaseDetailsPage = () => {
  const { caseId } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [caseRequirements, setCaseRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock user role - in a real app this would come from authentication context
  const userRole = 'mediator'; // Could be 'mediator', 'divorcee', 'admin', etc.

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const currentUser = useMemo(() => {
    if (userRole === 'mediator') {
      return {
        id: caseData?.mediator_id ?? '',
        name: caseData?.mediator_name ?? 'Mediator',
      };
    }
    if (caseData?.current_user_id) {
      return {
        id: caseData.current_user_id,
        name: caseData.current_user_name ?? 'Case Participant',
      };
    }
    return { id: '', name: 'Unknown User' };
  }, [userRole, caseData]);

  // Fetch case details
  const fetchCaseDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch case data
      const caseResult = await apiFetch(`/api/cases/${caseId}`);
      setCaseData(caseResult.case);

      // Fetch uploads for this case
      const uploadsResult = await apiFetch(`/api/cases/${caseId}/uploads`);
      setUploads(uploadsResult.uploads || []);

      // Fetch case requirements
      try {
        const requirementsResult = await apiFetch(`/api/cases/${caseId}/requirements`);
        setCaseRequirements(requirementsResult.requirements || []);
      } catch (reqErr) {
        // If requirements endpoint fails, just log and continue
        console.warn('Failed to fetch case requirements:', reqErr.message);
        setCaseRequirements([]);
      }

    } catch (err) {
      console.error('Error fetching case details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) {
      fetchCaseDetails();
    }
  }, [caseId]);

  // Helper function to check if a document type is required and if it's provided
  const getRequirementStatus = (docType) => {
    // Find if this doc type is required
    const requirement = caseRequirements.find(req => req.doc_type === docType && req.required);
    if (!requirement) return null; // Not required
    
    // Check if there's a confirmed upload for this doc type
    const hasConfirmedUpload = uploads.some(upload => 
      upload.doc_type === docType && upload.status === 'confirmed'
    );
    
    return hasConfirmedUpload ? 'provided' : 'missing';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg text-gray-600">Loading case details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Case</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900">Case not found</h2>
            <p className="mt-2 text-gray-600">The requested case could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUploadStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Case Details</h1>
            <p className="mt-2 text-gray-600">
              Complete information and document management for Case #{caseId}
            </p>
          </div>
          <Link
            to={`/cases/${caseId}/dashboard`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span className="mr-2">📊</span>
            Case Dashboard
          </Link>
        </div>

        {/* Case Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Case Information</h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Case ID</dt>
                <dd className="mt-1 text-sm text-gray-900">#{caseData.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(caseData.status)}`}>
                    {caseData.status || 'Unknown'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created Date</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {caseData.created_at ? formatDate(caseData.created_at) : 'N/A'}
                </dd>
              </div>
              {caseData.description && (
                <div className="md:col-span-2 lg:col-span-3">
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-sm text-gray-900">{caseData.description}</dd>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Uploads List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Uploaded Documents ({uploads.length})
            </h2>
          </div>
          <div className="px-6 py-4">
            {uploads.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No documents uploaded yet.</p>
            ) : (
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {uploads.map((upload) => {
                      const requirementStatus = getRequirementStatus(upload.doc_type);
                      
                      return (
                      <tr key={upload.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <span>
                              {upload.doc_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                            </span>
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getUploadStatusColor(upload.status)}`}>
                            {upload.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {upload.uploaded_at ? formatDate(upload.uploaded_at) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {upload.notes || '-'}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Case Participants */}
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Case Participants</h2>
            <p className="mt-1 text-gray-600">
              Users formally linked to this case with their respective roles
            </p>
          </div>
          <CaseParticipants caseId={caseId} userRole={userRole} />
        </div>

        {/* Case Notes */}
        <CaseNotes caseId={caseId} currentUser={currentUser} />

        {/* Case Requirements - Mediator Only */}
        {userRole === 'mediator' && (
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Case Requirements</h2>
              <p className="mt-1 text-gray-600">
                Manage document requirements for this case
              </p>
            </div>
            <CaseRequirementsPanel caseId={caseId} />
          </div>
        )}

        {/* Role-based message for non-mediators */}
        {userRole !== 'mediator' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Limited Access
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  Case requirements management is only available to mediators.
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CaseDetailsPage;