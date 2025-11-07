import express from 'express';
import { pool } from '../db.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { validate as isUuid } from 'uuid';
import { logActivity } from '../lib/activityLogger.js';

const router = express.Router();

router.use(authenticateUser);

const VALID_ROLES = new Set(['admin', 'mediator', 'lawyer', 'divorcee']);

// Helper: uniform error response
function sendError(res, status, code, message) {
  return res.status(status).json({ ok: false, error: { code, message } });
}

// Ensure a profile row exists for current user
async function ensureProfile(userId, email, role = 'divorcee') {
  try {
    const sel = await pool.query(
      `SELECT user_id, email, name, preferred_name, phone, address, avatar_url, role, organization_id, profile_details, created_at, updated_at
       FROM app_users WHERE user_id=$1 LIMIT 1`,
      [userId]
    );
    if (sel.rows[0]) return sel.rows[0];
    
    // Default to divorcee if no role provided
    const userRole = VALID_ROLES.has(role) ? role : 'divorcee';
    
    const ins = await pool.query(
      `INSERT INTO app_users(user_id, email, role, profile_details) VALUES($1,$2,$3,$4)
       RETURNING user_id, email, name, preferred_name, phone, address, avatar_url, role, organization_id, profile_details, created_at, updated_at`,
      [userId, email || null, userRole, {}]
    );
    return ins.rows[0];
  } catch (e) {
    console.error('[users:ensureProfile] DB error', {
      message: e.message,
      code: e.code,
      detail: e.detail,
      table: e.table,
      constraint: e.constraint,
      stack: e.stack,
    });
    throw e;
  }
}

