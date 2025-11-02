import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for polling data at regular intervals
 * 
 * @param {Function} callback - Function to call on each poll
 * @param {number} interval - Polling interval in milliseconds (default: 30000 = 30 seconds)
 * @param {boolean} enabled - Whether polling is enabled (default: true)
 * @param {Array} dependencies - Dependencies that should trigger immediate re-fetch
 */
export function usePolling(callback, interval = 30000, enabled = true, dependencies = []) {
  const savedCallback = useRef();
  const intervalId = useRef();

  // Save the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (!enabled) {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
      return;
    }

    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }

    // Call immediately on mount or dependency change
    tick();

    // Then set up interval
    intervalId.current = setInterval(tick, interval);

    // Cleanup
    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [interval, enabled, ...dependencies]);

  // Manual trigger function
  const trigger = useCallback(() => {
    if (savedCallback.current) {
      savedCallback.current();
    }
  }, []);

  return { trigger };
}

/**
 * Hook for polling notifications
 * 
 * @param {Function} fetchNotifications - Function to fetch notifications
 * @param {number} interval - Polling interval (default: 30000ms)
 */
export function useNotificationPolling(fetchNotifications, interval = 30000) {
  return usePolling(fetchNotifications, interval, true);
}

/**
 * Hook for polling dashboard stats
 * 
 * @param {Function} fetchStats - Function to fetch stats
 * @param {number} interval - Polling interval (default: 60000ms)
 */
export function useStatsPolling(fetchStats, interval = 60000) {
  return usePolling(fetchStats, interval, true);
}

/**
 * Hook for polling case updates
 * 
 * @param {Function} fetchCases - Function to fetch cases
 * @param {string} caseId - Optional case ID to watch (triggers immediate refresh when changed)
 * @param {number} interval - Polling interval (default: 45000ms)
 */
export function useCasePolling(fetchCases, caseId = null, interval = 45000) {
  return usePolling(fetchCases, interval, true, caseId ? [caseId] : []);
}

export default usePolling;
