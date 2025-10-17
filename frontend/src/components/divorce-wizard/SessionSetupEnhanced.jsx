import React, { useState, useEffect } from 'react';
import { CheckCircle, Users, User, FileText, Briefcase } from 'lucide-react';

const SessionSetupEnhanced = ({ currentUser, onSessionStart }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionData, setSessionData] = useState({
    mode: 'individual',
    party1_name: '',
    party2_name: '',
    mediator_name: '',
    case_reference: '',
    case_id: ''
  });
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinData, setJoinData] = useState({
    sessionId: '',
    party2_name: ''
  });

  useEffect(() => {
    fetchCases();
    // Auto-fill user name if available
    if (currentUser?.full_name) {
      setSessionData(prev => ({ ...prev, party1_name: currentUser.full_name }));
    }
  }, [currentUser]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSessionData(prev => ({ ...prev, [name]: value }));
  };

  const handleJoinInputChange = (e) => {
    const { name, value } = e.target;
    setJoinData(prev => ({ ...prev, [name]: value }));
  };

  const handleModeSelect = (mode) => {
    setSessionData(prev => ({ ...prev, mode }));
    setCurrentStep(2);
  };

  const handleCaseSelect = (caseId) => {
    setSessionData(prev => ({ ...prev, case_id: caseId }));
    setCurrentStep(3);
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
        body: JSON.stringify({
          mode: sessionData.mode,
          party1_name: sessionData.party1_name,
          party2_name: sessionData.party2_name || null,
          mediator_name: sessionData.mediator_name || null,
          case_reference: sessionData.case_reference || null,
          case_id: sessionData.case_id || null
        })
      });

      if (response.ok) {
        const session = await response.json();
        onSessionStart(session);
      } else {
        console.error('Failed to create session');
        alert('Failed to create session. Please try again.');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Error creating session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/settlement-sessions/${joinData.sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          party2_name: joinData.party2_name
        })
      });

      if (response.ok) {
        const session = await response.json();
        onSessionStart(session);
      } else {
        alert('Failed to join session. Please check the session ID and try again.');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      alert('Error joining session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sessionModes = {
    individual: {
      title: "Individual Mode",
      description: "Each party works separately and can switch between perspectives. Perfect for when parties want to work independently.",
      features: ["Switch between party views", "Independent progress", "Private workspace", "Join functionality"],
      icon: <User className="w-8 h-8" />
    },
    collaborative: {
      title: "Collaborative Mode", 
      description: "Both parties work together in real-time on the same session. Ideal for cooperative couples.",
      features: ["Real-time collaboration", "Shared workspace", "Live updates", "Joint decision making"],
      icon: <Users className="w-8 h-8" />
    }
  };

  if (showJoinForm) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Join Settlement Session</h2>
            <p className="text-gray-600">Enter the session details provided by the other party</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleJoinSession(); }} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session ID *
              </label>
              <input
                type="text"
                name="sessionId"
                value={joinData.sessionId}
                onChange={handleJoinInputChange}
                placeholder="DW-XXXXXXXX"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name (Party 2) *
              </label>
              <input
                type="text"
                name="party2_name"
                value={joinData.party2_name}
                onChange={handleJoinInputChange}
                placeholder="Enter your full name"
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setShowJoinForm(false)}
                className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Back to Create Session
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Joining...' : 'Join Session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Divorce Settlement Wizard</h2>
          <p className="text-gray-600">Create a structured settlement session for collaborative form completion</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  currentStep >= step 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                </div>
                {step < 4 && (
                  <div className={`w-16 h-1 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Mode Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-center mb-6">Choose Session Mode</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {Object.entries(sessionModes).map(([mode, info]) => (
                <button
                  key={mode}
                  onClick={() => handleModeSelect(mode)}
                  className="p-6 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center mb-4">
                    <div className="text-blue-600 mr-3">
                      {info.icon}
                    </div>
                    <h4 className="font-semibold text-lg">{info.title}</h4>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{info.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {info.features.map((feature, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="text-center">
              <button
                onClick={() => setShowJoinForm(true)}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Or join an existing session
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Case Selection */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-center mb-6">Select Case (Optional)</h3>
            <div className="max-h-96 overflow-y-auto space-y-3">
              <button
                onClick={() => handleCaseSelect('')}
                className="w-full p-4 border-2 border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="font-semibold text-gray-900">No case association</div>
                <div className="text-sm text-gray-600">Create a standalone settlement session</div>
              </button>
              
              {cases.map((case_) => (
                <button
                  key={case_.id}
                  onClick={() => handleCaseSelect(case_.id)}
                  className="w-full p-4 border border-gray-300 rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="font-semibold">{case_.title || `Case ${case_.case_number}`}</div>
                  <div className="text-sm text-gray-600">
                    Case #{case_.case_number} • {case_.status}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Party Information */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-center mb-6">Party Information</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Party 1 (You)</h4>
                <input
                  type="text"
                  name="party1_name"
                  value={sessionData.party1_name}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {sessionData.mode === 'collaborative' && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Party 2</h4>
                  <input
                    type="text"
                    name="party2_name"
                    value={sessionData.party2_name}
                    onChange={handleInputChange}
                    placeholder="Other party's full name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mediator Name (Optional)
                </label>
                <input
                  type="text"
                  name="mediator_name"
                  value={sessionData.mediator_name}
                  onChange={handleInputChange}
                  placeholder="Mediator's name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Case Reference (Optional)
                </label>
                <input
                  type="text"
                  name="case_reference"
                  value={sessionData.case_reference}
                  onChange={handleInputChange}
                  placeholder="Case reference number"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                disabled={!sessionData.party1_name}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="font-semibold text-gray-700">Mode:</span>
                  <span className="ml-2 capitalize">{sessionData.mode}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Party 1:</span>
                  <span className="ml-2">{sessionData.party1_name}</span>
                </div>
                {sessionData.party2_name && (
                  <div>
                    <span className="font-semibold text-gray-700">Party 2:</span>
                    <span className="ml-2">{sessionData.party2_name}</span>
                  </div>
                )}
                {sessionData.mediator_name && (
                  <div>
                    <span className="font-semibold text-gray-700">Mediator:</span>
                    <span className="ml-2">{sessionData.mediator_name}</span>
                  </div>
                )}
                {sessionData.case_reference && (
                  <div>
                    <span className="font-semibold text-gray-700">Case Reference:</span>
                    <span className="ml-2">{sessionData.case_reference}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreateSession}
                disabled={loading}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {loading ? 'Creating Session...' : 'Create Session'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionSetupEnhanced;