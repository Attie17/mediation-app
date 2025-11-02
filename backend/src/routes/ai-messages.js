import express from 'express';
import Anthropic from '@anthropic-ai/sdk';

const router = express.Router();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const analysis = JSON.parse(responseText);

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

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const reformulated = message.content[0].text.trim();

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

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const suggestions = JSON.parse(response.content[0].text);

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

export default router;
