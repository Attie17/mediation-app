import express from 'express';
import { pool } from '../db.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import aiService from '../services/aiService.js';

const router = express.Router();

// All chat routes require authentication
router.use(authenticateUser);

/**
 * Process AI analysis for a new message
 * @param {Object} message - The created message object
 * @param {string} caseId - The case ID
 * @param {string} userId - The user ID who created the message
 */
async function processMessageAIAnalysis(message, caseId, userId) {
  console.log(`[chat:ai-analysis] Processing AI analysis for message ${message.id}`);
  console.log(`[chat:ai-analysis] Message content: "${message.content.substring(0, 50)}..."`);
  console.log(`[chat:ai-analysis] Case ID: ${caseId}, User ID: ${userId}`);
  
  try {
    // Analyze tone of the message
    console.log(`[chat:ai-analysis] Calling AI service for tone analysis...`);
    const toneAnalysis = await aiService.analyzeTone(message.content);
    console.log(`[chat:ai-analysis] Tone analysis result:`, toneAnalysis);
    
    // Assess escalation risk
    console.log(`[chat:ai-analysis] Calling AI service for risk assessment...`);
    const riskAssessment = await aiService.assessEscalationRisk(message.content);
    console.log(`[chat:ai-analysis] Risk assessment result:`, riskAssessment);
    
    // Store tone analysis insight
    if (toneAnalysis) {
      await pool.query(`
        INSERT INTO ai_insights (case_id, created_by, insight_type, content, metadata)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        caseId,
        userId,
        'tone_analysis',
        toneAnalysis,
        { 
          message_id: message.id,
          analysis_timestamp: new Date().toISOString(),
          auto_generated: true 
        }
      ]);
      console.log(`[chat:ai-analysis] Stored tone analysis for message ${message.id}`);
    }
    
    // Store risk assessment insight
    if (riskAssessment) {
      await pool.query(`
        INSERT INTO ai_insights (case_id, created_by, insight_type, content, metadata)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        caseId,
        userId,
        'risk_assessment',
        riskAssessment,
        { 
          message_id: message.id,
          analysis_timestamp: new Date().toISOString(),
          auto_generated: true,
          risk_level: riskAssessment.risk_level || 'unknown'
        }
      ]);
      console.log(`[chat:ai-analysis] Stored risk assessment for message ${message.id}`);
    }
    
  } catch (error) {
    console.error(`[chat:ai-analysis] Failed to process AI analysis for message ${message.id}:`, error.message);
    throw error;
  }
}

/**
 * GET /api/chat/channels/:channelId/messages
 * Fetch all messages for a specific channel
 */
router.get('/channels/:channelId/messages', async (req, res) => {
  const { channelId } = req.params;
  const user = req.user;

  try {
    console.log(`[chat:messages:get] fetching messages for channel ${channelId} by user ${user.id}`);

    // Fetch messages with sender info
    const { rows } = await pool.query(`
      SELECT 
        m.id,
        m.channel_id,
        m.sender_id,
        m.sender_role,
        m.content,
        m.created_at,
        m.case_id,
        u.name as sender_name,
        u.email as sender_email
      FROM public.chat_messages m
      LEFT JOIN public.app_users u ON m.sender_id = u.user_id
      WHERE m.channel_id = $1
      ORDER BY m.created_at ASC
    `, [channelId]);

    console.log(`[chat:messages:get] found ${rows.length} messages`);

    return res.json({
      ok: true,
      messages: rows,
      count: rows.length,
    });

  } catch (err) {
    console.error('[chat:messages:get] error:', err);
    return res.status(500).json({
      ok: false,
      error: {
        code: 'FETCH_MESSAGES_FAILED',
        message: 'Failed to fetch messages',
      },
    });
  }
});

/**
 * POST /api/chat/channels/:channelId/messages
 * Create a new message in a channel
 */
