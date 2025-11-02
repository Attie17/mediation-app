// Conversations API Routes
// Handles conversation-based messaging for case participants

import express from 'express';
import { pool } from '../db.js';
import devAuth from '../middleware/devAuth.js';

const router = express.Router();

// Helper to get user ID from request (supports both devAuth and real auth)
const getUserId = (req) => req.user?.user_id || req.user?.id;

// Apply dev auth middleware to all routes
router.use(devAuth);

// ============================================================================
// GET /api/conversations/case/:caseId - Get all conversations for a case
// ============================================================================
router.get('/case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = getUserId(req); // Support both formats

    console.log('[DEBUG] GET /api/conversations/case/:caseId');
    console.log('  caseId:', caseId);
    console.log('  userId:', userId);
    console.log('  req.user:', req.user);

    // Verify user has access to this case
    const accessCheck = await pool.query(`
      SELECT c.id 
      FROM cases c
      LEFT JOIN case_participants cp ON c.id = cp.case_id
      WHERE c.id::text = $1
      AND (c.mediator_id::text = $2 OR cp.user_id::text = $2)
    `, [caseId, userId]);

    console.log('  accessCheck rows:', accessCheck.rows.length);

    if (accessCheck.rows.length === 0) {
      console.log('  ❌ ACCESS DENIED');
      return res.status(403).json({ 
        ok: false, 
        error: 'Access denied to this case' 
      });
    }

    // Get all conversations for this case that the user is part of
    const result = await pool.query(`
      SELECT 
        c.id,
        c.case_id,
        c.conversation_type,
        c.title,
        c.created_at,
        c.updated_at,
        (
          SELECT COUNT(*)::int 
          FROM messages m
          JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
          WHERE m.conversation_id = c.id
          AND cp.user_id::text = $2
          AND m.sender_id::text != $2
          AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
        ) as unread_count,
        (
          SELECT COUNT(*)::int 
          FROM messages m 
          WHERE m.conversation_id = c.id
        ) as message_count,
        (
          SELECT m.content
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message_content,
        (
          SELECT m.created_at
          FROM messages m
          WHERE m.conversation_id = c.id
          ORDER BY m.created_at DESC
          LIMIT 1
        ) as last_message_at,
        (
          SELECT json_agg(json_build_object(
            'user_id', u.user_id,
            'email', u.email,
            'role', u.role
          ))
          FROM conversation_participants cp
          JOIN app_users u ON cp.user_id = u.user_id
          WHERE cp.conversation_id = c.id
        ) as participants
      FROM conversations c
      JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE c.case_id::text = $1
      AND cp.user_id::text = $2
      ORDER BY c.conversation_type, c.created_at
    `, [caseId, userId]);

    res.json({
      ok: true,
      conversations: result.rows
    });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch conversations' 
    });
  }
});

// ============================================================================
// GET /api/conversations/:conversationId - Get conversation details
// ============================================================================
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = getUserId(req);

    // Verify user is a participant
    const accessCheck = await pool.query(`
      SELECT 1 
      FROM conversation_participants 
      WHERE conversation_id = $1::uuid 
      AND user_id = $2::uuid
    `, [conversationId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ 
        ok: false, 
        error: 'Access denied to this conversation' 
      });
    }

    // Get conversation details
    const result = await pool.query(`
      SELECT 
        c.id,
        c.case_id,
        c.conversation_type,
        c.title,
        c.created_at,
        c.updated_at,
        (
          SELECT json_agg(json_build_object(
            'user_id', u.user_id,
            'email', u.email,
            
            
            'role', u.role,
            'last_read_at', cp.last_read_at
          ))
          FROM conversation_participants cp
          JOIN app_users u ON cp.user_id = u.user_id
          WHERE cp.conversation_id = c.id
        ) as participants
      FROM conversations c
      WHERE c.id = $1::uuid
    `, [conversationId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Conversation not found' 
      });
    }

    res.json({
      ok: true,
      conversation: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch conversation' 
    });
  }
});

