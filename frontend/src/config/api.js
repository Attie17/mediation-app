/**
 * API Configuration
 * Centralized API base URL configuration
 */

import config from './index';

export const API_BASE_URL = config.api.baseUrl;

/**
 * API Endpoints
 * Organized by feature/resource
 */
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
  },

  // Dashboard
  dashboard: {
    stats: (role, userId) => `/dashboard/stats/${role}/${userId}`,
    adminStats: '/dashboard/stats/admin',
  },

  // Cases
  cases: {
    list: (userId, role) => role ? `/api/cases/user/${userId}?role=${role}` : `/api/cases/user/${userId}`,
    listAll: (params) => `/api/caseslist${params ? '?' + new URLSearchParams(params).toString() : ''}`,
    create: '/api/cases',
    get: (caseId) => `/api/cases/${caseId}`,
    update: (caseId) => `/api/cases/${caseId}`,
    updateStatus: (caseId) => `/api/cases/${caseId}/status`,
    delete: (caseId) => `/api/cases/${caseId}`,
    close: (caseId) => `/api/cases/${caseId}/close`,
    reopen: (caseId) => `/api/cases/${caseId}/reopen`,
    uploads: (caseId) => `/api/cases/${caseId}/uploads`,
    participants: (caseId) => `/api/cases/${caseId}/participants`,
    requirements: (caseId) => `/api/cases/${caseId}/requirements`,
    notes: (caseId) => `/api/cases/${caseId}/notes`,
    invite: (caseId) => `/api/cases/${caseId}/invite`,
  },

  // Sessions
  sessions: {
    list: (userId) => `/api/sessions/user/${userId}`,
    create: '/api/sessions',
    get: (sessionId) => `/api/sessions/${sessionId}`,
    update: (sessionId) => `/api/sessions/${sessionId}`,
    delete: (sessionId) => `/api/sessions/${sessionId}`,
  },

  // Uploads
  uploads: {
    list: (status) => `/api/uploads/list${status ? `?status=${status}` : ''}`,
    pending: '/api/uploads/pending',
    review: (uploadId) => `/api/uploads/${uploadId}/review`,
    confirm: (uploadId) => `/api/uploads/${uploadId}/confirm`,
    reject: '/api/uploads/reject',
  },

  // Chat
  chat: {
    channels: (channelId) => `/api/chat/channels/${channelId}/messages`,
    sendMessage: (channelId) => `/api/chat/channels/${channelId}/messages`,
    deleteMessage: (messageId) => `/api/chat/messages/${messageId}`,
    caseMessages: (caseId) => `/api/chat/cases/${caseId}/messages`,
  },

  // AI
  ai: {
    health: '/api/ai/health',
    summarize: '/api/ai/summarize',
    analyzeTone: '/api/ai/analyze-tone',
    suggestRephrase: '/api/ai/suggest-rephrase',
    assessRisk: '/api/ai/assess-risk',
    insights: (caseId) => `/api/ai/insights/${caseId}`,
    analyzeEmotion: '/api/ai/analyze-emotion',
    extractKeyPoints: '/api/ai/extract-key-points',
    suggestPhrasing: '/api/ai/suggest-phrasing',
    legalGuidance: '/api/ai/legal-guidance',
  },

  // Participants
  participants: {
    invite: '/api/participants/invite',
    list: (caseId) => `/api/cases/${caseId}/participants`,
    remove: '/api/participants/remove',
    activate: (caseId, participantId) => `/api/cases/${caseId}/participants/${participantId}/activate`,
  },

  // Users
  users: {
    list: '/api/users',
    get: (userId) => `/api/users/${userId}`,
    update: (userId) => `/api/users/${userId}`,
    delete: (userId) => `/api/users/${userId}`,
  },

  // Admin
  admin: {
    stats: '/api/admin/stats',
    activity: '/api/admin/activity',
    invite: '/api/admin/invite',
  },
  
  // Notifications
  notifications: {
    list: '/api/notifications',
    get: (id) => `/api/notifications/${id}`,
    markRead: (id) => `/api/notifications/${id}/read`,
    markAllRead: '/api/notifications/read-all',
    delete: (id) => `/api/notifications/${id}`,
    unreadCount: '/api/notifications/unread-count',
  },
};

/**
 * Helper function to build full URL
 * @param {string} endpoint - The endpoint path
 * @returns {string} - Full URL
 */
export const buildUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Helper function to get auth headers
 * @returns {Object} - Headers object with Authorization if token exists
 */
export const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Helper function to make authenticated fetch requests
 * @param {string} endpoint - The endpoint path
 * @param {Object} options - Fetch options
 * @returns {Promise} - Fetch promise
 */
export const fetchWithAuth = async (endpoint, options = {}) => {
  const url = buildUrl(endpoint);
  const headers = getAuthHeaders();
  
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  buildUrl,
  getAuthHeaders,
  fetchWithAuth,
};
