import express from 'express';
import { pool } from '../db.js';
import { authenticateUser } from '../middleware/authenticateUser.js';

const router = express.Router();

router.use(authenticateUser);

router.get('/', async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, user_id, message, type, status, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.post('/', async (req, res) => {
  const userId = req.user?.id;
  const { message, type } = req.body || {};

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (!message || !type) {
    return res.status(400).json({ error: 'Both message and type are required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, message, type, status)
       VALUES ($1, $2, $3, 'unread')
       RETURNING id, user_id, message, type, status, created_at`,
      [userId, message, type]
    );

    return res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({ error: 'Failed to create notification' });
  }
});

router.patch('/:id/read', async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE notifications
       SET status = 'read'
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, message, type, status, created_at`,
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ error: 'Failed to update notification' });
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