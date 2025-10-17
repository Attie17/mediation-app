import React, { useState } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { SESSION_MODES } from '../../types.ts';

const SessionSetup: React.FC = () => {
  const { state, startSession, joinSession } = useSession();
  const [formData, setFormData] = useState({
    party1_name: '',
    party2_name: '',
    mediator_name: '',
    case_reference: '',
    mode: 'individual' as 'individual' | 'collaborative',
    role: 'divorcee' as 'mediator' | 'divorcee' | 'admin' | 'lawyer'
  });
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinData, setJoinData] = useState({
    sessionId: '',
    party2_name: '',
    role: 'divorcee' as 'mediator' | 'divorcee' | 'admin' | 'lawyer'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleJoinInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setJoinData(prev => ({ ...prev, [name]: value }));
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.party1_name || !formData.mode) {
      alert('Please enter your name and select a session mode.');
      return;
    }
    await startSession({
      mode: formData.mode,
      party1_name: formData.party1_name,
      party2_name: formData.party2_name || undefined,
      mediator_name: formData.mediator_name || undefined,
      case_reference: formData.case_reference || undefined,
      role: formData.role
    });
  };

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinData.sessionId || !joinData.party2_name) {
      alert('Please enter session ID and your name.');
      return;
    }
    await joinSession(joinData.sessionId, joinData.party2_name, joinData.role);
  };

  const selectedModeInfo = SESSION_MODES[formData.mode];

  if (state.session) {
    return (
      <div className="session-active">
        <div className="session-info">
          <h2>Session Active</h2>
          <p><strong>Session ID:</strong> {state.session.id}</p>
          <p><strong>Mode:</strong> {state.session.mode}</p>
          <p><strong>Current Party:</strong> {state.session.current_party === 'party1' ? state.session.party1_name : state.session.party2_name || 'Party 2'}</p>
          {state.session.mode === 'individual' && (
            <button onClick={() => window.location.reload()} className="btn secondary">Switch Party</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="session-setup">
      {!showJoinForm ? (
        <div className="card">
          <div className="hero">
            <h2>🏛️ Divorce Settlement Wizard</h2>
            <p className="muted">Secure access required for all participants</p>
          </div>
          <form onSubmit={handleStartSession}>
            <div className="grid">
              <div>
                <label>Your Name (Party 1) *</label>
                <input type="text" name="party1_name" value={formData.party1_name} onChange={handleInputChange} placeholder="Enter your full name" required />
              </div>
              <div>
                <label>Your Role *</label>
                <select name="role" value={formData.role} onChange={handleInputChange} required>
                  <option value="divorcee">Divorcee</option>
                  <option value="mediator">Mediator</option>
                  <option value="admin">Admin</option>
                  <option value="lawyer">Lawyer</option>
                </select>
              </div>
              <div>
                <label>Session Mode *</label>
                <select name="mode" value={formData.mode} onChange={handleInputChange} required>
                  <option value="individual">Individual Mode</option>
                  <option value="collaborative">Collaborative Mode</option>
                </select>
              </div>
            </div>
            {formData.mode === 'collaborative' && (
              <div>
                <label>Party 2 Name</label>
                <input type="text" name="party2_name" value={formData.party2_name} onChange={handleInputChange} placeholder="Enter other party's name" />
              </div>
            )}
            <div className="row">
              <div>
                <label>Mediator Name</label>
                <input type="text" name="mediator_name" value={formData.mediator_name} onChange={handleInputChange} placeholder="Optional" />
              </div>
              <div>
                <label>Case Reference</label>
                <input type="text" name="case_reference" value={formData.case_reference} onChange={handleInputChange} placeholder="Optional" />
              </div>
            </div>
            {selectedModeInfo && (
              <div className="mode-info">
                <strong>{selectedModeInfo.title}</strong>
                <div className="muted">{selectedModeInfo.description}</div>
                <div className="features">
                  {selectedModeInfo.features.map((feature, index) => (
                    <span key={index} className="feature-tag">{feature}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="actions">
              <button type="submit" className="btn primary" disabled={state.loading}>
                {state.loading ? 'Starting...' : 'Start Session'}
              </button>
              {formData.mode === 'individual' && (
                <button type="button" onClick={() => setShowJoinForm(true)} className="btn ghost">Join Existing Session</button>
              )}
            </div>
          </form>
          {state.error && (
            <div className="error">{state.error}</div>
          )}
        </div>
      ) : (
        <div className="card">
          <h2>Join Session</h2>
          <form onSubmit={handleJoinSession}>
            <div>
              <label>Session ID *</label>
              <input type="text" name="sessionId" value={joinData.sessionId} onChange={handleJoinInputChange} placeholder="DW-XXXXXXXX" required />
            </div>
            <div>
              <label>Your Name (Party 2) *</label>
              <input type="text" name="party2_name" value={joinData.party2_name} onChange={handleJoinInputChange} placeholder="Enter your full name" required />
            </div>
            <div>
              <label>Your Role *</label>
              <select name="role" value={joinData.role} onChange={handleJoinInputChange} required>
                <option value="divorcee">Divorcee</option>
                <option value="mediator">Mediator</option>
                <option value="admin">Admin</option>
                <option value="lawyer">Lawyer</option>
              </select>
            </div>
            <div className="actions">
              <button type="submit" className="btn primary" disabled={state.loading}>
                {state.loading ? 'Joining...' : 'Join Session'}
              </button>
              <button type="button" onClick={() => setShowJoinForm(false)} className="btn ghost">Back to Start Session</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SessionSetup;
