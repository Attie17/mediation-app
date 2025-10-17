import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, bindTokenGetter } from '../lib/apiClient';

export const AuthContext = createContext();

const STORAGE_KEY = 'auth_token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Bind token getter to apiClient
  bindTokenGetter(() => token);

  const setTokenPersist = (t) => {
    setToken(t);
    if (t) localStorage.setItem(STORAGE_KEY, t);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const refreshMe = React.useCallback(async () => {
    if (!token) { setUser(null); return; }
    const me = await apiFetch('/api/users/me');
    setUser(me.user);
  }, [token]);

  const register = React.useCallback(async (email, password, name, role) => {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST', 
      body: JSON.stringify({ email, password, name, role })
    });
    setTokenPersist(res.token);
    // Profile will be fetched by useEffect when token changes
  }, []);

  const login = React.useCallback(async (email, password) => {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST', 
      body: JSON.stringify({ email, password })
    });
    setTokenPersist(res.token);
    // Profile will be fetched by useEffect when token changes
  }, []);

  const logout = React.useCallback(() => { 
    setTokenPersist(null); 
    setUser(null);
    // Clear all other localStorage items that might cache user data
    localStorage.removeItem('user');
    localStorage.removeItem('activeCaseId');
    localStorage.removeItem('devMode');
    localStorage.removeItem('lastRoute');
  }, []);

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

  const value = useMemo(() => ({ 
    user, 
    token, 
    loading, 
    register, 
    login, 
    logout, 
    refreshMe 
  }), [user, token, loading, register, login, logout, refreshMe]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
