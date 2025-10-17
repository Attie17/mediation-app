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
        status: 'unhealthy',
        message: 'AI system experiencing issues',
        services: {
          openai: isHealthy,
          database: dbHealth,
          models: modelHealth
        }
      });
    }
  } catch (error) {
    console.error('[AI Health Check] Error:', error);
    return res.status(500).json({
      ok: false,
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

/**
 * POST /api/ai/legal-guidance
 * Provide legal guidance with South African family law expertise
 */
router.post('/legal-guidance', async (req, res) => {
  try {
    const { query, caseContext = {}, sessionId } = req.body;

    if (!query) {
      return res.status(400).json({
        ok: false,
        error: { code: 'MISSING_QUERY', message: 'Legal query is required' }
      });
    }

    const guidance = await advancedAIService.provideLegalGuidance(query, {
      ...caseContext,
      userId: req.user.id,
      sessionId
    });

    // Log the interaction
    await logAIInteraction(req.user.id, sessionId, 'legal_guidance', query, guidance);

    res.json({
      ok: true,
      data: guidance,
      disclaimer: "This information is for educational purposes only. Consult with a qualified South African family law attorney for legal advice.",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Legal Guidance] Error:', error);
    res.status(500).json({
      ok: false,
      error: { code: 'AI_ERROR', message: 'Unable to provide legal guidance' }
    });
  }
});

/**
 * POST /api/ai/predict-agreement
 * Predict likelihood of successful agreement
 */
router.post('/predict-agreement', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        ok: false,
        error: { code: 'MISSING_SESSION', message: 'Session ID is required' }
      });
    }

    // Get comprehensive session data
    const sessionData = await getSessionData(sessionId);
    
    const prediction = await advancedAIService.predictAgreementLikelihood(sessionData);

    res.json({
      ok: true,
      data: prediction,
      sessionId,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Prediction] Error:', error);
    res.status(500).json({
      ok: false,
      error: { code: 'PREDICTION_ERROR', message: 'Unable to generate prediction' }
    });
  }
});

/**
 * POST /api/ai/resolve-conflict
 * Advanced conflict resolution with pattern recognition
 */
