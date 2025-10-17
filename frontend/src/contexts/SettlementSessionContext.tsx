import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Import supabase client from main app's structure
// Note: This will need to be adapted to main app's supabase setup

// Action types for the session reducer
type SessionAction = 
  | { type: 'SET_SESSION'; payload: any | null }
  | { type: 'SET_CURRENT_PARTY'; payload: 'party1' | 'party2' }
  | { type: 'SET_CASE'; payload: any | null }
  | { type: 'SET_FORM_SECTIONS'; payload: any[] }
  | { type: 'UPDATE_FORM_SECTION'; payload: any }
  | { type: 'SET_APPROVALS'; payload: any[] }
  | { type: 'UPDATE_APPROVAL'; payload: any }
  | { type: 'SET_CONFLICTS'; payload: any[] }
  | { type: 'ADD_CONFLICT'; payload: any }
  | { type: 'SET_CHAT_LOGS'; payload: any[] }
  | { type: 'ADD_CHAT_LOG'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Session state interface
interface SessionState {
  session: any | null;
  case: any | null;
  formSections: any[];
  approvals: any[];
  conflicts: any[];
  chatLogs: any[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: SessionState = {
  session: null,
  case: null,
  formSections: [],
  approvals: [],
  conflicts: [],
  chatLogs: [],
  loading: false,
  error: null
};

// Session reducer
function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, session: action.payload };
    case 'SET_CURRENT_PARTY':
      return { 
        ...state, 
        session: state.session ? { ...state.session, current_party: action.payload } : null 
      };
    case 'SET_CASE':
      return { ...state, case: action.payload };
    case 'SET_FORM_SECTIONS':
      return { ...state, formSections: action.payload };
    case 'UPDATE_FORM_SECTION':
      return {
        ...state,
        formSections: state.formSections.map(section =>
          section.id === action.payload.id ? action.payload : section
        )
      };
    case 'SET_APPROVALS':
      return { ...state, approvals: action.payload };
    case 'UPDATE_APPROVAL':
      return {
        ...state,
        approvals: state.approvals.map(approval =>
          approval.id === action.payload.id ? action.payload : approval
        )
      };
    case 'SET_CONFLICTS':
      return { ...state, conflicts: action.payload };
    case 'ADD_CONFLICT':
      return { ...state, conflicts: [...state.conflicts, action.payload] };
    case 'SET_CHAT_LOGS':
      return { ...state, chatLogs: action.payload };
    case 'ADD_CHAT_LOG':
      return { ...state, chatLogs: [...state.chatLogs, action.payload] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

// Session context interface
interface SessionContextType {
  state: SessionState;
  startSession: (sessionData: {
    mode: 'individual' | 'collaborative';
    party1_name: string;
    party2_name?: string;
    mediator_name?: string;
    case_reference?: string;
  }) => Promise<void>;
  joinSession: (sessionId: string, party2_name: string) => Promise<void>;
  switchParty: () => Promise<void>;
  updateFormSection: (sectionName: string, data: Record<string, any>) => Promise<void>;
  updateApproval: (sectionName: string, party: 'party1' | 'party2', approved: boolean, notes?: string) => Promise<void>;
  addConflict: (sectionName: string, reason: string, party1Position?: string, party2Position?: string) => Promise<void>;
  addChatMessage: (message: string, userType: 'party1' | 'party2' | 'mediator') => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  endSession: () => void;
}

// Create context
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Provider component
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('active-settlement-session');
    if (savedSession) {
      try {
        const sessionData = JSON.parse(savedSession);
        loadSession(sessionData.id);
      } catch (error) {
        console.error('Error loading saved session:', error);
        localStorage.removeItem('active-settlement-session');
      }
    }
  }, []);

  // Start a new session
  const startSession = async (sessionData: {
    mode: 'individual' | 'collaborative';
    party1_name: string;
    party2_name?: string;
    mediator_name?: string;
    case_reference?: string;
  }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Use main app's API endpoint
      const response = await fetch('/api/settlement-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          mode: sessionData.mode,
          party1_name: sessionData.party1_name,
          party2_name: sessionData.party2_name || null,
          mediator_name: sessionData.mediator_name || null,
          case_reference: sessionData.case_reference || null,
          current_party: 'party1'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const session = await response.json();
      dispatch({ type: 'SET_SESSION', payload: session });
      
      // Save to localStorage for persistence
      localStorage.setItem('active-settlement-session', JSON.stringify({ id: session.id }));

      // Initialize form sections
      await initializeFormSections(session.id);

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to start session' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Join an existing session (for individual mode)
  const joinSession = async (sessionId: string, party2_name: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const response = await fetch(`/api/settlement-sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ party2_name })
      });

      if (!response.ok) {
        throw new Error('Failed to join session');
      }

      await loadSession(sessionId);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to join session' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Switch party (for individual mode)
  const switchParty = async () => {
    if (!state.session || state.session.mode !== 'individual') return;

    try {
      const newParty = state.session.current_party === 'party1' ? 'party2' : 'party1';
      
      const response = await fetch(`/api/settlement-sessions/${state.session.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ current_party: newParty })
      });

      if (!response.ok) {
        throw new Error('Failed to switch party');
      }

      dispatch({ type: 'SET_CURRENT_PARTY', payload: newParty });
      
      // Update localStorage
      localStorage.setItem('active-settlement-session', JSON.stringify({ id: state.session.id }));

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to switch party' });
    }
  };

  // Update form section data
  const updateFormSection = async (sectionName: string, data: Record<string, any>) => {
    if (!state.session) return;

    try {
      const response = await fetch(`/api/settlement-sessions/${state.session.id}/sections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          section_name: sectionName,
          form_data: data
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update form section');
      }

      const updatedSection = await response.json();
      dispatch({ type: 'UPDATE_FORM_SECTION', payload: updatedSection });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update form section' });
    }
  };

  // Update approval status
  const updateApproval = async (sectionName: string, party: 'party1' | 'party2', approved: boolean, notes?: string) => {
    if (!state.session) return;

    try {
      const response = await fetch(`/api/settlement-sessions/${state.session.id}/approvals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          section_name: sectionName,
          party: party,
          approved: approved,
          notes: notes || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update approval');
      }

      const updatedApproval = await response.json();
      dispatch({ type: 'UPDATE_APPROVAL', payload: updatedApproval });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to update approval' });
    }
  };

  // Add a conflict
  const addConflict = async (sectionName: string, reason: string, party1Position?: string, party2Position?: string) => {
    if (!state.session) return;

    try {
      const response = await fetch(`/api/settlement-sessions/${state.session.id}/conflicts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          section_name: sectionName,
          conflict_reason: reason,
          party1_position: party1Position || null,
          party2_position: party2Position || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add conflict');
      }

      const newConflict = await response.json();
      dispatch({ type: 'ADD_CONFLICT', payload: newConflict });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add conflict' });
    }
  };

  // Add chat message
  const addChatMessage = async (message: string, userType: 'party1' | 'party2' | 'mediator') => {
    if (!state.session) return;

    try {
      const response = await fetch(`/api/settlement-sessions/${state.session.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message: message,
          user_type: userType,
          message_type: 'user'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add chat message');
      }

      const newChatLog = await response.json();
      dispatch({ type: 'ADD_CHAT_LOG', payload: newChatLog });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to add chat message' });
    }
  };

  // Load session data
  const loadSession = async (sessionId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Load session
      const sessionResponse = await fetch(`/api/settlement-sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to load session');
      }

      const session = await sessionResponse.json();
      dispatch({ type: 'SET_SESSION', payload: session });

      // Load related data
      await Promise.all([
        loadFormSections(sessionId),
        loadApprovals(sessionId),
        loadConflicts(sessionId),
        loadChatLogs(sessionId)
      ]);

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to load session' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // End session
  const endSession = () => {
    dispatch({ type: 'SET_SESSION', payload: null });
    dispatch({ type: 'SET_CASE', payload: null });
    dispatch({ type: 'SET_FORM_SECTIONS', payload: [] });
    dispatch({ type: 'SET_APPROVALS', payload: [] });
    dispatch({ type: 'SET_CONFLICTS', payload: [] });
    dispatch({ type: 'SET_CHAT_LOGS', payload: [] });
    localStorage.removeItem('active-settlement-session');
  };

  // Helper functions
  const initializeFormSections = async (sessionId: string) => {
    const sections = [
      { name: 'annexure-a', title: 'Annexure A — Parenting Plan' },
      { name: 'annexure-b', title: 'Annexure B — Maintenance' },
      { name: 'annexure-c', title: 'Annexure C — Property Division' }
    ];

    for (const section of sections) {
      await fetch(`/api/settlement-sessions/${sessionId}/sections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          section_name: section.name,
          form_data: {}
        })
      });
    }
  };

  const loadFormSections = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/settlement-sessions/${sessionId}/sections`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_FORM_SECTIONS', payload: data || [] });
      }
    } catch (error) {
      console.error('Error loading form sections:', error);
    }
  };

  const loadApprovals = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/settlement-sessions/${sessionId}/approvals`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_APPROVALS', payload: data || [] });
      }
    } catch (error) {
      console.error('Error loading approvals:', error);
    }
  };

  const loadConflicts = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/settlement-sessions/${sessionId}/conflicts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_CONFLICTS', payload: data || [] });
      }
    } catch (error) {
      console.error('Error loading conflicts:', error);
    }
  };

  const loadChatLogs = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/settlement-sessions/${sessionId}/chat`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_CHAT_LOGS', payload: data || [] });
      }
    } catch (error) {
      console.error('Error loading chat logs:', error);
    }
  };

  const contextValue: SessionContextType = {
    state,
    startSession,
    joinSession,
    switchParty,
    updateFormSection,
    updateApproval,
    addConflict,
    addChatMessage,
    loadSession,
    endSession
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

// Hook to use session context
export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}