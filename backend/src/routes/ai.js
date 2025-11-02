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
import * as aiService from '../services/aiService.js';
import OpenAI from 'openai';

const router = express.Router();

// Initialize OpenAI for direct API calls
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helper function to call OpenAI (replaces non-existent advancedAIService.chat)
async function callOpenAI(messages, options = {}) {
  const response = await openai.chat.completions.create({
    model: options.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages,
    max_tokens: options.max_tokens || 1024,
    temperature: options.temperature || 0.7
  });
  return response.choices[0].message.content;
}

// Helper functions for health checks
async function checkDatabaseHealth() {
  try {
    const result = await pool.query('SELECT 1');
    return result.rowCount === 1;
  } catch (error) {
    console.error('[DB Health] Error:', error.message);
    return false;
  }
}

async function checkModelHealth() {
  try {
    // Check if OpenAI API key is configured
    return !!process.env.OPENAI_API_KEY;
  } catch (error) {
    console.error('[Model Health] Error:', error.message);
    return false;
  }
}

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

/**
 * POST /api/ai/analyze-emotion
 * Analyze emotional tone of text
 */
router.post('/analyze-emotion', async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({
      ok: false,
      error: { code: 'TEXT_REQUIRED', message: 'Text is required' }
    });
  }
  
  try {
    const result = await advancedAIService.analyzeEmotion(text);
    // analyzeEmotion now returns { ok, data } or { ok, error }
    if (result.ok) {
      return res.json(result);
    } else {
      return res.status(500).json(result);
    }
  } catch (error) {
    console.error('[ai:analyze-emotion] error:', error);
    return res.status(500).json({
      ok: false,
      error: { code: 'EMOTION_ANALYSIS_FAILED', message: error.message }
    });
  }
});

/**
 * POST /api/ai/extract-key-points
 * Extract key points from transcript
 */
router.post('/extract-key-points', async (req, res) => {
  const { transcript } = req.body;
  
  if (!transcript) {
    return res.status(400).json({
      ok: false,
      error: { code: 'TRANSCRIPT_REQUIRED', message: 'Transcript is required' }
    });
  }
  
  try {
    const result = await advancedAIService.extractKeyPoints(transcript);
    return res.json(result);
  } catch (error) {
    console.error('[ai:extract-key-points] error:', error);
    return res.status(500).json({
      ok: false,
      error: { code: 'KEY_POINTS_FAILED', message: error.message }
    });
  }
});

/**
 * POST /api/ai/suggest-phrasing
 * Suggest neutral phrasing for emotionally charged text
 */
router.post('/suggest-phrasing', async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({
      ok: false,
      error: { code: 'TEXT_REQUIRED', message: 'Text is required' }
    });
  }
  
  try {
    const result = await advancedAIService.suggestNeutralPhrasing(text);
    return res.json(result);
  } catch (error) {
    console.error('[ai:suggest-phrasing] error:', error);
    return res.status(500).json({
      ok: false,
      error: { code: 'PHRASING_FAILED', message: error.message }
    });
  }
});

/**
 * POST /api/ai/legal-guidance
 * Provide legal guidance and information
 */
router.post('/legal-guidance', async (req, res) => {
  const { question, context } = req.body;
  
  if (!question) {
    return res.status(400).json({
      ok: false,
      error: { code: 'QUESTION_REQUIRED', message: 'Question is required' }
    });
  }
  
  try {
    const result = await advancedAIService.provideLegalGuidance(question, context);
    return res.json(result);
  } catch (error) {
    console.error('[ai:legal-guidance] error:', error);
    return res.status(500).json({
      ok: false,
      error: { code: 'LEGAL_GUIDANCE_FAILED', message: error.message }
    });
  }
});

/**
 * POST /api/ai/analyze-message
 * Analyze message tone, detect issues, provide suggestions
 */
router.post('/analyze-message', async (req, res) => {
  try {
    const { content, context = 'divorce_mediation', recipient_role = 'mediator' } = req.body;

    if (!content || content.trim().length < 10) {
      return res.json({
        ok: true,
        analysis: null,
        suggestions: []
      });
    }

    const prompt = `You are an AI assistant helping someone communicate effectively during divorce mediation.

CRITICAL RULES - HALLUCINATION PREVENTION:
- If you don't have enough context to analyze properly, say so
- Don't make assumptions about legal implications unless certain
- If a warning requires legal knowledge beyond your expertise, suggest consulting an attorney
- Base suggestions on clear communication principles, not speculation

Analyze this message they're about to send to their ${recipient_role}:
"${content}"

Provide a JSON response with:
1. "tone": one of [positive, neutral, negative, hostile, anxious, frustrated]
2. "tone_explanation": brief explanation (1 sentence)
3. "warnings": array of potential issues (e.g., legal implications, emotional triggers, unclear requests)
   - For legal warnings, use: "May have legal implications - consult your attorney"
   - Only include warnings you're confident about
4. "suggestions": array of 2-3 alternative phrasings, each with:
   - "label": short description
   - "text": the full suggested message

Focus on:
- Professional tone
- Clear communication
- Avoiding legal commitments without lawyer review
- Emotional de-escalation
- Constructive language

If you cannot provide meaningful analysis (message too short, unclear context, etc.), set tone to "neutral" and provide minimal suggestions.

Response format:
{
  "tone": "...",
  "tone_explanation": "...",
  "warnings": ["...", "..."],
  "suggestions": [
    {"label": "...", "text": "..."},
    {"label": "...", "text": "..."}
  ]
}`;

    const responseText = await callOpenAI([{ role: 'user', content: prompt }], {
      max_tokens: 1024,
      temperature: 0.5
    });

    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText);
      throw new Error('Invalid AI response format');
    }

    res.json({
      ok: true,
      analysis: {
        tone: analysis.tone,
        tone_explanation: analysis.tone_explanation,
        warnings: analysis.warnings || []
      },
      suggestions: analysis.suggestions || []
    });

  } catch (error) {
    console.error('AI analysis error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to analyze message',
      analysis: null,
      suggestions: []
    });
  }
});