router.post('/channels/:channelId/messages', async (req, res) => {
  const { channelId } = req.params;
  const { content } = req.body;
  const user = req.user;

  try {
    if (!user || !user.id) {
      console.error('[chat:messages:post] no user in request');
      return res.status(401).json({
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    console.log(`[chat:messages:post] user ${user.id} sending message to channel ${channelId}`);

    // Validate content
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_CONTENT',
          message: 'Message content is required and must be non-empty',
        },
      });
    }

    if (content.length > 10000) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'CONTENT_TOO_LONG',
          message: 'Message content must be 10,000 characters or less',
        },
      });
    }

    // Fetch channel to get case_id (don't trust client to provide it)
    const channelQuery = await pool.query(
      'SELECT case_id FROM chat_channels WHERE id = $1',
      [channelId]
    );

    if (channelQuery.rows.length === 0) {
      console.error(`[chat:messages:post] Channel ${channelId} not found`);
      return res.status(404).json({
        ok: false,
        error: {
          code: 'CHANNEL_NOT_FOUND',
          message: 'Channel not found',
        },
      });
    }

    const case_id = channelQuery.rows[0].case_id;
    console.log(`[chat:messages:post] Channel ${channelId} has case_id: ${case_id || 'null'}`);

    // Insert message
    const { rows } = await pool.query(`
      INSERT INTO public.chat_messages (
        channel_id,
        sender_id,
        sender_role,
        content,
        case_id,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING 
        id,
        channel_id,
        sender_id,
        sender_role,
        content,
        created_at,
        case_id
    `, [channelId, user.id, user.role || 'divorcee', content.trim(), case_id || null]);

    const message = rows[0];

    // Add sender info
    const enriched = {
      ...message,
      sender_name: user.name || 'Unknown User',
      sender_email: user.email || '',
    };

    console.log(`[chat:messages:post] created message ${message.id}`);

    // Trigger AI analysis in background (don't block response)
    if (case_id) {
      console.log(`[chat:messages:post] Triggering AI analysis for message ${message.id}, case ${case_id}`);
      setImmediate(async () => {
        try {
          console.log(`[chat:ai-analysis] Starting AI analysis for message ${message.id}`);
          await processMessageAIAnalysis(message, case_id, user.id);
          console.log(`[chat:ai-analysis] Completed AI analysis for message ${message.id}`);
        } catch (aiError) {
          console.error('[chat:messages:post] AI analysis failed:', aiError.message);
          console.error('[chat:messages:post] AI analysis stack:', aiError.stack);
          // Don't fail the message creation if AI analysis fails
        }
      });
    } else {
      console.log(`[chat:messages:post] No case_id provided, skipping AI analysis for message ${message.id}`);
    }

    return res.status(201).json({
      ok: true,
      message: enriched,
    });

  } catch (err) {
    console.error('[chat:messages:post] error:', err.message);
    console.error('[chat:messages:post] stack:', err.stack);
    console.error('[chat:messages:post] detail:', err.detail);
    return res.status(500).json({
      ok: false,
      error: {
        code: 'CREATE_MESSAGE_FAILED',
        message: err.message || 'Failed to create message',
        detail: err.detail,
      },
    });
  }
});

/**
 * GET /api/chat/cases/:caseId/messages
 * Fetch all messages for a specific case (across all channels)
 */
router.get('/cases/:caseId/messages', async (req, res) => {
  const { caseId } = req.params;
  const user = req.user;
  const { limit = 100, offset = 0 } = req.query;

  try {
    if (!user || !user.id) {
      console.error('[chat:case-messages:get] no user in request');
      return res.status(401).json({
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    console.log(`[chat:case-messages:get] fetching messages for case ${caseId} by user ${user.id}`);

    // Verify user has access to this case
    const accessCheck = await pool.query(`
      SELECT 1 FROM public.case_participants
      WHERE case_id = $1 AND user_id = $2
    `, [caseId, user.id]);

    if (accessCheck.rows.length === 0 && user.role !== 'admin' && user.role !== 'mediator') {
      return res.status(403).json({
        ok: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have access to this case',
        },
      });
    }

    // Fetch messages for this case
    const { rows } = await pool.query(`
      SELECT 
        m.id,
        m.channel_id,
        m.sender_id,
        m.sender_role,
        m.content,
        m.created_at,
        m.case_id,
        u.name as sender_name,
        u.email as sender_email
      FROM public.chat_messages m
      LEFT JOIN public.app_users u ON m.sender_id = u.user_id
      WHERE m.case_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, [caseId, parseInt(limit), parseInt(offset)]);

    console.log(`[chat:case-messages:get] found ${rows.length} messages for case ${caseId}`);

    return res.json({
      ok: true,
      messages: rows,
      count: rows.length,
      case_id: caseId,
    });

  } catch (err) {
    console.error('[chat:case-messages:get] error:', err);
    return res.status(500).json({
      ok: false,
      error: {
        code: 'FETCH_CASE_MESSAGES_FAILED',
        message: 'Failed to fetch case messages',
      },
    });
  }
});

/**
 * DELETE /api/chat/messages/:messageId
 * Delete a message (only by sender or admin/mediator)
 */
router.delete('/messages/:messageId', async (req, res) => {
  const { messageId } = req.params;
  const user = req.user;

  try {
    console.log(`[chat:messages:delete] user ${user.id} deleting message ${messageId}`);

    // Check if message exists and get sender
    const checkResult = await pool.query(`
      SELECT sender_id FROM public.chat_messages WHERE id = $1
    `, [messageId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: {
          code: 'MESSAGE_NOT_FOUND',
          message: 'Message not found',
        },
      });
    }

    const senderId = checkResult.rows[0].sender_id;

    // Check permissions: only sender, admin, or mediator can delete
    if (senderId !== user.id && user.role !== 'admin' && user.role !== 'mediator') {
      return res.status(403).json({
        ok: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You can only delete your own messages',
        },
      });
    }

    // Delete the message
    await pool.query(`
      DELETE FROM public.chat_messages WHERE id = $1
    `, [messageId]);

    console.log(`[chat:messages:delete] deleted message ${messageId}`);

    return res.json({
      ok: true,
      message: 'Message deleted successfully',
    });

  } catch (err) {
    console.error('[chat:messages:delete] error:', err);
    return res.status(500).json({
      ok: false,
      error: {
        code: 'DELETE_MESSAGE_FAILED',
        message: 'Failed to delete message',
      },
    });
  }
});

export default router;
