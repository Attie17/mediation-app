import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionProvider, useSession } from '../contexts/SettlementSessionContext';
import SessionSetupEnhanced from '../components/divorce-wizard/SessionSetupEnhanced';
import AnnexureAFormEnhanced from '../components/divorce-wizard/AnnexureAFormEnhanced';
import AIChat from '../components/divorce-wizard/AIChat';
import { ArrowLeft, Users, User, Clock, CheckCircle } from 'lucide-react';

const SettlementWizardContent = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { state, switchParty, endSession } = useSession();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const user = await response.json();
        setCurrentUser(user);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchParty = async () => {
    if (!state.session || state.session.mode !== 'individual') return;

    try {
      const newParty = state.session.current_party === 'party1' ? 'party2' : 'party1';
      const otherPartyName = newParty === 'party1' ? state.session.party1_name : state.session.party2_name || 'Party 2';
      
      if (confirm(`Switch to ${otherPartyName}? Current progress will be saved.`)) {
        await switchParty();
      }
    } catch (error) {
      console.error('Error switching party:', error);
      alert('Failed to switch party. Please try again.');
    }
  };

  const handleEndSession = () => {
    if (confirm('Are you sure you want to end this session? All progress will be saved.')) {
      endSession();
    }
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const handleFormSave = async (sectionName, formData) => {
    // This will be handled by the form component itself through the context
    console.log('Form saved:', sectionName, formData);
  };

  const handleApproval = async (sectionName, party, approved) => {
    // This will be handled by the form component itself through the context
    console.log('Approval updated:', sectionName, party, approved);
  };

  const handleConflict = async (sectionName, conflict) => {
    // This will be handled by the form component itself through the context
    console.log('Conflict reported:', sectionName, conflict);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {state.session 
                    ? `Settlement Wizard`
                    : 'Divorce Settlement Wizard'
                  }
                </h1>
                {state.session && (
                  <p className="text-sm text-gray-500">
                    {state.session.current_party === 'party1' ? state.session.party1_name : state.session.party2_name || 'Party 2'}
                  </p>
                )}
              </div>
            </div>
            
            {state.session && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {state.session.mode === 'individual' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Users className="w-4 h-4" />
                  )}
                  <span className="capitalize">{state.session.mode}</span>
                </div>
                
                <span className="text-sm text-gray-500">
                  ID: {state.session.id}
                </span>
                
                {state.session.mode === 'individual' && (
                  <button
                    onClick={handleSwitchParty}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition duration-200"
                  >
                    Switch Party
                  </button>
                )}
                
                <button
                  onClick={handleEndSession}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition duration-200"
                >
                  End Session
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!state.session ? (
          <SessionSetupEnhanced 
            currentUser={currentUser} 
            onSessionStart={(session) => {
              // The context will handle session creation
              console.log('Session started:', session);
            }}
          />
        ) : (
          <div className="space-y-8">
            {/* Session Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="text-center md:text-left">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Divorce Settlement Forms</h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      {state.session.mode === 'individual' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Users className="w-4 h-4" />
                      )}
                      <span>Mode: {state.session.mode}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Started: {new Date(state.session.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    {state.session.mediator_name && (
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Mediator: {state.session.mediator_name}
                      </div>
                    )}
                    
                    {state.session.case_reference && (
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Case: {state.session.case_reference}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 md:mt-0 text-center md:text-right">
                  <div className="text-sm text-gray-500 mb-1">Current User</div>
                  <div className="font-medium text-gray-900">
                    {state.session.current_party === 'party1' ? state.session.party1_name : state.session.party2_name || 'Party 2'}
                  </div>
                  {state.session.party2_name && state.session.mode === 'collaborative' && (
                    <div className="text-sm text-gray-500 mt-1">
                      Both parties: {state.session.party1_name} & {state.session.party2_name}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Form Sections */}
            <div className="space-y-6">
              {/* Annexure A - Parenting Plan */}
              <AnnexureAFormEnhanced 
                sessionData={state.session}
                onSave={handleFormSave}
                onApproval={handleApproval}
                onConflict={handleConflict}
              />

              {/* Annexure B - Maintenance (Placeholder) */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Annexure B — Maintenance</h3>
                    <div className="flex space-x-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Maintenance Form</h4>
                    <p className="text-gray-500">This section will include child maintenance, spousal support, and financial arrangements.</p>
                  </div>
                </div>
              </div>

              {/* Annexure C - Property Division (Placeholder) */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Annexure C — Property Division</h3>
                    <div className="flex space-x-2">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Property Division Form</h4>
                    <p className="text-gray-500">This section will include asset division, property settlements, and financial distributions.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {state.loading && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Processing...</p>
                </div>
              </div>
            )}

            {/* Error Display */}
            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-red-400 mr-3">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700 mt-1">{state.error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Chat Assistant */}
        {state.session && (
          <AIChat sessionId={state.session.id} currentUser={currentUser} />
        )}
      </main>
    </div>
  );
};

const SettlementWizardEnhanced = () => {
  return (
    <SessionProvider>
      <SettlementWizardContent />
    </SessionProvider>
  );
};

export default SettlementWizardEnhanced;