// GET /api/users/me - hydrate profile
router.get('/me', async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[users:me:get] ${timestamp} ENTER`, { userId: req.user?.id, email: req.user?.email, hasUser: !!req.user });
  try {
    const userId = req.user?.id;
    if (!userId) {
      console.log(`[users:me:get] ${timestamp} UNAUTHORIZED - no userId`);
      return sendError(res, 401, 'USR_UNAUTHORIZED', 'Unauthorized');
    }
    
    // In dev mode, if database fails, return mock user
    if (req.user.dev && process.env.DEV_AUTH_ENABLED === 'true') {
      console.log(`[users:me:get] ${timestamp} DEV MODE - returning mock user`);
      const mockUser = {
        user_id: userId,
        id: userId,
        email: req.user.email,
        name: req.user.name || req.user.email.split('@')[0],
        role: req.user.role || 'divorcee',
        organization_id: 'b325cbce-0a4c-4658-ac15-f6b4e8bbe62e',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        dev: true
      };
      return res.json({ ok: true, user: mockUser });
    }
    
    console.log(`[users:me:get] ${timestamp} calling ensureProfile`, { userId, email: req.user.email });
    const profile = await ensureProfile(userId, req.user.email, req.user.role);
    console.log(`[users:me:get] ${timestamp} OK`, { userId: profile.user_id, role: profile.role });
    return res.json({ ok: true, user: profile });
  } catch (err) {
    console.error(`[users:me:get] ${timestamp} ERROR`, {
      message: err.message,
      code: err.code,
      detail: err.detail,
      constraint: err.constraint,
      table: err.table,
      stack: err.stack,
    });
    
    // In dev mode, fallback to mock user even on error
    if (req.user?.dev && process.env.DEV_AUTH_ENABLED === 'true') {
      console.log(`[users:me:get] ${timestamp} DEV MODE FALLBACK - returning mock user after error`);
      const mockUser = {
        user_id: req.user.id,
        id: req.user.id,
        email: req.user.email,
        name: req.user.name || req.user.email.split('@')[0],
        role: req.user.role || 'divorcee',
        organization_id: 'b325cbce-0a4c-4658-ac15-f6b4e8bbe62e',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        dev: true
      };
      return res.json({ ok: true, user: mockUser });
    }
    
    return sendError(res, 500, 'USR_GET_FAILED', `Failed to fetch profile: ${err.message}`);
  }
});

// PUT /api/users/me - partial update
router.put('/me', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return sendError(res, 401, 'USR_UNAUTHORIZED', 'Unauthorized');
    if (!isUuid(userId)) {
      return sendError(res, 400, 'USR_INVALID_ID', 'User id is not a valid UUID (dev normalization failed)');
    }
    console.log('[users:me:put] enter', { userId });
    const { name, preferredName, phone, address, avatarUrl } = req.body || {};
    // Basic validation
    if (address && typeof address !== 'object') {
      return sendError(res, 400, 'USR_INVALID_ADDRESS', 'address must be object');
    }
    const fields = [];
    const values = [];
    let idx = 1;
    function push(field, value, column) {
      fields.push(`${column}=$${idx}`);
      values.push(value);
      idx += 1;
    }
    if (name !== undefined) push('name', name, 'name');
    if (preferredName !== undefined) push('preferred_name', preferredName, 'preferred_name');
    if (phone !== undefined) push('phone', phone, 'phone');
    if (address !== undefined) push('address', address, 'address');
    if (avatarUrl !== undefined) push('avatar_url', avatarUrl, 'avatar_url');
    if (fields.length === 0) return sendError(res, 400, 'USR_NO_FIELDS', 'No updatable fields provided');
    values.push(userId);
  const sql = `UPDATE app_users SET ${fields.join(', ')}, updated_at=NOW() WHERE user_id=$${idx} RETURNING user_id, email, name, preferred_name, phone, address, avatar_url, role, profile_details, created_at, updated_at`;
    const { rows } = await pool.query(sql, values);
    if (!rows[0]) return sendError(res, 404, 'USR_NOT_FOUND', 'Profile not found');
    
    // Normalize snake_case to camelCase for frontend
    const normalizedUser = {
      user_id: rows[0].user_id,
      email: rows[0].email,
      name: rows[0].name,
      preferredName: rows[0].preferred_name,
      phone: rows[0].phone,
      address: rows[0].address,
      avatarUrl: rows[0].avatar_url,
      role: rows[0].role,
      profile_details: rows[0].profile_details,
      created_at: rows[0].created_at,
      updated_at: rows[0].updated_at
    };
    
    console.log('[users:me:put] ok', { userId, updated: fields });
    return res.json({ ok: true, user: normalizedUser });
  } catch (err) {
    console.error('[users:me:put] error', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      stack: err.stack,
    });
    return sendError(res, 500, 'USR_UPDATE_FAILED', 'Failed to update profile');
  }
});

// POST /api/users/profile - save comprehensive role-specific profile
router.post('/profile', async (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`[users:profile:post] ${timestamp} ENTER`, { userId: req.user?.id, role: req.user?.role });
  try {
    const userId = req.user?.id;
    if (!userId) {
      console.log(`[users:profile:post] ${timestamp} UNAUTHORIZED - no userId`);
      return sendError(res, 401, 'USR_UNAUTHORIZED', 'Unauthorized');
    }
    if (!isUuid(userId)) {
      return sendError(res, 400, 'USR_INVALID_ID', 'User id is not a valid UUID');
    }

    // Extract common fields
    const { name, preferredName, phone, address: addressData, avatarUrl, role, profileDetails } = req.body || {};

    // Validate role if provided
    if (role && !VALID_ROLES.has(role)) {
      return sendError(res, 400, 'USR_INVALID_ROLE', 'Invalid role');
    }

    // Ensure profile row exists for this user (idempotent)
  await ensureProfile(userId, req.user?.email, role || req.user?.role);

    // Build address JSON from different possible formats
    let address = addressData;
    if (typeof addressData === 'string') {
      // If address is a string, convert to JSON
      address = { street: addressData };
    } else if (req.body.officeAddress) {
      // Lawyer specific
      address = { street: req.body.officeAddress };
    }

    // Prepare fields for update
    const fields = [];
    const values = [];
    let idx = 1;

    function push(column, value) {
      fields.push(`${column}=$${idx}`);
      values.push(value);
      idx += 1;
    }

    // Common fields
    if (name !== undefined) push('name', name);
    if (preferredName !== undefined) push('preferred_name', preferredName);
    if (phone !== undefined) push('phone', phone);
    if (address !== undefined) push('address', address);
    if (avatarUrl !== undefined) push('avatar_url', avatarUrl);
    if (role !== undefined) push('role', role);
    if (profileDetails !== undefined) {
      if (profileDetails && typeof profileDetails === 'object') {
        push('profile_details', profileDetails);
      } else {
        return sendError(res, 400, 'USR_INVALID_PROFILE_DETAILS', 'profileDetails must be an object');
      }
    }

    // Check if we have at least one field to update
    if (fields.length === 0) {
      return sendError(res, 400, 'USR_NO_FIELDS', 'No profile fields provided');
    }

    // Add userId for WHERE clause
    values.push(userId);
    
    const sql = `UPDATE app_users 
                 SET ${fields.join(', ')}, updated_at=NOW() 
                 WHERE user_id=$${idx} 
                 RETURNING user_id, email, name, preferred_name, phone, address, avatar_url, role, created_at, updated_at`;
    
    console.log(`[users:profile:post] ${timestamp} executing SQL`, { fieldsCount: fields.length, userId });
    const { rows } = await pool.query(sql, values);
    
    if (!rows[0]) {
      console.log(`[users:profile:post] ${timestamp} NOT_FOUND - profile doesn't exist`);
      return sendError(res, 404, 'USR_NOT_FOUND', 'Profile not found');
    }

  console.log(`[users:profile:post] ${timestamp} OK`, { userId: rows[0].user_id, role: rows[0].role });
  return res.json({ ok: true, user: rows[0] });
  } catch (err) {
    console.error(`[users:profile:post] ${timestamp} ERROR`, {
      message: err.message,
      code: err.code,
      detail: err.detail,
      constraint: err.constraint,
      table: err.table,
      stack: err.stack,
    });
    return sendError(res, 500, 'USR_PROFILE_FAILED', `Failed to save profile: ${err.message}`);
  }
});

