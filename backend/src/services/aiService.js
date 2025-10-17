/**
 * AI Service - OpenAI Integration for Mediation App
 * 
 * This service provides AI-powered analysis capabilities:
 * - Chat/session summarization
 * - Emotional tone detection
 * - Key point extraction
 * - Risk assessment
 * - Neutral phrasing suggestions
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration
const CONFIG = {
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2000,
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
  maxRetries: 3,
  retryDelay: 1000, // ms
};

/**
 * System prompt for mediation context
 */
const MEDIATION_SYSTEM_PROMPT = `You are an AI assistant supporting divorce mediation facilitated by NGK Mediation.
Your role is to help mediators by:
- Analyzing communication patterns and emotional tone
- Identifying key points, agreements, and conflicts
- Flagging potential escalation risks
- Suggesting neutral, pastoral language that de-escalates tension
- Summarizing sessions with empathy and clarity

Always maintain:
- Professional, compassionate tone
- Impartiality between parties
- Focus on constructive outcomes
- Respect for confidentiality and sensitivity of family matters`;

/**
 * Retry helper for API calls
 */
async function withRetry(fn, retries = CONFIG.maxRetries) {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on authentication errors
      if (error.status === 401 || error.status === 403) {
        throw error;
      }
      
      // Don't retry on invalid request errors
      if (error.status === 400) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (i < retries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, CONFIG.retryDelay * Math.pow(2, i))
        );
      }
    }
  }
  
  throw lastError;
}

/**
 * Generic chat completion function
 * @param {string} prompt - The user prompt
 * @param {object} options - Additional options (systemPrompt, temperature, maxTokens)
 * @returns {Promise<string>} The AI response
 */