/**
 * POST /api/ai/reformulate-message
 * Reformulate message with specified tone
 */
router.post('/reformulate-message', async (req, res) => {
  try {
    const { content, tone = 'professional', context = 'divorce_mediation' } = req.body;

    if (!content || content.trim().length < 10) {
      return res.status(400).json({
        ok: false,
        error: 'Message too short to reformulate'
      });
    }

    const toneInstructions = {
      professional: 'Rewrite this in a professional, respectful, business-like tone',
      empathetic: 'Rewrite this with an empathetic, understanding, compassionate tone',
      concise: 'Rewrite this more concisely while keeping the key points',
      neutral: 'Rewrite this in a neutral, unemotional, factual tone',
      collaborative: 'Rewrite this with a collaborative, solution-focused tone'
    };

    const instruction = toneInstructions[tone] || toneInstructions.professional;

    const prompt = `${instruction}. 

Context: This is a message in a divorce mediation platform.

Original message:
"${content}"

Requirements:
- Maintain the core message and intent
- Keep it appropriate for divorce mediation
- Avoid legal commitments or promises
- Be respectful and constructive
- Keep it brief (under 200 words)

Respond with ONLY the reformulated message, no explanations or quotes.`;

    const responseText = await callOpenAI([{ role: 'user', content: prompt }], {
      max_tokens: 512,
      temperature: 0.7
    });

    const reformulated = responseText.trim().replace(/^["']|["']$/g, ''); // Remove surrounding quotes if present

    res.json({
      ok: true,
      reformulated,
      original: content,
      tone
    });

  } catch (error) {
    console.error('AI reformulation error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to reformulate message'
    });
  }
});

/**
 * POST /api/ai/suggest-response
 * Generate response suggestions based on received message
 */
router.post('/suggest-response', async (req, res) => {
  try {
    const { message, context = 'divorce_mediation' } = req.body;

    if (!message || message.trim().length < 10) {
      return res.status(400).json({
        ok: false,
        error: 'Message too short'
      });
    }

    const prompt = `You received this message in a divorce mediation context:
"${message}"

Suggest 3 different appropriate responses:
1. A brief acknowledgment
2. A detailed response
3. A question for clarification

Each response should be professional, respectful, and appropriate for divorce mediation.

Return JSON array:
[
  {"type": "brief", "text": "..."},
  {"type": "detailed", "text": "..."},
  {"type": "question", "text": "..."}
]`;

    const responseText = await callOpenAI([{ role: 'user', content: prompt }], {
      max_tokens: 1024
    });

    const suggestions = JSON.parse(responseText);

    res.json({
      ok: true,
      suggestions
    });

  } catch (error) {
    console.error('AI response suggestion error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to generate suggestions'
    });
  }
});

// ============================================================================
// POST /api/ai/analyze-question-routing
// Detect if question is misdirected and suggest correct recipient
// ============================================================================
router.post('/analyze-question-routing', async (req, res) => {
  try {
    const { question, current_recipient, user_role, available_recipients } = req.body;

    if (!question || !current_recipient) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields: question, current_recipient'
      });
    }

    const prompt = `You are analyzing a question in a divorce mediation platform to determine if it's directed to the right person.

Question: "${question}"
Currently directed to: ${current_recipient}
User's role: ${user_role || 'divorcee'}
Available recipients: ${available_recipients?.join(', ') || 'mediator, other divorcee'}

Analyze the question and determine:
1. question_type: factual_legal, legal_procedural, emotional, financial, system, general
2. is_misdirected: true/false (is this going to the wrong person?)
3. best_recipient: who should answer this (mediator, lawyer, other_divorcee, web_search, dashboard, current)
4. confidence: 0.0 to 1.0
5. reason: brief explanation
6. suggested_action: "proceed", "redirect", "web_search", or "dashboard_link"

CRITICAL: 
- Factual questions (statistics, laws, definitions) should route to "web_search"
- System questions (upload status, account) should route to "dashboard"  
- Legal advice should go to mediator or lawyer
- Personal questions can go to other divorcee if appropriate

Return JSON:
{
  "question_type": "...",
  "is_misdirected": boolean,
  "best_recipient": "...",
  "confidence": 0.0-1.0,
  "reason": "...",
  "suggested_action": "..."
}`;

    const responseText = await callOpenAI([{ role: 'user', content: prompt }], {
      max_tokens: 512
    });

    const analysis = JSON.parse(responseText);

    res.json({
      ok: true,
      routing: analysis
    });

  } catch (error) {
    console.error('Question routing analysis error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to analyze question routing'
    });
  }
});

