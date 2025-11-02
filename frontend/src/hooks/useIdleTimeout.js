import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for idle timeout detection and auto-logout
 * @param {Function} onIdle - Callback function to execute when user is idle
 * @param {number} timeout - Timeout duration in milliseconds (default: 15 minutes)
 * @param {number} warningTime - Time before timeout to show warning in milliseconds (default: 1 minute)
 */
export function useIdleTimeout(onIdle, timeout = 15 * 60 * 1000, warningTime = 60 * 1000) {
  const [isIdle, setIsIdle] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(timeout);
  const timeoutIdRef = useRef(null);
  const warningTimeoutIdRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Reset the idle timer
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setIsIdle(false);
    setShowWarning(false);
    setTimeRemaining(timeout);

    // Clear existing timers
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    if (warningTimeoutIdRef.current) {
      clearTimeout(warningTimeoutIdRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Set warning timeout (1 minute before auto-logout)
    warningTimeoutIdRef.current = setTimeout(() => {
      setShowWarning(true);
      
      // Start countdown
      countdownIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - lastActivityRef.current;
        const remaining = timeout - elapsed;
        
        if (remaining > 0) {
          setTimeRemaining(remaining);
        } else {
          clearInterval(countdownIntervalRef.current);
        }
      }, 1000);
    }, timeout - warningTime);

    // Set final timeout for auto-logout
    timeoutIdRef.current = setTimeout(() => {
      setIsIdle(true);
      setShowWarning(false);
      if (onIdle) {
        onIdle();
      }
    }, timeout);
  }, [timeout, warningTime, onIdle]);

  useEffect(() => {
    // List of events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    // Reset timer on any activity
    const handleActivity = () => {
      if (!isIdle) {
        resetTimer();
      }
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Start the timer initially
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      if (warningTimeoutIdRef.current) {
        clearTimeout(warningTimeoutIdRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [resetTimer, isIdle]);

  return {
    isIdle,
    showWarning,
    timeRemaining,
    resetTimer
  };
}
