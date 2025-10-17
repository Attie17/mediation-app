import { pool } from '../db.js';
import { insertNotifications } from './notifications.js';

const LEGACY_TYPE_MAP = {
  participant_invite: 'participant',
  participant_update: 'participant',
  participant_delete: 'participant',
  note_added: 'note',
  requirement_update: 'info',
  upload: 'upload',
};

function normalizeOptions(targetRole) {
  if (!targetRole) {
    return {};
  }

  if (typeof targetRole === 'string') {
    return { role: targetRole };
  }

  if (Array.isArray(targetRole)) {
    return { userIds: targetRole };
  }

  if (typeof targetRole === 'object') {
    return { ...targetRole };
  }

  return {};
}

export async function notifyUsers(caseId, type, message, targetRole) {
  if (!caseId || !type || !message) {
    return [];
  }

  const normalizedType = LEGACY_TYPE_MAP[type] || 'info';
  const options = normalizeOptions(targetRole);
  const roleFilter = options.role;
  const explicitUserIds = Array.isArray(options.userIds) ? options.userIds : null;
  const excludeUserIds = Array.isArray(options.excludeUserIds)
    ? new Set(options.excludeUserIds.map(String))
    : new Set();

  const client = await pool.connect();

  try {
    let userIds = explicitUserIds;

    if (!userIds || userIds.length === 0) {
      const params = [caseId];
      let query = `
        SELECT DISTINCT cp.user_id
        FROM case_participants cp
        WHERE cp.case_id = $1
      `;

      if (roleFilter) {
        params.push(roleFilter);
        query += ` AND cp.role = $2`;
      }

      const { rows } = await client.query(query, params);
      userIds = rows.map((row) => row.user_id);
    }

    if (excludeUserIds.size) {
      userIds = userIds.filter((id) => !excludeUserIds.has(String(id)));
    }

    const uniqueIds = Array.from(new Set(userIds.map(String)));
    if (uniqueIds.length === 0) {
      return [];
    }

    if (uniqueIds.length === 0) {
      return [];
    }

    return insertNotifications(uniqueIds, message, normalizedType, { client });
  } catch (error) {
    console.error('notifyUsers error:', error);
    return [];
  } finally {
    client.release();
  }
}

export default { notifyUsers };
