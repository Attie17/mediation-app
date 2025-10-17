import express from 'express';
import { pool } from '../db.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { validate as isUuid } from 'uuid';

const router = express.Router();

router.use(authenticateUser);

const VALID_ROLES = new Set(['admin', 'mediator', 'lawyer', 'divorcee']);

// Helper: uniform error response
function sendError(res, status, code, message) {
  return res.status(status).json({ ok: false, error: { code, message } });
}

// Ensure a profile row exists for current user
async function ensureProfile(userId, email) {
  try {
    const sel = await pool.query(
      `SELECT user_id, email, name, preferred_name, phone, address, avatar_url, role, created_at, updated_at
       FROM app_users WHERE user_id=$1 LIMIT 1`,
      [userId]
    );
    if (sel.rows[0]) return sel.rows[0];
    const ins = await pool.query(
      `INSERT INTO app_users(user_id, email) VALUES($1,$2)
       RETURNING user_id, email, name, preferred_name, phone, address, avatar_url, role, created_at, updated_at`,
      [userId, email || null]
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
    console.log(`[users:me:get] ${timestamp} calling ensureProfile`, { userId, email: req.user.email });
    const profile = await ensureProfile(userId, req.user.email);
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
  const sql = `UPDATE app_users SET ${fields.join(', ')}, updated_at=NOW() WHERE user_id=$${idx} RETURNING user_id, email, name, preferred_name, phone, address, avatar_url, role, created_at, updated_at`;
    const { rows } = await pool.query(sql, values);
    if (!rows[0]) return sendError(res, 404, 'USR_NOT_FOUND', 'Profile not found');
    console.log('[users:me:put] ok', { userId, updated: fields });
    return res.json({ ok: true, user: rows[0] });
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

export default router;
