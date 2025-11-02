import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

/**
 * GET /api/messages/case/:caseId
 * Get all messages for a case (with sender info)
 * 
 * Access: Authenticated users who are part of the case
 */
router.get('/case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Verify user has access to this case (check if user is mediator or participant)
    const caseCheck = await pool.query(
      `SELECT c.id FROM cases c
       LEFT JOIN case_participants cp ON c.id = cp.case_id
       WHERE c.id = $1::uuid
       AND (c.mediator_id = $2::uuid OR cp.user_id = $2::uuid)
       LIMIT 1`,
      [caseId, userId]
    );

    if (caseCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this case' });
    }

    // Fetch messages with sender information
    const result = await pool.query(
      `SELECT 
        m.id,
        m.case_id,
        m.sender_id,
        m.recipient_id,
        m.content,
        m.attachments,
        m.read_at,
        m.created_at,
        m.updated_at,
        sender.email as sender_email,
        sender.role as sender_role,
        recipient.email as recipient_email,
        recipient.role as recipient_role
       FROM messages m
       LEFT JOIN app_users sender ON m.sender_id = sender.user_id
       LEFT JOIN app_users recipient ON m.recipient_id = recipient.user_id
       WHERE m.case_id = $1::uuid
       ORDER BY m.created_at ASC`,
      [caseId]
    );

    // Get case participants for UI
    // Get all participants (mediator + case participants)
    const participants = await pool.query(
      `SELECT DISTINCT
        u.user_id as id,
        u.email,
        u.role,
        COALESCE(cp.role, 
          CASE WHEN u.user_id = c.mediator_id THEN 'mediator' ELSE 'participant' END
        ) as case_role
       FROM cases c
       LEFT JOIN case_participants cp ON c.id = cp.case_id
       LEFT JOIN app_users u ON (u.user_id = c.mediator_id OR u.user_id = cp.user_id)
       WHERE c.id = $1::uuid
       AND u.user_id IS NOT NULL`,
      [caseId]
    );

    res.json({
      ok: true,
      messages: result.rows,
      participants: participants.rows
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * POST /api/messages
 * Send a new message
 * 
 * Body: { case_id, recipient_id, content, attachments }
 */
router.post('/', async (req, res) => {
  try {
    const { case_id, recipient_id, content, attachments = [] } = req.body;
    const sender_id = req.user?.id;

    if (!sender_id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Validate required fields
    if (!case_id || !recipient_id || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields: case_id, recipient_id, content' 
      });
    }

    // Validate content is not empty
    if (content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }

    // Verify sender has access to this case
    const caseCheck = await pool.query(
      `SELECT c.id FROM cases c
       LEFT JOIN case_participants cp ON c.id = cp.case_id
       WHERE c.id = $1::uuid 
       AND (c.mediator_id = $2::uuid OR cp.user_id = $2::uuid)
       LIMIT 1`,
      [case_id, sender_id]
    );

    if (caseCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this case' });
    }

    // Verify recipient is part of the case
    const recipientCheck = await pool.query(
      `SELECT c.id FROM cases c
       LEFT JOIN case_participants cp ON c.id = cp.case_id
       WHERE c.id = $1::uuid 
       AND (c.mediator_id = $2::uuid OR cp.user_id = $2::uuid)
       LIMIT 1`,
      [case_id, recipient_id]
    );

    if (recipientCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Recipient is not part of this case' });
    }

    // Insert message
    const result = await pool.query(
      `INSERT INTO messages (case_id, sender_id, recipient_id, content, attachments)
       VALUES ($1::uuid, $2, $3, $4, $5)
       RETURNING *`,
      [case_id, sender_id, recipient_id, content, JSON.stringify(attachments)]
    );

    res.status(201).json({
      ok: true,
      message: result.rows[0]
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * POST /api/messages/:messageId/read
 * Mark a message as read
 * 
 * Only the recipient can mark a message as read
 */
router.post('/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Update message read_at timestamp
    const result = await pool.query(
      `UPDATE messages
       SET read_at = NOW()
       WHERE id = $1
       AND recipient_id = $2
       AND read_at IS NULL
       RETURNING *`,
      [messageId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Message not found or already read' 
      });
    }

    res.json({
      ok: true,
      read_at: result.rows[0].read_at
    });

  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

/**
 * POST /api/messages/bulk-read
 * Mark multiple messages as read (for when user opens conversation)
 * 
 * Body: { message_ids: [uuid, uuid, ...] }
 */
router.post('/bulk-read', async (req, res) => {
  try {
    const { message_ids } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!Array.isArray(message_ids) || message_ids.length === 0) {
      return res.status(400).json({ error: 'message_ids must be a non-empty array' });
    }

    // Update all messages in the list
    const result = await pool.query(
      `UPDATE messages
       SET read_at = NOW()
       WHERE id = ANY($1::uuid[])
       AND recipient_id = $2
       AND read_at IS NULL
       RETURNING id`,
      [message_ids, userId]
    );

    res.json({
      ok: true,
      marked_read: result.rows.length
    });

  } catch (error) {
    console.error('Error bulk marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

/**
 * GET /api/messages/unread/count
 * DEPRECATED - Use /api/conversations API instead
 * 
 * This endpoint is disabled as the new Conversations API handles unread counts.
 * The old 'messages' table schema with recipient_id is no longer used.
 */
router.get('/unread/count', async (req, res) => {
  // Return 0 to prevent errors in old UI components
  res.json({
    ok: true,
    unread: 0,
    deprecated: true,
    message: 'Please use /api/conversations API for unread counts'
  });
});

/**
 * GET /api/messages/conversations
 * Get list of conversations (grouped by case) with latest message
 * 
 * Useful for inbox view showing all conversations
 */
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const result = await pool.query(
      `SELECT 
        c.id as case_id,
        c.created_at as case_created_at,
        latest.content as latest_message,
        latest.sender_id as latest_sender_id,
        latest.created_at as latest_message_at,
        sender.email as latest_sender_email,
        sender.role as latest_sender_role,
        COUNT(unread.id) as unread_count
       FROM cases c
       LEFT JOIN case_participants cp ON c.id = cp.case_id
       LEFT JOIN LATERAL (
         SELECT * FROM messages m
         WHERE m.case_id = c.id
         ORDER BY m.created_at DESC
         LIMIT 1
       ) latest ON true
       LEFT JOIN app_users sender ON latest.sender_id = sender.user_id
       LEFT JOIN messages unread ON unread.case_id = c.id 
         AND unread.recipient_id = $1::uuid 
         AND unread.read_at IS NULL
       WHERE (c.mediator_id = $1::uuid OR cp.user_id = $1::uuid)
       GROUP BY c.id, c.created_at, latest.content, latest.sender_id, 
                latest.created_at, sender.email, sender.role
       ORDER BY latest.created_at DESC NULLS LAST`,
      [userId]
    );

    res.json({
      ok: true,
      conversations: result.rows
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

export default router;
