import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of your session data
export interface SessionData {
  sessionId?: string;
  mode?: string;
  participants?: Array<{ id: string; name: string; role: string }>;
  step?: number;
  formData?: Record<string, any>;
  [key: string]: any;
}

interface SessionContextType {
  session: SessionData;
  setSession: (data: SessionData) => void;
  updateSession: (data: Partial<SessionData>) => void;
  resetSession: () => void;
  state: {
    loading: boolean;
    error?: string | null;
  };
  startSession: (data: Partial<SessionData>) => Promise<void>;
  joinSession: (data: { sessionId: string; party2_name?: string; role?: string }) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSessionState] = useState<SessionData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setSession = (data: SessionData) => setSessionState(data);
  const updateSession = (data: Partial<SessionData>) =>
    setSessionState((prev) => ({ ...prev, ...data }));
  const resetSession = () => setSessionState({});

  // Simulate async session start
  const startSession = async (data: Partial<SessionData>) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call or logic
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSessionState((prev) => ({ ...prev, ...data, sessionId: prev.sessionId || Math.random().toString(36).slice(2) }));
    } catch (e: any) {
      setError(e.message || 'Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  // Simulate async join session
  const joinSession = async (data: { sessionId: string; party2_name?: string; role?: string }) => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call or logic
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSessionState((prev) => ({ ...prev, ...data }));
    } catch (e: any) {
      setError(e.message || 'Failed to join session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SessionContext.Provider value={{ session, setSession, updateSession, resetSession, state: { loading, error }, startSession, joinSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
