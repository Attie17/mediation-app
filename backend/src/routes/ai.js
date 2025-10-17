/**
 * Advanced AI Routes - Comprehensive AI-powered mediation assistance
 *
 * Core AI Features:
 * - Legal guidance and research (South African family law)
 * - Predictive analytics for agreement likelihood
 * - Advanced conflict resolution with pattern recognition
 * - Emotional intelligence and tone analysis
 * - Multi-language support with real-time translation
 * - Voice integration and accessibility features
 * - Machine learning for continuous improvement
 * - Cultural sensitivity and context awareness
 *
 * Enhanced Endpoints:
 * - POST /api/ai/legal-guidance - Legal information and guidance
 * - POST /api/ai/predict-agreement - Predict likelihood of agreement
 * - POST /api/ai/resolve-conflict - Advanced conflict resolution
 * - POST /api/ai/analyze-emotion - Emotional intelligence analysis
 * - POST /api/ai/translate - Multi-language translation
 * - POST /api/ai/process-voice - Voice input processing
 * - POST /api/ai/research-legal - Legal research and case law
 * - GET /api/ai/patterns/:sessionId - Identify success patterns
 * - POST /api/ai/feedback - Provide AI feedback for learning
 * - GET /api/ai/cultural-context/:culture - Get cultural considerations
 * - GET /api/ai/insights/:sessionId - Comprehensive session insights
 * - GET /api/ai/health - Advanced health check
 */

import express from 'express';
import { pool } from '../db.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import advancedAIService from '../services/advancedAIService.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateUser);

/**
 * GET /api/ai/health
 * Advanced AI service health check
 */
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await advancedAIService.healthCheck();
    
    // Additional health checks for our AI services
    const dbHealth = await checkDatabaseHealth();
    const modelHealth = await checkModelHealth();

    if (isHealthy && dbHealth && modelHealth) {
      return res.json({
        ok: true,
        status: 'healthy',
        message: 'Advanced AI system fully operational',
        services: {
          openai: isHealthy,
          database: dbHealth,
          models: modelHealth
        },
        capabilities: [
          'legal_guidance', 'predictive_analytics', 'conflict_resolution',
          'emotional_analysis', 'translation', 'voice_processing', 
          'pattern_recognition', 'cultural_sensitivity'
        ]
      });
    } else {
      return res.status(503).json({
        ok: false,
        error: { code: 'AI_SERVICE_UNAVAILABLE', message: 'AI service is not responding' },
      });
    }
  } catch (error) {
    console.error('[ai:health] error:', error);
    return res.status(500).json({
      ok: false,
      error: { code: 'HEALTH_CHECK_FAILED', message: error.message },
    });
  }
});

/**
 * POST /api/ai/summarize
 * Summarize text (chat transcript, notes, etc.)
 * Body: { text, context, case_id, save? }
 */
router.post('/summarize', async (req, res) => {
  const { text, context = 'text', case_id, save = true } = req.body;
  const user = req.user;

  console.log(`[ai:summarize] user ${user.id} requesting summary for case ${case_id}`);

  if (!text) {
    return res.status(400).json({
      ok: false,
      error: { code: 'TEXT_REQUIRED', message: 'Text to summarize is required' },
    });
  }

  try {
    // Generate summary
    const summary = await aiService.summarizeText(text, context);

    // Save to database if requested and case_id provided
    let insightId = null;
    if (save && case_id) {
      const result = await pool.query(
        `INSERT INTO ai_insights (case_id, insight_type, content, metadata, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          case_id,
          'summary',
          JSON.stringify(summary),
          JSON.stringify({ context, text_length: text.length }),
          user.id,
        ]
      );
      insightId = result.rows[0].id;
      console.log(`[ai:summarize] saved insight ${insightId}`);
    }

    return res.json({
      ok: true,
      data: {
        summary,
        insight_id: insightId,
      },
    });
  } catch (error) {
    console.error('[ai:summarize] error:', error);
    return res.status(500).json({
      ok: false,
      error: { code: 'SUMMARIZE_FAILED', message: error.message },
    });
  }
});

/**
 * POST /api/ai/analyze-tone
 * Analyze emotional tone of text
 * Body: { text, speaker?, case_id?, save? }
 */
router.post('/analyze-tone', async (req, res) => {
  const { text, speaker = 'participant', case_id, save = true } = req.body;
  const user = req.user;

  if (!text) {
    return res.status(400).json({
      ok: false,
      error: { code: 'TEXT_REQUIRED', message: 'Text to analyze is required' },
    });
  }

  try {
    const analysis = await aiService.analyzeTone(text, speaker);

    let insightId = null;
    if (save && case_id) {
      const result = await pool.query(
        `INSERT INTO ai_insights (case_id, insight_type, content, metadata, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          case_id,
          'tone_analysis',
          JSON.stringify(analysis),
          JSON.stringify({ speaker, text_length: text.length }),
          user.id,
        ]
      );
      insightId = result.rows[0].id;
    }

    return res.json({
      ok: true,
      data: {
        analysis,
        insight_id: insightId,
      },
    });
  } catch (error) {
    console.error('[ai:analyze-tone] error:', error);
    return res.status(500).json({
      ok: false,
      error: { code: 'TONE_ANALYSIS_FAILED', message: error.message },
    });
  }
});

