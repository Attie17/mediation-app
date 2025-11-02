import { useEffect } from 'react';

/**
 * Dev mode component - sets devMode flag but does NOT auto-login
 * Use the Dev menu in TopNavigationBar to manually select a role
 */

// Run dev setup IMMEDIATELY before React renders
const initDevMode = () => {
  // Always set dev mode flag for localhost
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocalhost) {
    localStorage.setItem('devMode', 'true');
    console.log('🔧 Dev Mode enabled - use Dev menu to login');
  }
  
  // DO NOT auto-login - let the user choose via the Dev menu
};

// Execute immediately
initDevMode();

export default function DevAutoLogin() {
  return null; // This component doesn't render anything
}