// ============================================================================
// POST /api/conversations - Create new conversation
// ============================================================================
router.post('/', async (req, res) => {
  try {
    const { case_id, conversation_type, title, participant_ids } = req.body;
    const userId = getUserId(req);

    // Validate required fields
    if (!conversation_type || !participant_ids || participant_ids.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Missing required fields: conversation_type, participant_ids' 
      });
    }

    // Verify user has access to the case (if case-based conversation)
    if (case_id) {
      const accessCheck = await pool.query(`
        SELECT c.id 
        FROM cases c
        LEFT JOIN case_participants cp ON c.id = cp.case_id
        WHERE c.id = $1::uuid
        AND (c.mediator_id = $2::uuid OR cp.user_id = $2::uuid)
      `, [case_id, userId]);

      if (accessCheck.rows.length === 0) {
        return res.status(403).json({ 
          ok: false, 
          error: 'Access denied to this case' 
        });
      }
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create conversation
      const conversationResult = await client.query(`
        INSERT INTO conversations (case_id, conversation_type, title, created_by)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [case_id || null, conversation_type, title, userId]);

      const conversation = conversationResult.rows[0];

      // Add participants
      for (const participantId of participant_ids) {
        await client.query(`
          INSERT INTO conversation_participants (conversation_id, user_id, role)
          VALUES ($1, $2, 'participant')
          ON CONFLICT (conversation_id, user_id) DO NOTHING
        `, [conversation.id, participantId]);
      }

      await client.query('COMMIT');

      // Fetch complete conversation with participants
      const result = await client.query(`
        SELECT 
          c.*,
          (
            SELECT json_agg(json_build_object(
              'user_id', u.user_id,
              'email', u.email,
              
              
              'role', u.role
            ))
            FROM conversation_participants cp
            JOIN app_users u ON cp.user_id = u.user_id
            WHERE cp.conversation_id = c.id
          ) as participants
        FROM conversations c
        WHERE c.id = $1
      `, [conversation.id]);

      res.json({
        ok: true,
        conversation: result.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to create conversation' 
    });
  }
});

// ============================================================================
// GET /api/conversations/:conversationId/messages - Get messages in conversation
// ============================================================================
router.get('/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = getUserId(req);
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;

    // Verify user is a participant
    const accessCheck = await pool.query(`
      SELECT 1 
      FROM conversation_participants 
      WHERE conversation_id = $1::uuid 
      AND user_id = $2::uuid
    `, [conversationId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ 
        ok: false, 
        error: 'Access denied to this conversation' 
      });
    }

    // Get messages
    const result = await pool.query(`
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.attachments,
        m.read_at,
        m.created_at,
        m.updated_at,
        u.email as sender_email,
        
        
        u.role as sender_role
      FROM messages m
      JOIN app_users u ON m.sender_id = u.user_id
      WHERE m.conversation_id = $1::uuid
      ORDER BY m.created_at ASC
      LIMIT $2 OFFSET $3
    `, [conversationId, limit, offset]);

    res.json({
      ok: true,
      messages: result.rows
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch messages' 
    });
  }
});

// ============================================================================
// POST /api/conversations/:conversationId/messages - Send message to conversation
// ============================================================================
router.post('/:conversationId/messages', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { content, attachments } = req.body;
    const userId = getUserId(req);

    // Validate
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        ok: false, 
        error: 'Message content is required' 
      });
    }

    // Verify user is a participant and get case_id
    const accessCheck = await pool.query(`
      SELECT c.case_id 
      FROM conversation_participants cp
      JOIN conversations c ON cp.conversation_id = c.id
      WHERE cp.conversation_id = $1::uuid 
      AND cp.user_id = $2::uuid
    `, [conversationId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ 
        ok: false, 
        error: 'Access denied to this conversation' 
      });
    }

    const caseId = accessCheck.rows[0].case_id;

    // Insert message with case_id
    const result = await pool.query(`
      INSERT INTO messages (conversation_id, case_id, sender_id, content, attachments)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [conversationId, caseId, userId, content.trim(), JSON.stringify(attachments || [])]);

    const message = result.rows[0];

    // Get sender details
    const senderResult = await pool.query(`
      SELECT user_id, email, role
      FROM app_users
      WHERE user_id = $1
    `, [userId]);

    res.json({
      ok: true,
      message: {
        ...message,
        sender_email: senderResult.rows[0].email,
        
        
        sender_role: senderResult.rows[0].role
      }
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to send message' 
    });
  }
});

// ============================================================================
// POST /api/conversations/:conversationId/read - Mark conversation as read
// ============================================================================
router.post('/:conversationId/read', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = getUserId(req);

    // Update last_read_at
    const result = await pool.query(`
      UPDATE conversation_participants
      SET last_read_at = NOW()
      WHERE conversation_id = $1::uuid
      AND user_id = $2::uuid
      RETURNING last_read_at
    `, [conversationId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        ok: false, 
        error: 'Not a participant in this conversation' 
      });
    }

    res.json({
      ok: true,
      last_read_at: result.rows[0].last_read_at
    });

  } catch (error) {
    console.error('Error marking conversation as read:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to mark as read' 
    });
  }
});

// ============================================================================
// GET /api/conversations/unread/count - Get total unread count for user
// ============================================================================
router.get('/unread/count', async (req, res) => {
  try {
    const userId = getUserId(req);

    const result = await pool.query(`
      SELECT get_user_unread_count($1::uuid) as unread_count
    `, [userId]);

    res.json({
      ok: true,
      unread: result.rows[0].unread_count || 0
    });

  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to get unread count' 
    });
  }
});

// ============================================================================
// GET /api/conversations/admin/all - Admin: Get all support conversations
// ============================================================================
router.get('/admin/all', async (req, res) => {
  try {
    const userId = getUserId(req);
    const userRole = req.user.role;

    // Verify admin role
    if (userRole !== 'admin') {
      return res.status(403).json({ 
        ok: false, 
        error: 'Admin access required' 
      });
    }

    // Get all admin_support conversations
    const result = await pool.query(`
      SELECT 
        c.id,
        c.conversation_type,
        c.title,
        c.created_at,
        c.updated_at,
        (
          SELECT COUNT(*)::int 
          FROM messages m 
          WHERE m.conversation_id = c.id
        ) as message_count,
        (
          SELECT json_agg(json_build_object(
            'user_id', u.user_id,
            'email', u.email,
            
            
            'role', u.role
          ))
          FROM conversation_participants cp
          JOIN app_users u ON cp.user_id = u.user_id
          WHERE cp.conversation_id = c.id
        ) as participants
      FROM conversations c
      WHERE c.conversation_type = 'admin_support'
      ORDER BY c.updated_at DESC
    `);

    res.json({
      ok: true,
      conversations: result.rows
    });

  } catch (error) {
    console.error('Error fetching admin conversations:', error);
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to fetch conversations' 
    });
  }
});

export default router;
// trigger restart