/**
 * POST /api/ai/suggest-rephrase
 * Suggest neutral rephrasing for mediator
 * Body: { message, concern?, case_id?, save? }
 */
router.post('/suggest-rephrase', async (req, res) => {
  const { message, concern = '', case_id, save = false } = req.body;
  const user = req.user;

  if (!message) {
    return res.status(400).json({
      ok: false,
      error: { code: 'MESSAGE_REQUIRED', message: 'Message to rephrase is required' },
    });
  }

  try {
    const suggestion = await aiService.suggestRephrase(message, concern);

    let insightId = null;
    if (save && case_id) {
      const result = await pool.query(
        `INSERT INTO ai_insights (case_id, insight_type, content, metadata, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          case_id,
          'rephrase_suggestion',
          JSON.stringify(suggestion),
          JSON.stringify({ concern }),
          user.id,
        ]
      );
      insightId = result.rows[0].id;
    }

    return res.json({
      ok: true,
      data: {
        suggestion,
        insight_id: insightId,
      },
    });
  } catch (error) {
    console.error('[ai:suggest-rephrase] error:', error);
    return res.status(500).json({
      ok: false,
      error: { code: 'REPHRASE_FAILED', message: error.message },
    });
  }
});

/**
 * POST /api/ai/assess-risk
 * Assess escalation risk from conversation
 * Body: { conversation_text, case_id, save? }
 */
router.post('/assess-risk', async (req, res) => {
  const { conversation_text, case_id, save = true } = req.body;
  const user = req.user;

  if (!conversation_text) {
    return res.status(400).json({
      ok: false,
      error: { code: 'TEXT_REQUIRED', message: 'Conversation text is required' },
    });
  }

  try {
    const assessment = await aiService.assessEscalationRisk(conversation_text);

    let insightId = null;
    if (save && case_id) {
      const result = await pool.query(
        `INSERT INTO ai_insights (case_id, insight_type, content, metadata, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          case_id,
          'risk_assessment',
          JSON.stringify(assessment),
          JSON.stringify({ text_length: conversation_text.length }),
          user.id,
        ]
      );
      insightId = result.rows[0].id;
    }

    return res.json({
      ok: true,
      data: {
        assessment,
        insight_id: insightId,
      },
    });
  } catch (error) {
    console.error('[ai:assess-risk] error:', error);
    return res.status(500).json({
      ok: false,
      error: { code: 'RISK_ASSESSMENT_FAILED', message: error.message },
    });
  }
});

/**
 * GET /api/ai/insights/:caseId
 * Get all AI insights for a case
 * Query params: ?type=<insight_type>&limit=<number>
 */
router.get('/insights/:caseId', async (req, res) => {
  const { caseId } = req.params;
  const { type, limit = 50 } = req.query;
  const user = req.user;

  try {
    // Check user has access to case
    const accessCheck = await pool.query(
      'SELECT 1 FROM case_participants WHERE case_id = $1 AND user_id = $2',
      [caseId, user.id]
    );

    if (accessCheck.rows.length === 0 && user.role !== 'admin') {
      return res.status(403).json({
        ok: false,
        error: { code: 'ACCESS_DENIED', message: 'You do not have access to this case' },
      });
    }

    // Build query
    let query = `
      SELECT 
        i.*,
        u.email as created_by_email,
        u.name as created_by_name
      FROM ai_insights i
      LEFT JOIN app_users u ON i.created_by = u.user_id
      WHERE i.case_id = $1
    `;
    const params = [caseId];

    if (type) {
      query += ` AND i.insight_type = $${params.length + 1}`;
      params.push(type);
    }

    query += ` ORDER BY i.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await pool.query(query, params);

    return res.json({
      ok: true,
      data: {
        insights: result.rows,
        count: result.rows.length,
      },
    });
  } catch (error) {
    console.error('[ai:insights:get] error:', error);
    return res.status(500).json({
      ok: false,
      error: { code: 'FETCH_INSIGHTS_FAILED', message: error.message },
    });
  }
});

/**
 * DELETE /api/ai/insights/:id
 * Delete an AI insight
 */
router.delete('/insights/:id', async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    // Check ownership or admin
    const result = await pool.query(
      `DELETE FROM ai_insights 
       WHERE id = $1 AND (created_by = $2 OR $3 = 'admin')
       RETURNING id`,
      [id, user.id, user.role]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: { code: 'INSIGHT_NOT_FOUND', message: 'Insight not found or access denied' },
      });
    }

    return res.json({
      ok: true,
      message: 'Insight deleted successfully',
    });
  } catch (error) {
    console.error('[ai:insights:delete] error:', error);
    return res.status(500).json({
      ok: false,
      error: { code: 'DELETE_INSIGHT_FAILED', message: error.message },
    });
  }
});

export default router;
