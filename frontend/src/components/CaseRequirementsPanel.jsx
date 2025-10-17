import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiClient';

const CaseRequirementsPanel = ({ caseId }) => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(new Set());

  // Known document types that can be required
  const knownDocTypes = [
    'bank_statement',
    'tax_return',
    'pay_stub',
    'employment_letter',
    'insurance_documents',
    'property_documents',
    'debt_statements',
    'retirement_accounts',
    'investment_statements',
    'other_assets'
  ];

  // Fetch requirements for the case
  const fetchRequirements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:4000/api/cases/${caseId}/requirements`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch requirements: ${response.statusText}`);
      }
      
      const data = await response.json();
      setRequirements(data.requirements || []);
    } catch (err) {
      console.error('Error fetching requirements:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update requirement (create or update)
  const updateRequirement = async (docType, required) => {
    try {
      setUpdating(prev => new Set(prev).add(docType));
      setError(null);

      await apiFetch(`/api/cases/${caseId}/requirements`, {
        method: 'POST',
        body: JSON.stringify({
          doc_type: docType,
          required: required,
        }),
      });

      // Refresh requirements list
      await fetchRequirements();
    } catch (err) {
      console.error('Error updating requirement:', err);
      setError(err.message);
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(docType);
        return newSet;
      });
    }
  };

  // Delete requirement
  const deleteRequirement = async (docType) => {
    if (!window.confirm(`Are you sure you want to remove the requirement for ${docType.replace('_', ' ')}?`)) {
      return;
    }

    try {
      setUpdating(prev => new Set(prev).add(docType));
      setError(null);

      await apiFetch(`/api/cases/${caseId}/requirements/${docType}`, {
        method: 'DELETE',
      });

      // Refresh requirements list
      await fetchRequirements();
    } catch (err) {
      console.error('Error deleting requirement:', err);
      setError(err.message);
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(docType);
        return newSet;
      });
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (docType, currentlyRequired) => {
    const newRequired = !currentlyRequired;
    updateRequirement(docType, newRequired);
  };

  // Get requirement status for a doc type
  const getRequirementStatus = (docType) => {
    const requirement = requirements.find(req => req.doc_type === docType);
    return requirement ? requirement.required : false;
  };

  // Check if a doc type has any requirement (required or optional)
  const hasRequirement = (docType) => {
    return requirements.some(req => req.doc_type === docType);
  };

  // Format doc type for display
  const formatDocType = (docType) => {
    return docType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  useEffect(() => {
    if (caseId) {
      fetchRequirements();
    }
  }, [caseId]);

  if (!caseId) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Case Requirements</h3>
        <p className="text-gray-500">Please select a case to manage requirements.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Case {caseId} - Document Requirements
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Manage which documents are required or optional for this case
        </p>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading requirements...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {knownDocTypes.map((docType) => {
                const isRequired = getRequirementStatus(docType);
                const hasReq = hasRequirement(docType);
                const isUpdating = updating.has(docType);

                return (
                  <div
                    key={docType}
                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                      hasReq
                        ? isRequired
                          ? 'border-green-200 bg-green-50'
                          : 'border-yellow-200 bg-yellow-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`req-${docType}`}
                          checked={hasReq}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateRequirement(docType, true);
                            } else {
                              deleteRequirement(docType);
                            }
                          }}
                          disabled={isUpdating}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor={`req-${docType}`}
                          className="ml-2 block text-sm font-medium text-gray-900"
                        >
                          {formatDocType(docType)}
                        </label>
                      </div>
                      
                      {hasReq && (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">•</span>
                          <select
                            value={isRequired ? 'required' : 'optional'}
                            onChange={(e) => updateRequirement(docType, e.target.value === 'required')}
                            disabled={isUpdating}
                            className="text-xs border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="required">Required</option>
                            <option value="optional">Optional</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {isUpdating && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      )}
                      
                      {hasReq && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          isRequired
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {isRequired ? 'Required' : 'Optional'}
                        </span>
                      )}

                      {hasReq && (
                        <button
                          onClick={() => deleteRequirement(docType)}
                          disabled={isUpdating}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          title="Remove requirement"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  {requirements.length} requirement{requirements.length !== 1 ? 's' : ''} configured
                </span>
                <button
                  onClick={fetchRequirements}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseRequirementsPanel;