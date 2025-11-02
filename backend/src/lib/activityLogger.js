import { pool } from '../db.js';

/**
 * Log admin activity to database
 * @param {Object} params - Activity details
 * @param {string} params.userId - User performing the action
 * @param {string} params.actionType - Type of action (e.g., 'USER_ROLE_CHANGED', 'USER_DELETED')
 * @param {string} params.targetType - Type of target (e.g., 'user', 'case')
 * @param {string} params.targetId - ID of the target entity
 * @param {string} params.description - Human-readable description
 * @param {Object} params.metadata - Additional context (JSON)
 * @param {string} params.ipAddress - IP address of the request
 * @param {string} params.userAgent - User agent string
 */
export async function logActivity({
  userId,
  actionType,
  targetType,
  targetId,
  description,
  metadata = {},
  ipAddress,
  userAgent
}) {
  try {
    await pool.query(`
      INSERT INTO admin_activity_log (
        user_id, 
        action_type, 
        target_type, 
        target_id, 
        description, 
        metadata, 
        ip_address, 
        user_agent
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      userId,
      actionType,
      targetType,
      targetId,
      description,
      JSON.stringify(metadata),
      ipAddress,
      userAgent
    ]);

    console.log(`[activity] ${actionType}: ${description}`);
  } catch (error) {
    // Don't throw - logging failure shouldn't break the request
    console.error('[activity] Failed to log activity:', error.message);
  }
}

/**
 * Get recent admin activity
 * @param {number} limit - Number of records to fetch
 * @returns {Promise<Array>} Activity logs
 */
export async function getRecentActivity(limit = 50) {
  try {
    const result = await pool.query(`
      SELECT 
        al.*,
        au.email as user_email,
        au.name as user_name
      FROM admin_activity_log al
      LEFT JOIN app_users au ON al.user_id = au.user_id
      ORDER BY al.created_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows;
  } catch (error) {
    console.error('[activity] Failed to fetch activity:', error.message);
    return [];
  }
}

/**
 * Get activity for a specific user
 * @param {string} userId - User ID
 * @param {number} limit - Number of records to fetch
 * @returns {Promise<Array>} Activity logs
 */
export async function getUserActivity(userId, limit = 50) {
  try {
    const result = await pool.query(`
      SELECT *
      FROM admin_activity_log
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `, [userId, limit]);

    return result.rows;
  } catch (error) {
    console.error('[activity] Failed to fetch user activity:', error.message);
    return [];
  }
}
