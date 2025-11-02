/**
 * AI Chat History Routes
 * Endpoints for storing and retrieving AI assistant conversations
 */

import express from 'express';
import { pool } from '../db.js';

const router = express.Router();

/**
 * POST /api/ai-chat-history
 * Save an AI chat message (user question or assistant response)
 */
router.post('/', async (req, res) => {
  try {
    const { case_id, user_id, role, content, confidence, disclaimer, web_search_suggested } = req.body;

    if (!case_id || !user_id || !role || !content) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields: case_id, user_id, role, content'
      });
    }

    if (!['user', 'assistant'].includes(role)) {
      return res.status(400).json({
        ok: false,
        error: 'Role must be either "user" or "assistant"'
      });
    }

    const result = await pool.query(`
      INSERT INTO ai_chat_history (case_id, user_id, role, content, confidence, disclaimer, web_search_suggested)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [case_id, user_id, role, content, confidence || null, disclaimer || null, web_search_suggested || false]);

    res.json({
      ok: true,
      message: result.rows[0]
    });

  } catch (error) {
    console.error('Error saving AI chat message:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to save chat message'
    });
  }
});

/**
 * GET /api/ai-chat-history/case/:caseId
 * Get all AI chat history for a case (for mediators to review)
 */
router.get('/case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.headers['x-dev-user-id'] || req.user?.user_id;

    if (!caseId) {
      return res.status(400).json({
        ok: false,
        error: 'Case ID is required'
      });
    }

    // Check if user has access to this case
    const accessCheck = await pool.query(`
      SELECT c.id 
      FROM cases c
      LEFT JOIN case_participants cp ON c.id = cp.case_id
      WHERE c.id::text = $1
      AND (c.mediator_id::text = $2 OR cp.user_id::text = $2)
    `, [caseId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({
        ok: false,
        error: 'Access denied to this case'
      });
    }

    // Get all chat history for this case with user info
    const result = await pool.query(`
      SELECT 
        ch.*,
        u.email as user_email,
        u.role as user_role
      FROM ai_chat_history ch
      JOIN app_users u ON ch.user_id = u.user_id
      WHERE ch.case_id::text = $1
      ORDER BY ch.created_at ASC
    `, [caseId]);

    res.json({
      ok: true,
      messages: result.rows
    });

  } catch (error) {
    console.error('Error fetching AI chat history:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch chat history'
    });
  }
});

/**
 * GET /api/ai-chat-history/user/:userId
 * Get AI chat history for a specific user across all their cases
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.headers['x-dev-user-id'] || req.user?.user_id;

    // Only allow users to view their own history (or mediators to view any)
    const requesterResult = await pool.query(
      'SELECT role FROM app_users WHERE user_id::text = $1',
      [requesterId]
    );

    if (requesterResult.rows.length === 0) {
      return res.status(403).json({
        ok: false,
        error: 'Access denied'
      });
    }

    const isMediator = requesterResult.rows[0].role === 'mediator';
    const isSelf = requesterId === userId;

    if (!isMediator && !isSelf) {
      return res.status(403).json({
        ok: false,
        error: 'Access denied - can only view own chat history'
      });
    }

    const result = await pool.query(`
      SELECT 
        ch.*,
        c.reference_number as case_reference
      FROM ai_chat_history ch
      JOIN cases c ON ch.case_id = c.id
      WHERE ch.user_id::text = $1
      ORDER BY ch.created_at DESC
    `, [userId]);

    res.json({
      ok: true,
      messages: result.rows
    });

  } catch (error) {
    console.error('Error fetching user AI chat history:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch chat history'
    });
  }
});

export default router;
