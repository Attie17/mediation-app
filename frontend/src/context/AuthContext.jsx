import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, bindTokenGetter } from '../lib/apiClient';
import { useIdleTimeout } from '../hooks/useIdleTimeout';
import IdleWarningModal from '../components/IdleWarningModal';

export const AuthContext = createContext();

const STORAGE_KEY = 'auth_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bind token getter to apiClient - read from localStorage to ensure fresh value
  bindTokenGetter(() => localStorage.getItem(STORAGE_KEY) || token);

  const setTokenPersist = (t) => {
    setToken(t);
    if (t) localStorage.setItem(STORAGE_KEY, t);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const refreshMe = React.useCallback(async () => {
    if (!token) { 
      console.log('[AuthContext:refreshMe] No token, skipping');
      setUser(null); 
      return; 
    }
    console.log('[AuthContext:refreshMe] Fetching /api/users/me with token:', token?.substring(0, 20) + '...');
    const me = await apiFetch('/api/users/me');
    console.log('[AuthContext:refreshMe] Got user:', me.user);
    setUser(me.user);
  }, [token]);

  const register = React.useCallback(async (email, password, name, role) => {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST', 
      body: JSON.stringify({ email, password, name, role })
    });
    console.log('[AuthContext:register] Response:', res);
    console.log('[AuthContext:register] Token:', res.token);
    setTokenPersist(res.token);
    console.log('[AuthContext:register] Token saved to localStorage:', localStorage.getItem(STORAGE_KEY));
    // Profile will be fetched by useEffect when token changes
  }, []);

  const updateUser = React.useCallback(async (updates = {}) => {
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );
    const res = await apiFetch('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify(filtered)
    });
    if (res?.user) {
      setUser(res.user);
    }
    return res?.user;
  }, [setUser]);

  const login = React.useCallback(async (email, password) => {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST', 
      body: JSON.stringify({ email, password })
    });
    setTokenPersist(res.token);
    // If login response includes user data, set it immediately
    if (res.user) {
      setUser(res.user);
    }
    // Profile will also be fetched by useEffect when token changes
  }, []);

  const logout = React.useCallback(() => { 
    setTokenPersist(null); 
    setUser(null);
    // Clear all other localStorage items that might cache user data
    localStorage.removeItem('user');
    localStorage.removeItem('token'); // Also remove the 'token' key used by dev mode
    localStorage.removeItem('activeCaseId');
    localStorage.removeItem('lastRoute');
    // Keep devMode flag so dev menu remains available, but clear auth state
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('case:active-changed'));
    }
  }, []);

  // Idle timeout hook - 15 minutes (900000ms)
  const { showWarning, timeRemaining, resetTimer } = useIdleTimeout(
    logout, // Auto-logout callback
    15 * 60 * 1000, // 15 minutes timeout
    60 * 1000 // Show warning 1 minute before
  );

  const handleStayActive = () => {
    resetTimer();
  };

  const handleLogoutNow = () => {
    logout();
  };

  // Listen for 401 events from apiClient
  useEffect(() => {
    const on401 = () => logout();
    window.addEventListener('app:unauthorized', on401);
    return () => window.removeEventListener('app:unauthorized', on401);
  }, [logout]);

  // Hydrate user on token change
  useEffect(() => { 
    (async () => { 
      try { 
        await refreshMe(); 
      } finally { 
        setLoading(false); 
      } 
    })(); 
  }, [token, refreshMe]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!user) return;
    if (localStorage.getItem('activeCaseId')) return;

    const role = user?.role;
    // Auto-select case for both mediators and divorcees
    if (role !== 'mediator' && role !== 'divorcee') return;

    const userId = user?.user_id || user?.id;
    if (!userId) return;

    let cancelled = false;

    (async () => {
      try {
        const data = await apiFetch(`/api/cases/user/${userId}`);
        const cases = Array.isArray(data?.cases) ? data.cases : [];
        if (!cancelled && cases.length > 0 && cases[0]?.id) {
          localStorage.setItem('activeCaseId', cases[0].id);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('case:active-changed'));
          }
          console.debug('[auth] Auto-selected active case', cases[0].id, 'for', role);
        }
      } catch (err) {
        console.warn('[auth] Unable to auto-select active case', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, token]);

  const value = useMemo(() => ({ 
    user, 
    token, 
    loading, 
    register, 
    login, 
    logout, 
    refreshMe,
    updateUser
  }), [user, token, loading, register, login, logout, refreshMe, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Only show idle warning modal if user is logged in */}
      {user && (
        <IdleWarningModal
          isOpen={showWarning}
          timeRemaining={timeRemaining}
          onStayActive={handleStayActive}
          onLogout={handleLogoutNow}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
