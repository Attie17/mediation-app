import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import SessionTimeoutWarning from '../components/SessionTimeoutWarning';

/**
 * SessionContext
 * Manages user session timeout and displays warning before auto-logout
 * 
 * Configuration:
 * - SESSION_TIMEOUT: 15 minutes (900,000ms)
 * - WARNING_TIME: 2 minutes before timeout (120,000ms before logout)
 * 
 * Features:
 * - Tracks user activity (mouse, keyboard, touch)
 * - Shows warning modal 2 minutes before logout
 * - Allows user to extend session
 * - Auto-logout on timeout
 */

const SessionContext = createContext(null);

// Session timeout: 15 minutes
const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

// Show warning 2 minutes before timeout
const WARNING_TIME = 2 * 60 * 1000; // 2 minutes in milliseconds

// Time until warning shows = SESSION_TIMEOUT - WARNING_TIME
const TIME_UNTIL_WARNING = SESSION_TIMEOUT - WARNING_TIME; // 13 minutes

export function SessionProvider({ children }) {
  const { user, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  
  const warningTimerRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Start session timers
  const startTimers = useCallback(() => {
    clearTimers();
    lastActivityRef.current = Date.now();
    setShowWarning(false);

    // Set warning timer (shows warning 2 minutes before logout)
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setSecondsRemaining(Math.floor(WARNING_TIME / 1000));

      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Set logout timer (logs out after warning period)
      logoutTimerRef.current = setTimeout(() => {
        handleLogout();
      }, WARNING_TIME);
    }, TIME_UNTIL_WARNING);
  }, [clearTimers]);

  // Reset session (called on user activity or manual extend)
  const resetSession = useCallback(() => {
    startTimers();
  }, [startTimers]);

  // Handle logout
  const handleLogout = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    logout();
  }, [clearTimers, logout]);

  // Handle user extending session
  const handleExtendSession = useCallback(() => {
    resetSession();
  }, [resetSession]);

  // Track user activity
  useEffect(() => {
    if (!user) {
      clearTimers();
      return;
    }

    // Start timers when user logs in
    startTimers();

    // Activity events to track
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle activity tracking (only reset once per minute)
    const throttleDelay = 60 * 1000; // 1 minute
    let throttleTimeout = null;

    const handleActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      // Only reset if enough time has passed since last activity
      if (timeSinceLastActivity > throttleDelay) {
        if (throttleTimeout) {
          clearTimeout(throttleTimeout);
        }
        throttleTimeout = setTimeout(() => {
          resetSession();
        }, 1000); // Debounce by 1 second
      }
    };

    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup
    return () => {
      clearTimers();
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, startTimers, resetSession, clearTimers]);

  // Context value
  const value = {
    resetSession,
    secondsRemaining,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
      {user && (
        <SessionTimeoutWarning
          open={showWarning}
          secondsRemaining={secondsRemaining}
          onExtend={handleExtendSession}
          onLogout={handleLogout}
        />
      )}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}

export default SessionContext;
