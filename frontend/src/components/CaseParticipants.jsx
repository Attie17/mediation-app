import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/apiClient';

const CaseParticipants = ({ caseId, userRole = 'mediator' }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [newParticipant, setNewParticipant] = useState({ email: '', role: 'divorcee' });

  // Fetch participants
  const fetchParticipants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiFetch(`/api/participants/${caseId}/participants`);
      setParticipants(data.participants || []);
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Add participant
  const addParticipant = async (e) => {
    e.preventDefault();
    
    if (!newParticipant.email.trim()) {
      alert('Please enter an email address');
      return;
    }

    try {
      setAddingParticipant(true);
      
      const data = await apiFetch(`/api/participants/${caseId}/participants`, {
        method: 'POST',
        body: JSON.stringify(newParticipant),
      });
      
      // Add to local state immediately
      setParticipants(prev => [...prev, data.participant]);
      
      // Reset form and close modal
      setNewParticipant({ email: '', role: 'divorcee' });
      setShowAddModal(false);
      
    } catch (err) {
      console.error('Error adding participant:', err);
      alert(`Error adding participant: ${err.message}`);
    } finally {
      setAddingParticipant(false);
    }
  };

  // Remove participant
  const removeParticipant = async (userId, email) => {
    if (!confirm(`Are you sure you want to remove ${email} from this case?`)) {
      return;
    }

    try {
      await apiFetch(`/api/participants/${caseId}/participants/${userId}`, {
        method: 'DELETE',
      });
      
      // Remove from local state immediately
      setParticipants(prev => prev.filter(p => p.user_id !== userId));
      
    } catch (err) {
      console.error('Error removing participant:', err);
      alert(`Error removing participant: ${err.message}`);
    }
  };

  useEffect(() => {
    if (caseId) {
      fetchParticipants();
    }
  }, [caseId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Case Participants</h2>
        </div>
        <div className="px-6 py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading participants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Case Participants</h2>
        </div>
        <div className="px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Participants</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Case Participants ({participants.length})
          </h2>
          {userRole === 'mediator' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Add Participant
            </button>
          )}
        </div>
        
        <div className="px-6 py-4">
          {participants.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👥</div>
              <p className="text-gray-500">No participants added yet</p>
              <p className="text-gray-400 text-sm mt-2">
                Add participants to formally link users to this case
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added Date
                    </th>
                    {userRole === 'mediator' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {participants.map((participant) => (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {participant.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {participant.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          participant.role === 'mediator' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {participant.role === 'mediator' ? '⚖️ Mediator' : '👤 Divorcee'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(participant.created_at).toLocaleDateString()}
                      </td>
                      {userRole === 'mediator' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => removeParticipant(participant.user_id, participant.email)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Remove participant"
                          >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Participant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Participant</h3>
              
              <form onSubmit={addParticipant}>
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={newParticipant.email}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="user@example.com"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    User must already be registered in the system
                  </p>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    id="role"
                    value={newParticipant.role}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="divorcee">👤 Divorcee</option>
                    <option value="mediator">⚖️ Mediator</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setNewParticipant({ email: '', role: 'divorcee' });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    disabled={addingParticipant}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingParticipant || !newParticipant.email.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {addingParticipant ? 'Adding...' : 'Add Participant'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CaseParticipants;