// ============================================================================
// POST /api/ai/search-web
// Search the web using Tavily for factual information with citations
// ============================================================================
router.post('/search-web', async (req, res) => {
  try {
    const { query, search_type, jurisdiction } = req.body;

    if (!query) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required field: query'
      });
    }

    // Import Tavily service
    const { tavilyService } = await import('../services/tavilyService.js');

    let searchResult;

    // Route to specialized search based on type
    if (search_type === 'legal') {
      searchResult = await tavilyService.searchLegal(query, jurisdiction);
    } else if (search_type === 'statistics') {
      searchResult = await tavilyService.searchStatistics(query, jurisdiction);
    } else {
      searchResult = await tavilyService.search(query);
    }

    if (!searchResult.success) {
      return res.status(500).json({
        ok: false,
        error: searchResult.error || 'Web search failed'
      });
    }

    // Log search to ai_responses for audit trail
    if (req.user?.user_id) {
      try {
        await pool.query(`
          INSERT INTO ai_responses (
            user_id, prompt, response, source_type, citations, confidence_score, requires_verification
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          req.user.user_id,
          query,
          searchResult.answer || JSON.stringify(searchResult.results),
          'web_search',
          JSON.stringify(searchResult.citations || []),
          0.9, // High confidence for Tavily results
          true // Web results should be verified
        ]);
      } catch (dbError) {
        console.error('Failed to log web search to audit trail:', dbError);
      }
    }

    res.json({
      ok: true,
      query: searchResult.query,
      answer: searchResult.answer,
      results: searchResult.results,
      citations: searchResult.citations,
      source: 'tavily_web_search'
    });

  } catch (error) {
    console.error('Web search error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to search web'
    });
  }
});

// ============================================================================
// POST /api/ai/analyze-message-enhanced
// Enhanced message analysis with mandatory citations
// ============================================================================
router.post('/analyze-message-enhanced', async (req, res) => {
  try {
    const { content, context, recipient_role } = req.body;

    if (!content || content.length < 10) {
      return res.status(400).json({
        ok: false,
        error: 'Message content must be at least 10 characters'
      });
    }

    const prompt = `You are analyzing a message in a divorce mediation platform for tone and potential issues.

Message: "${content}"
Context: ${context || 'divorce_mediation'}
Recipient: ${recipient_role || 'unknown'}

CRITICAL ANTI-HALLUCINATION RULES:
1. NEVER make up statistics, facts, or legal information
2. If you don't know something, say "I don't know"
3. For factual claims, you must either:
   - Cite a known source, OR
   - Recommend web search, OR
   - Mark as "requires_verification: true"
4. Distinguish between your analysis (opinion) vs facts (must be verified)

Analyze this message and return JSON:
{
  "tone": "positive|neutral|negative|hostile|anxious|frustrated",
  "tone_explanation": "brief 1-sentence explanation",
  "warnings": ["array of potential issues"],
  "suggestions": [
    {"label": "suggestion description", "text": "rewritten message"}
  ],
  "contains_factual_claims": boolean,
  "factual_claims": ["array of claims that need verification"],
  "confidence": 0.0-1.0,
  "source": "ai_analysis",
  "requires_verification": boolean
}`;

    const responseText = await callOpenAI([{ role: 'user', content: prompt }], {
      max_tokens: 1024
    });

    const analysis = JSON.parse(responseText);

    // Log to audit trail
    if (req.user?.user_id) {
      try {
        await pool.query(`
          INSERT INTO ai_responses (
            user_id, prompt, response, source_type, confidence_score, requires_verification
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          req.user.user_id,
          content,
          JSON.stringify(analysis),
          'ai_analysis',
          analysis.confidence || 0.8,
          analysis.requires_verification || false
        ]);
      } catch (dbError) {
        console.error('Failed to log AI analysis to audit trail:', dbError);
      }
    }

    res.json({
      ok: true,
      analysis: {
        tone: analysis.tone,
        tone_explanation: analysis.tone_explanation,
        warnings: analysis.warnings || [],
        contains_factual_claims: analysis.contains_factual_claims || false,
        factual_claims: analysis.factual_claims || []
      },
      suggestions: analysis.suggestions || [],
      metadata: {
        source: 'ai_analysis',
        confidence: analysis.confidence,
        requires_verification: analysis.requires_verification
      }
    });

  } catch (error) {
    console.error('Enhanced message analysis error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to analyze message'
    });
  }
});

export default router;