router.post('/resolve-conflict', async (req, res) => {
  try {
    const { conflictData, sessionId } = req.body;

    if (!conflictData || !sessionId) {
      return res.status(400).json({
        ok: false,
        error: { code: 'MISSING_DATA', message: 'Conflict data and session ID are required' }
      });
    }

    // Get session history for pattern analysis
    const sessionHistory = await getSessionHistory(sessionId);
    
    const resolution = await advancedAIService.analyzeAndResolveConflict(conflictData, sessionHistory);

    // Log the conflict resolution attempt
    await logAIInteraction(req.user.id, sessionId, 'conflict_resolution', 
      JSON.stringify(conflictData), resolution);

    res.json({
      ok: true,
      data: resolution,
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Conflict Resolution] Error:', error);
    res.status(500).json({
      ok: false,
      error: { code: 'RESOLUTION_ERROR', message: 'Unable to analyze conflict' }
    });
  }
});

/**
 * POST /api/ai/analyze-emotion
 * Emotional intelligence and tone analysis
 */
router.post('/analyze-emotion', async (req, res) => {
  try {
    const { messageText, speakerContext = {}, sessionId } = req.body;

    if (!messageText) {
      return res.status(400).json({
        ok: false,
        error: { code: 'MISSING_TEXT', message: 'Message text is required' }
      });
    }

    const analysis = await advancedAIService.analyzeEmotionalState(messageText, speakerContext);

    // Store emotional analysis for trend tracking
    await storeEmotionalAnalysis(sessionId, analysis, speakerContext);

    res.json({
      ok: true,
      data: analysis,
      message_preview: messageText.substring(0, 100),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Emotional Analysis] Error:', error);
    res.status(500).json({
      ok: false,
      error: { code: 'EMOTION_ERROR', message: 'Unable to analyze emotional state' }
    });
  }
});

/**
 * POST /api/ai/translate
 * Multi-language translation with legal context
 */
router.post('/translate', async (req, res) => {
  try {
    const { text, sourceLanguage, targetLanguage = 'en', sessionId } = req.body;

    if (!text || !sourceLanguage) {
      return res.status(400).json({
        ok: false,
        error: { code: 'MISSING_PARAMS', message: 'Text and source language are required' }
      });
    }

    const translation = await advancedAIService.translateAndAnalyze(text, sourceLanguage, targetLanguage);

    // Cache translation for reuse
    await cacheTranslation(text, sourceLanguage, targetLanguage, translation);

    res.json({
      ok: true,
      data: translation,
      languages: { source: sourceLanguage, target: targetLanguage },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Translation] Error:', error);
    res.status(500).json({
      ok: false,
      error: { code: 'TRANSLATION_ERROR', message: 'Unable to translate text' }
    });
  }
});

/**
 * POST /api/ai/process-voice
 * Voice input processing with accessibility features
 */
router.post('/process-voice', async (req, res) => {
  try {
    const { audioTranscript, speakerIdentity, sessionId } = req.body;

    if (!audioTranscript) {
      return res.status(400).json({
        ok: false,
        error: { code: 'MISSING_TRANSCRIPT', message: 'Audio transcript is required' }
      });
    }

    const processed = await advancedAIService.processVoiceInput(audioTranscript, speakerIdentity);

    // Store voice processing data
    await storeVoiceProcessing(sessionId, audioTranscript, processed);

    res.json({
      ok: true,
      data: processed,
      speaker: speakerIdentity,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Voice Processing] Error:', error);
    res.status(500).json({
      ok: false,
      error: { code: 'VOICE_ERROR', message: 'Unable to process voice input' }
    });
  }
});

/**
 * POST /api/ai/research-legal
 * Legal research with South African case law integration
 */
router.post('/research-legal', async (req, res) => {
  try {
    const { legalQuery, jurisdiction = 'south_africa', sessionId } = req.body;

    if (!legalQuery) {
      return res.status(400).json({
        ok: false,
        error: { code: 'MISSING_QUERY', message: 'Legal research query is required' }
      });
    }

    const research = await advancedAIService.researchLegalPrecedents(legalQuery, jurisdiction);

    // Cache legal research for reuse
    await cacheLegalResearch(legalQuery, jurisdiction, research);

    res.json({
      ok: true,
      data: research,
      query: legalQuery,
      jurisdiction,
      disclaimer: "Legal research for informational purposes only. Not legal advice.",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Legal Research] Error:', error);
    res.status(500).json({
      ok: false,
      error: { code: 'RESEARCH_ERROR', message: 'Unable to conduct legal research' }
    });
  }
});

/**
 * GET /api/ai/patterns/:sessionId
 * Identify success patterns and recommendations
 */
router.get('/patterns/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const sessionData = await getSessionData(sessionId);
    const patterns = await advancedAIService.identifySuccessPatterns(sessionData);

    res.json({
      ok: true,
      data: patterns,
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Pattern Recognition] Error:', error);
    res.status(500).json({
      ok: false,
      error: { code: 'PATTERN_ERROR', message: 'Unable to identify patterns' }
    });
  }
});

/**
 * POST /api/ai/feedback
 * Provide feedback for AI learning and improvement
 */
router.post('/feedback', async (req, res) => {
  try {
    const { interactionId, feedbackType, rating, details, suggestions, sessionId } = req.body;

    if (!interactionId || !feedbackType || !rating) {
      return res.status(400).json({
        ok: false,
        error: { code: 'MISSING_FEEDBACK', message: 'Interaction ID, feedback type, and rating are required' }
      });
    }

    await storeFeedback({
      interactionId,
      sessionId,
      userId: req.user.id,
      feedbackType,
      rating,
      details,
      suggestions
    });

    // Trigger learning update if feedback is significant
    if (rating <= 2 || feedbackType === 'incorrect') {
      await advancedAIService.processFeedbackForLearning(interactionId, feedbackType, details);
    }

    res.json({
      ok: true,
      message: 'Feedback recorded successfully',
      learning_triggered: rating <= 2,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Feedback] Error:', error);
    res.status(500).json({
      ok: false,
      error: { code: 'FEEDBACK_ERROR', message: 'Unable to record feedback' }
    });
  }
});

/**
 * GET /api/ai/cultural-context/:culture
 * Get cultural context and sensitivity guidelines
 */
router.get('/cultural-context/:culture', async (req, res) => {
  try {
    const { culture } = req.params;

    const context = await getCulturalContext(culture);

    if (!context) {
      return res.status(404).json({
        ok: false,
        error: { code: 'CULTURE_NOT_FOUND', message: 'Cultural context not available' }
      });
    }

    res.json({
      ok: true,
      data: context,
      culture,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Cultural Context] Error:', error);
    res.status(500).json({
      ok: false,
      error: { code: 'CONTEXT_ERROR', message: 'Unable to retrieve cultural context' }
    });
  }
});

/**
 * GET /api/ai/insights/:sessionId
 * Get comprehensive AI insights for a session
 */
router.get('/insights/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const insights = await generateComprehensiveInsights(sessionId);

    res.json({
      ok: true,
      data: insights,
      sessionId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[AI Insights] Error:', error);
    res.status(500).json({
      ok: false,
      error: { code: 'INSIGHTS_ERROR', message: 'Unable to generate insights' }
    });
  }
});

/**
 * HELPER FUNCTIONS
 */

async function checkDatabaseHealth() {
  try {
    const result = await pool.query('SELECT 1');
    return result.rows.length > 0;
  } catch (error) {
    return false;
  }
}

async function checkModelHealth() {
  // Check if AI models and services are responsive
  try {
    return await advancedAIService.healthCheck();
  } catch (error) {
    return false;
  }
}

async function logAIInteraction(userId, sessionId, type, query, response) {
  try {
    await pool.query(`
      INSERT INTO ai_interactions (session_id, user_id, query, response, interaction_type, confidence_score)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [sessionId, userId, query, JSON.stringify(response), type, response.confidence || 80]);
  } catch (error) {
    console.error('Failed to log AI interaction:', error);
  }
}

async function getSessionData(sessionId) {
  try {
    const [session, formSections, approvals, conflicts] = await Promise.all([
      pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]),
      pool.query('SELECT * FROM form_sections WHERE session_id = $1', [sessionId]),
      pool.query('SELECT * FROM approvals WHERE session_id = $1', [sessionId]),
      pool.query('SELECT * FROM approval_conflicts WHERE session_id = $1', [sessionId])
    ]);

    return {
      session: session.rows[0],
      form_sections: formSections.rows,
      approvals: approvals.rows,
      conflicts: conflicts.rows
    };
  } catch (error) {
    console.error('Failed to get session data:', error);
    throw error;
  }
}

async function getSessionHistory(sessionId) {
  try {
    const history = await pool.query(`
      SELECT * FROM ai_interactions 
      WHERE session_id = $1 
      ORDER BY created_at DESC 
      LIMIT 50
    `, [sessionId]);

    return history.rows;
  } catch (error) {
    console.error('Failed to get session history:', error);
    return [];
  }
}

async function storeEmotionalAnalysis(sessionId, analysis, context) {
  try {
    await pool.query(`
      INSERT INTO ai_emotional_analysis (session_id, speaker_type, emotional_data, tone_score, stress_level)
      VALUES ($1, $2, $3, $4, $5)
    `, [sessionId, context.speaker || 'unknown', JSON.stringify(analysis), 
        analysis.tone_score || 0, analysis.stress_level || 0]);
  } catch (error) {
    console.error('Failed to store emotional analysis:', error);
  }
}

async function cacheTranslation(text, sourceLanguage, targetLanguage, translation) {
  try {
    const crypto = await import('crypto');
    const textHash = crypto.createHash('md5').update(text).digest('hex');
    
    await pool.query(`
      INSERT INTO ai_translations (source_text_hash, source_language, target_language, translated_text, confidence_score)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (source_text_hash, source_language, target_language) 
      DO UPDATE SET translated_text = $4, confidence_score = $5
    `, [textHash, sourceLanguage, targetLanguage, translation.translated_text, translation.confidence_score]);
  } catch (error) {
    console.error('Failed to cache translation:', error);
  }
}

async function storeVoiceProcessing(sessionId, transcript, processed) {
  try {
    await pool.query(`
      INSERT INTO ai_voice_processing (session_id, audio_transcript, processed_transcript, emotional_markers, processing_confidence)
      VALUES ($1, $2, $3, $4, $5)
    `, [sessionId, transcript, processed.processed_transcript, 
        JSON.stringify(processed.emotional_analysis), processed.confidence || 80]);
  } catch (error) {
    console.error('Failed to store voice processing:', error);
  }
}

async function cacheLegalResearch(query, jurisdiction, research) {
  try {
    const crypto = await import('crypto');
    const queryHash = crypto.createHash('md5').update(query).digest('hex');
    
    await pool.query(`
      INSERT INTO ai_legal_knowledge (query_hash, legal_topic, jurisdiction, research_data, confidence_score)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (query_hash) 
      DO UPDATE SET research_data = $4, last_updated = NOW()
    `, [queryHash, query, jurisdiction, JSON.stringify(research), research.research_confidence || 80]);
  } catch (error) {
    console.error('Failed to cache legal research:', error);
  }
}

async function storeFeedback(feedbackData) {
  try {
    await pool.query(`
      INSERT INTO ai_feedback (session_id, interaction_id, user_type, feedback_type, feedback_details, improvement_suggestions, rating)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [feedbackData.sessionId, feedbackData.interactionId, 'user', feedbackData.feedbackType,
        feedbackData.details, feedbackData.suggestions, feedbackData.rating]);
  } catch (error) {
    console.error('Failed to store feedback:', error);
  }
}

async function getCulturalContext(culture) {
  try {
    const result = await pool.query(`
      SELECT * FROM ai_cultural_context WHERE culture_group = $1
    `, [culture]);

    return result.rows;
  } catch (error) {
    console.error('Failed to get cultural context:', error);
    return null;
  }
}

async function generateComprehensiveInsights(sessionId) {
  try {
    const [
      sessionData,
      emotionalTrends,
      predictions,
      patterns
    ] = await Promise.all([
      getSessionData(sessionId),
      getEmotionalTrends(sessionId),
      getPredictions(sessionId),
      getSuccessPatterns(sessionId)
    ]);

    return {
      session_overview: sessionData,
      emotional_trends: emotionalTrends,
      predictions: predictions,
      success_patterns: patterns,
      recommendations: await generateRecommendations(sessionData, emotionalTrends, predictions)
    };
  } catch (error) {
    console.error('Failed to generate insights:', error);
    throw error;
  }
}

async function getEmotionalTrends(sessionId) {
  try {
    const result = await pool.query(`
      SELECT 
        DATE_TRUNC('hour', created_at) as time_period,
        AVG(tone_score) as avg_tone,
        AVG(stress_level) as avg_stress,
        COUNT(*) as interaction_count
      FROM ai_emotional_analysis 
      WHERE session_id = $1 
      GROUP BY time_period 
      ORDER BY time_period
    `, [sessionId]);

    return result.rows;
  } catch (error) {
    console.error('Failed to get emotional trends:', error);
    return [];
  }
}

async function getPredictions(sessionId) {
  try {
    const result = await pool.query(`
      SELECT * FROM ai_predictions 
      WHERE session_id = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `, [sessionId]);

    return result.rows;
  } catch (error) {
    console.error('Failed to get predictions:', error);
    return [];
  }
}

async function getSuccessPatterns(sessionId) {
  try {
    const result = await pool.query(`
      SELECT * FROM ai_learning_data 
      WHERE session_id = $1 AND pattern_type = 'success_pattern'
      ORDER BY created_at DESC 
      LIMIT 5
    `, [sessionId]);

    return result.rows;
  } catch (error) {
    console.error('Failed to get success patterns:', error);
    return [];
  }
}

async function generateRecommendations(sessionData, emotionalTrends, predictions) {
  // Generate AI-powered recommendations based on all available data
  const recommendations = [];
  
  // Analyze emotional trends
  if (emotionalTrends.length > 0) {
    const latestTrend = emotionalTrends[emotionalTrends.length - 1];
    if (latestTrend.avg_stress > 7) {
      recommendations.push({
        type: 'stress_management',
        priority: 'high',
        message: 'Consider taking a break or implementing stress reduction techniques'
      });
    }
  }

  // Analyze predictions
  if (predictions.length > 0) {
    const latestPrediction = predictions[0];
    if (latestPrediction.prediction_data.likelihood_score < 60) {
      recommendations.push({
        type: 'mediation_assistance',
        priority: 'medium',
        message: 'Consider professional mediation assistance to improve agreement likelihood'
      });
    }
  }

  return recommendations;
}

export default router;