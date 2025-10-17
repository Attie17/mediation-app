import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SessionSetup from '../components/divorce-wizard/SessionSetup';
import AnnexureAForm from '../components/divorce-wizard/AnnexureAForm';
import AIChat from '../components/divorce-wizard/AIChat';

const SettlementWizard = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadActiveSession();
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

  const loadActiveSession = async () => {
    try {
      const savedSession = localStorage.getItem('active-settlement-session');
      if (savedSession) {
        const sessionData = JSON.parse(savedSession);
        // Verify session still exists and is active
        const response = await fetch(`/api/settlement-sessions/${sessionData.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const session = await response.json();
          setActiveSession(session);
        } else {
          localStorage.removeItem('active-settlement-session');
        }
      }
    } catch (error) {
      console.error('Error loading active session:', error);
      localStorage.removeItem('active-settlement-session');
    }
  };

  const handleSessionStart = (session) => {
    setActiveSession(session);
    localStorage.setItem('active-settlement-session', JSON.stringify(session));
  };

  const handleSessionEnd = () => {
    setActiveSession(null);
    localStorage.removeItem('active-settlement-session');
  };

  const handleSwitchParty = async () => {
    if (!activeSession || activeSession.mode !== 'individual') return;

    try {
      const newParty = activeSession.current_party === 'party1' ? 'party2' : 'party1';
      const otherPartyName = newParty === 'party1' ? activeSession.party1_name : activeSession.party2_name || 'Party 2';
      
      if (confirm(`Switch to ${otherPartyName}? Current progress will be saved.`)) {
        const response = await fetch(`/api/settlement-sessions/${activeSession.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ current_party: newParty })
        });

        if (response.ok) {
          const updatedSession = await response.json();
          setActiveSession(updatedSession);
          localStorage.setItem('active-settlement-session', JSON.stringify(updatedSession));
        }
      }
    } catch (error) {
      console.error('Error switching party:', error);
      alert('Failed to switch party. Please try again.');
    }
  };

  const handleFormSave = async (sectionName, formData) => {
    try {
      const response = await fetch(`/api/settlement-sessions/${activeSession.id}/sections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          section_name: sectionName,
          form_data: formData
        })
      });

      if (response.ok) {
        console.log('Form saved successfully');
        // Could show success notification here
      } else {
        throw new Error('Failed to save form');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Failed to save form. Please try again.');
    }
  };

  const handleApproval = async (sectionName, approved) => {
    try {
      const response = await fetch(`/api/settlement-sessions/${activeSession.id}/approvals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          section_name: sectionName,
          party: activeSession.current_party,
          approved: approved
        })
      });

      if (response.ok) {
        console.log('Approval status updated');
        // Could show success notification here
      } else {
        throw new Error('Failed to update approval');
      }
    } catch (error) {
      console.error('Error updating approval:', error);
      alert('Failed to update approval. Please try again.');
    }
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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
              <h1 className="text-xl font-semibold text-gray-900">
                {activeSession 
                  ? `Settlement Wizard - ${activeSession.current_party === 'party1' ? activeSession.party1_name : activeSession.party2_name || 'Party 2'}`
                  : 'Divorce Settlement Wizard'
                }
              </h1>
            </div>
            
            {activeSession && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Session: {activeSession.id}
                </span>
                
                {activeSession.mode === 'individual' && (
                  <button
                    onClick={handleSwitchParty}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition duration-200"
                  >
                    Switch Party
                  </button>
                )}
                
                <button
                  onClick={handleSessionEnd}
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
        {!activeSession ? (
          <SessionSetup 
            currentUser={currentUser} 
            onSessionStart={handleSessionStart}
          />
        ) : (
          <div className="space-y-8">
            {/* Session Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Divorce Settlement Forms</h2>
                <p className="text-gray-600">
                  Mode: {activeSession.mode} | 
                  Current User: {activeSession.current_party === 'party1' ? activeSession.party1_name : activeSession.party2_name || 'Party 2'}
                </p>
                
                {activeSession.mediator_name && (
                  <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Mediator: {activeSession.mediator_name}
                  </div>
                )}
              </div>
            </div>

            {/* Form Sections */}
            <div className="space-y-6">
              <AnnexureAForm 
                sessionData={activeSession}
                onSave={handleFormSave}
                onApproval={handleApproval}
              />

              {/* Placeholder for Annexure B */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Annexure B â€” Maintenance</h3>
                  <p className="text-sm text-gray-600 mt-1">Coming soon</p>
                </div>
                <div className="p-6">
                  <p className="text-gray-500">Maintenance form will be implemented next.</p>
                </div>
              </div>

              {/* Placeholder for Annexure C */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Annexure C â€” Property Division</h3>
                  <p className="text-sm text-gray-600 mt-1">Coming soon</p>
                </div>
                <div className="p-6">
                  <p className="text-gray-500">Property division form will be implemented next.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* AI Chat Assistant */}
        <AIChat sessionId={activeSession?.id} currentUser={currentUser} />

      </main>
    </div>
  );
};

export default SettlementWizard;
