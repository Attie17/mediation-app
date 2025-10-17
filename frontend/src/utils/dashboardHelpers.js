/**
 * Dashboard utility functions for consistent UI elements
 */

/**
 * Get time-based greeting
 * @returns {string} - "morning", "afternoon", or "evening"
 */
export function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

/**
 * Get greeting message based on time of day
 * @returns {string} - "Good morning", "Good afternoon", or "Good evening"
 */
export function getGreeting() {
  const timeOfDay = getTimeOfDay();
  return `Good ${timeOfDay}`;
}

/**
 * Get role-specific emoji
 * @param {string} role - User role (admin, mediator, lawyer, divorcee)
 * @returns {string} - Emoji for the role
 */
export function getRoleEmoji(role) {
  const emojis = {
    admin: '🛡️',
    mediator: '⚖️',
    lawyer: '👔',
    divorcee: '👤'
  };
  return emojis[role] || '👋';
}

/**
 * Get role-specific title
 * @param {string} role - User role
 * @returns {string} - Formatted role title
 */
export function getRoleTitle(role) {
  const titles = {
    admin: 'Admin',
    mediator: 'Mediator',
    lawyer: 'Lawyer',
    divorcee: 'User'
  };
  return titles[role] || 'User';
}

/**
 * Get dashboard header for a role
 * @param {string} role - User role
 * @param {string} userName - User's display name
 * @returns {object} - { title, subtitle }
 */
export function getDashboardHeader(role, userName, stats = {}) {
  const greeting = getGreeting();
  const emoji = getRoleEmoji(role);
  const name = userName || 'there';

  // Dynamic subtitles based on role and data
  const subtitles = {
    admin: stats.activeCases > 0
      ? `Managing ${stats.totalUsers || 0} users and ${stats.activeCases} active cases`
      : 'System overview and management tools',
    
    mediator: stats.pendingReviews > 0
      ? `You have ${stats.activeCases || 0} active cases and ${stats.pendingReviews} pending reviews`
      : stats.activeCases > 0
      ? `You have ${stats.activeCases} active ${stats.activeCases === 1 ? 'case' : 'cases'}`
      : "You're all caught up! Ready to make a difference today.",
    
    lawyer: stats.clientCases > 0
      ? `You're representing ${stats.clientCases} ${stats.clientCases === 1 ? 'client' : 'clients'} in mediation`
      : 'Ready to provide expert legal guidance',
    
    divorcee: 'Let\'s continue your journey together. You\'re making great progress.'
  };

  return {
    title: `${greeting}, ${name} ${emoji}`,
    subtitle: subtitles[role] || `Welcome to your ${role} dashboard`
  };
}