// GET /api/users - admin only list of users
router.get('/', async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { rows } = await pool.query(
      `SELECT user_id, email, name, role, created_at, updated_at
       FROM app_users
       ORDER BY created_at DESC NULLS LAST, email ASC`
    );

    return res.json({ users: rows });
  } catch (err) {
    console.error('[users:list] error', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      stack: err.stack,
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/users/:id/role - admin only change role
router.patch('/:id/role', async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const targetId = req.params.id;
    const { role } = req.body ?? {};

    if (!role || !VALID_ROLES.has(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const { rows } = await pool.query(
      `UPDATE app_users
         SET role = $2,
             updated_at = NOW()
       WHERE user_id = $1
       RETURNING user_id, email, name, role, updated_at`,
      [targetId, role]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: rows[0] });
  } catch (err) {
    console.error('[users:patchRole] error', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      stack: err.stack,
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/users/:id/role - admin only change role (alternative endpoint)
router.put('/admin/users/:id/role', async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const targetId = req.params.id;
    const { role } = req.body ?? {};

    if (!role || !VALID_ROLES.has(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Get current user info for logging
    const { rows: userRows } = await pool.query(
      `SELECT user_id, email, role FROM app_users WHERE user_id = $1`,
      [targetId]
    );

    if (!userRows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const previousRole = userRows[0].role;

    // Prevent last admin from demoting themselves
    if (role !== 'admin' && targetId === req.user?.id) {
      const { rows: adminCount } = await pool.query(
        `SELECT COUNT(*) as count FROM app_users WHERE role = 'admin'`
      );
      if (parseInt(adminCount[0].count) <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last admin user' });
      }
    }

    const { rows } = await pool.query(
      `UPDATE app_users
         SET role = $2,
             updated_at = NOW()
       WHERE user_id = $1
       RETURNING user_id, email, name, role, updated_at`,
      [targetId, role]
    );

    console.log(`[users:admin:updateRole] Admin ${req.user.email} changed user ${rows[0].email} role to ${role}`);

    // Log the activity
    await logActivity({
      userId: req.user.id,
      actionType: 'USER_ROLE_CHANGED',
      targetType: 'user',
      targetId: targetId,
      description: `Changed role of ${rows[0].email} from ${previousRole} to ${role}`,
      metadata: {
        previousRole,
        newRole: role,
        targetEmail: rows[0].email
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    return res.json({ ok: true, user: rows[0] });
  } catch (err) {
    console.error('[users:admin:updateRole] error', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      stack: err.stack,
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/users/:id - admin only delete user
router.delete('/admin/users/:id', async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const targetId = req.params.id;

    // Prevent admin from deleting themselves
    if (targetId === req.user?.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Check if user exists and get their role
    const { rows: userRows } = await pool.query(
      `SELECT user_id, email, role FROM app_users WHERE user_id = $1`,
      [targetId]
    );

    if (!userRows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting the last admin
    if (userRows[0].role === 'admin') {
      const { rows: adminCount } = await pool.query(
        `SELECT COUNT(*) as count FROM app_users WHERE role = 'admin'`
      );
      if (parseInt(adminCount[0].count) <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }

    // Delete user (CASCADE should handle related records)
    await pool.query(
      `DELETE FROM app_users WHERE user_id = $1`,
      [targetId]
    );

    console.log(`[users:admin:delete] Admin ${req.user.email} deleted user ${userRows[0].email}`);

    // Log the activity
    await logActivity({
      userId: req.user.id,
      actionType: 'USER_DELETED',
      targetType: 'user',
      targetId: targetId,
      description: `Deleted user ${userRows[0].email}`,
      metadata: {
        deletedEmail: userRows[0].email,
        deletedRole: userRows[0].role
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    return res.json({ ok: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('[users:admin:delete] error', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      stack: err.stack,
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
