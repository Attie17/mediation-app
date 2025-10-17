import { pool } from '../db.js';

const ALLOWED_NOTIFICATION_TYPES = new Set(['info', 'upload', 'participant', 'note']);

function getClient(options) {
  const client = options?.client;
  if (client && typeof client.query === 'function') {
    return client;
  }
  return pool;
}

/**
 * Inserts a single notification row for the provided user.
 * @param {string} userId
 * @param {string} message
 * @param {string} type one of info|upload|participant|note
 * @param {{ client?: import('pg').PoolClient }} [options]
 * @returns {Promise<object|null>}
 */
export async function insertNotification(userId, message, type, options = {}) {
  const trimmedMessage = typeof message === 'string' ? message.trim() : '';
  const normalizedType = typeof type === 'string' ? type.trim().toLowerCase() : '';

  if (!userId) {
    throw new Error('insertNotification requires a userId');
  }

  if (!trimmedMessage) {
    throw new Error('insertNotification requires a non-empty message');
  }

  if (!ALLOWED_NOTIFICATION_TYPES.has(normalizedType)) {
    throw new Error(`insertNotification type must be one of ${Array.from(ALLOWED_NOTIFICATION_TYPES).join(', ')}`);
  }

  const client = getClient(options);

  const { rows } = await client.query(
    `INSERT INTO notifications (user_id, message, type)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, message, type, status, created_at`,
    [userId, trimmedMessage, normalizedType]
  );

  return rows[0] || null;
}

/**
 * Convenience helper to insert notifications for multiple users sequentially.
 * Returns an array of inserted rows and skips any duplicate user ids.
 */
export async function insertNotifications(users, message, type, options = {}) {
  const userIds = Array.isArray(users)
    ? Array.from(new Set(users.filter(Boolean).map(String)))
    : [];

  const results = [];
  for (const userId of userIds) {
    try {
      const row = await insertNotification(userId, message, type, options);
      if (row) {
        results.push(row);
      }
    } catch (error) {
      console.error('insertNotifications error:', error);
    }
  }
  return results;
}

export { ALLOWED_NOTIFICATION_TYPES };
