import express from 'express';
import { pool } from '../db.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();

router.use(authenticateUser);

// GET /api/notifications/user/:userId - Get all notifications for a user
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  const requestingUserId = req.user?.id;

  // Verify user can only access their own notifications
  if (requestingUserId !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, type, priority, title, message, read, metadata, action_url, created_at, read_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [userId]
    );

    return res.json(rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// POST /api/notifications - Create a new notification
router.post('/', async (req, res) => {
  const { user_id, type, priority = 'normal', title, message, metadata = {}, action_url } = req.body || {};

  if (!user_id || !type || !title || !message) {
    return res.status(400).json({ error: 'user_id, type, title, and message are required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, type, priority, title, message, metadata, action_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, type, priority, title, message, read, metadata, action_url, created_at`,
      [user_id, type, priority, title, message, JSON.stringify(metadata), action_url]
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({ error: 'Failed to create notification' });
  }
});

// PUT /api/notifications/:id/read - Mark a notification as read
router.put('/:id/read', async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE notifications
       SET read = true, read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, type, priority, title, message, read, metadata, action_url, created_at, read_at`,
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

// PUT /api/notifications/user/:userId/mark-all-read - Mark all notifications as read for a user
router.put('/user/:userId/mark-all-read', async (req, res) => {
  const { userId } = req.params;
  const requestingUserId = req.user?.id;

  if (requestingUserId !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const { rowCount } = await pool.query(
      `UPDATE notifications
       SET read = true, read_at = NOW()
       WHERE user_id = $1 AND read = false`,
      [userId]
    );

    return res.json({ success: true, updated: rowCount });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
});

router.delete('/:id', async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { rows } = await pool.query(
      `DELETE FROM notifications
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json({ success: true, data: { id: rows[0].id } });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ error: 'Failed to delete notification' });
  }
});

export default router;