export async function generateChatCompletion(prompt, options = {}) {
  const {
    systemPrompt = MEDIATION_SYSTEM_PROMPT,
    temperature = CONFIG.temperature,
    maxTokens = CONFIG.maxTokens,
  } = options;

  try {
    const response = await withRetry(async () => {
      return await openai.chat.completions.create({
        model: CONFIG.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature,
        max_tokens: maxTokens,
      });
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('[aiService] generateChatCompletion error:', error.message);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

/**
 * Summarize text (chat transcript, notes, documents)
 * @param {string} text - Text to summarize
 * @param {string} context - Additional context (e.g., "chat transcript", "case notes")
 * @returns {Promise<object>} Summary with key points
 */
export async function summarizeText(text, context = 'text') {
  const prompt = `Summarize the following ${context} from a divorce mediation case.

Provide:
1. A brief 2-3 sentence summary
2. Key points discussed (bullet points)
3. Any agreements or decisions mentioned
4. Unresolved issues or concerns

${context.toUpperCase()}:
${text}

Format your response as JSON with keys: summary, keyPoints (array), agreements (array), unresolvedIssues (array)`;

  try {
    const response = await generateChatCompletion(prompt, {
      temperature: 0.5, // Lower temperature for more factual summaries
    });

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback if JSON parsing fails
    return {
      summary: response,
      keyPoints: [],
      agreements: [],
      unresolvedIssues: [],
    };
  } catch (error) {
    console.error('[aiService] summarizeText error:', error.message);
    throw new Error(`Summarization failed: ${error.message}`);
  }
}

/**
 * Analyze emotional tone and communication patterns
 * @param {string} text - Text to analyze
 * @param {string} speaker - Optional speaker identifier
 * @returns {Promise<object>} Tone analysis results
 */
export async function analyzeTone(text, speaker = 'participant') {
  const prompt = `Analyze the emotional tone and communication style of this message from a ${speaker} in a divorce mediation:

"${text}"

Provide a JSON response with:
- tone: overall emotional tone (calm, anxious, angry, sad, defensive, cooperative, etc.)
- intensity: scale 1-10 (1=very mild, 10=very intense)
- concerns: array of any red flags or concerns (escalation risk, hostility, disengagement)
- suggestions: brief suggestions for mediator on how to respond
- cooperative_indicators: positive signs of willingness to cooperate (if any)

Keep analysis professional, empathetic, and action-oriented.`;

  try {
    const response = await generateChatCompletion(prompt, {
      temperature: 0.6,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      tone: 'neutral',
      intensity: 5,
      concerns: [],
      suggestions: response,
      cooperative_indicators: [],
    };
  } catch (error) {
    console.error('[aiService] analyzeTone error:', error.message);
    throw new Error(`Tone analysis failed: ${error.message}`);
  }
}

/**
 * Extract key points from text
 * @param {string} text - Text to analyze
 * @returns {Promise<string[]>} Array of key points
 */
export async function extractKeyPoints(text) {
  const prompt = `Extract the most important key points from this divorce mediation content:

${text}

Return ONLY a JSON array of strings, each string being one key point. Keep points concise (1-2 sentences each).`;

  try {
    const response = await generateChatCompletion(prompt, {
      temperature: 0.4,
    });

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback: split by newlines/bullets
    return response
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^[-•*]\s*/, '').trim());
  } catch (error) {
    console.error('[aiService] extractKeyPoints error:', error.message);
    throw new Error(`Key point extraction failed: ${error.message}`);
  }
}

/**
 * Suggest neutral rephrasing for mediator
 * @param {string} message - Original message that may need rephrasing
 * @param {string} concern - What concern prompted the rephrase (e.g., "too direct", "potentially inflammatory")
 * @returns {Promise<object>} Suggestions with rationale
 */
export async function suggestRephrase(message, concern = '') {
  const concernText = concern ? `The concern is: ${concern}.` : '';
  
  const prompt = `A mediator wants to send this message in a divorce mediation case:

"${message}"

${concernText}

Suggest a rephrased version that:
- Maintains pastoral, compassionate NGK tone
- Reduces potential for escalation
- Stays neutral and non-judgmental
- Encourages cooperation

Provide JSON response with:
- original: the original message
- suggested: your suggested rephrase
- rationale: brief explanation of changes (1-2 sentences)
- tone_improvement: how this improves communication`;

  try {
    const response = await generateChatCompletion(prompt, {
      temperature: 0.7,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      original: message,
      suggested: response,
      rationale: 'Rephrased for clarity and neutrality',
      tone_improvement: 'More balanced and constructive',
    };
  } catch (error) {
    console.error('[aiService] suggestRephrase error:', error.message);
    throw new Error(`Rephrase suggestion failed: ${error.message}`);
  }
}

/**
 * Assess escalation risk from conversation
 * @param {string} conversationText - Full or partial conversation transcript
 * @returns {Promise<object>} Risk assessment
 */
export async function assessEscalationRisk(conversationText) {
  const prompt = `Analyze this divorce mediation conversation for escalation risk:

${conversationText}

Provide JSON response with:
- risk_level: "low", "medium", "high", or "critical"
- risk_score: 1-10 (1=minimal risk, 10=immediate intervention needed)
- indicators: array of specific phrases/patterns indicating risk
- recommendations: array of immediate actions mediator should take
- positive_signs: any signs of de-escalation or cooperation (if present)`;

  try {
    const response = await generateChatCompletion(prompt, {
      temperature: 0.5,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      risk_level: 'medium',
      risk_score: 5,
      indicators: [],
      recommendations: [response],
      positive_signs: [],
    };
  } catch (error) {
    console.error('[aiService] assessEscalationRisk error:', error.message);
    throw new Error(`Risk assessment failed: ${error.message}`);
  }
}

/**
 * Health check - verify OpenAI connection
 * @returns {Promise<boolean>} True if connection successful
 */
export async function healthCheck() {
  try {
    await openai.chat.completions.create({
      model: CONFIG.model,
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5,
    });
    return true;
  } catch (error) {
    console.error('[aiService] healthCheck failed:', error.message);
    return false;
  }
}

export default {
  generateChatCompletion,
  summarizeText,
  analyzeTone,
  extractKeyPoints,
  suggestRephrase,
  assessEscalationRisk,
  healthCheck,
};
