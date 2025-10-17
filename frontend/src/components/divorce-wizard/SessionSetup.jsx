import React, { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

const SessionSetup = ({ onSessionCreated }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionData, setSessionData] = useState({
    mode: '', // 'individual' or 'collaborative'
    caseId: '',
    parties: [
      { name: '', email: '', phone: '' },
      { name: '', email: '', phone: '' }
    ]
  });
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cases', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCases(data);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const handleModeSelect = (mode) => {
    setSessionData(prev => ({ ...prev, mode }));
    setCurrentStep(2);
  };

  const handleCaseSelect = (caseId) => {
    setSessionData(prev => ({ ...prev, caseId }));
    setCurrentStep(3);
  };

  const handlePartyUpdate = (index, field, value) => {
    setSessionData(prev => ({
      ...prev,
      parties: prev.parties.map((party, i) => 
        i === index ? { ...party, [field]: value } : party
      )
    }));
  };

  const handleCreateSession = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/settlement-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sessionData)
      });

      if (response.ok) {
        const session = await response.json();
        onSessionCreated(session);
      } else {
        console.error('Failed to create session');
      }
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Divorce Settlement Wizard</h2>
          <p className="text-gray-600">Create a structured settlement session</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                </div>
                {step < 4 && <div className={`w-16 h-1 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Mode Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-center mb-6">Choose Session Mode</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <button
                onClick={() => handleModeSelect('individual')}
                className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">👤</div>
                  <h4 className="font-semibold mb-2">Individual Session</h4>
                  <p className="text-gray-600 text-sm">Work through settlement forms individually</p>
                </div>
              </button>
              <button
                onClick={() => handleModeSelect('collaborative')}
                className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">👥</div>
                  <h4 className="font-semibold mb-2">Collaborative Session</h4>
                  <p className="text-gray-600 text-sm">Work together with both parties</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Case Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-center mb-6">Select Case</h3>
            {cases.length > 0 ? (
              <div className="space-y-4">
                {cases.map((case_) => (
                  <button
                    key={case_.id}
                    onClick={() => handleCaseSelect(case_.id)}
                    className="w-full p-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <div className="font-semibold">{case_.title}</div>
                    <div className="text-sm text-gray-600">Case #{case_.case_number}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-600">
                No cases available. Please create a case first.
              </div>
            )}
          </div>
        )}

        {/* Step 3: Party Information */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-center mb-6">Party Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {sessionData.parties.map((party, index) => (
                <div key={index} className="space-y-4">
                  <h4 className="font-semibold">Party {index + 1}</h4>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={party.name}
                    onChange={(e) => handlePartyUpdate(index, 'name', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={party.email}
                    onChange={(e) => handlePartyUpdate(index, 'email', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={party.phone}
                    onChange={(e) => handlePartyUpdate(index, 'phone', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => setCurrentStep(4)}
                disabled={!sessionData.parties.every(p => p.name && p.email)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-center mb-6">Confirm Session Details</h3>
            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
              <div>
                <span className="font-semibold">Mode:</span> {sessionData.mode}
              </div>
              <div>
                <span className="font-semibold">Case ID:</span> {sessionData.caseId}
              </div>
              <div>
                <span className="font-semibold">Parties:</span>
                <ul className="mt-2 space-y-1">
                  {sessionData.parties.map((party, index) => (
                    <li key={index} className="ml-4">
                      {party.name} ({party.email})
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Back
              </button>
              <button
                onClick={handleCreateSession}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionSetup;
