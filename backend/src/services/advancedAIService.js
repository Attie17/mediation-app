/**
 * Advanced AI Service for Mediation App
 * 
 * Comprehensive AI system including:
 * - Legal research and case law integration
 * - Predictive analytics for agreement likelihood
 * - Conflict resolution algorithms
 * - Multi-language support
 * - Advanced NLP for legal terminology
 * - Emotional intelligence and cultural sensitivity
 * - Voice integration capabilities
 * - Pattern recognition and machine learning
 */

import OpenAI from 'openai';
import { pool } from '../db.js';

// Initialize OpenAI client (can be swapped with other LLMs)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key'
});

// Legal knowledge base and patterns
const LEGAL_PATTERNS = {
  south_african_family_law: {
    parenting_plans: {
      required_elements: [
        'primary_residence', 'contact_schedule', 'decision_making',
        'holiday_arrangements', 'relocation_protocol', 'dispute_resolution'
      ],
      best_practices: [
        'child_best_interests', 'stability', 'both_parents_involvement',
        'age_appropriate_arrangements', 'flexibility'
      ]
    },
    maintenance: {
      calculation_factors: [
        'both_parties_income', 'child_needs', 'standard_of_living',
        'educational_expenses', 'medical_expenses', 'inflation_protection'
      ]
    },
    property_division: {
      principles: ['equitable_distribution', 'contribution_based', 'future_needs'],
      considerations: ['marriage_duration', 'financial_contributions', 'non_financial_contributions']
    }
  }
};

// Cultural sensitivity patterns
const CULTURAL_PATTERNS = {
  south_african_cultures: {
    african_traditional: {
      family_structure: 'extended_family_involvement',
      decision_making: 'elder_consultation',
      child_rearing: 'community_responsibility'
    },
    western: {
      family_structure: 'nuclear_family_focus',
      decision_making: 'individual_autonomy',
      child_rearing: 'parental_responsibility'
    },
    mixed_cultural: {
      considerations: ['cultural_bridge_building', 'respect_both_traditions', 'child_cultural_identity']
    }
  }
};

class AdvancedAIService {
  constructor() {
    this.modelConfig = {
      model: 'gpt-4-turbo-preview',
      temperature: 0.3, // Lower for more consistent legal advice
      max_tokens: 2000,
      top_p: 0.9
    };
  }

  /**
   * CORE AI ASSISTANT FUNCTIONS
   */

  // Comprehensive legal analysis with South African family law expertise
  async provideLegalGuidance(query, caseContext = {}) {
    try {
      const systemPrompt = `You are an AI assistant specialized in South African family law and divorce mediation. 
      
      IMPORTANT DISCLAIMERS:
      - You cannot provide actual legal advice
      - Always recommend consulting with qualified attorneys
      - Focus on general information and process guidance
      - Emphasize mediation and collaborative solutions
      
      EXPERTISE AREAS:
      - South African Divorce Act 70 of 1979
      - Children's Act 38 of 2005
      - Maintenance Act 99 of 1998
      - Rule 41A mediation requirements
      - Gauteng Province 2025 mediation directives
      
      CULTURAL SENSITIVITY:
      - Acknowledge South Africa's diverse cultural context
      - Respect traditional and modern family structures
      - Consider language and cultural barriers
      - Promote inclusive solutions
      
      Case context: ${JSON.stringify(caseContext)}`;

      const response = await openai.chat.completions.create({
        ...this.modelConfig,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ]
      });

      const analysis = response.choices[0].message.content;

      // Store the interaction for learning
      await this.storeLegalInteraction(query, analysis, caseContext);

      return {
        guidance: analysis,
        disclaimer: "This is general information only. Please consult with a qualified South African family law attorney for legal advice.",
        confidence: this.calculateConfidence(query, analysis),
        follow_up_suggestions: await this.generateFollowUpQuestions(query, caseContext)
      };

    } catch (error) {
      console.error('Legal guidance error:', error);
      throw new Error('Unable to provide legal guidance at this time');
    }
  }

  // Predictive analytics for agreement likelihood
  async predictAgreementLikelihood(sessionData) {
    try {
      const factors = await this.extractPredictiveFactors(sessionData);
      
      const systemPrompt = `You are an AI system that analyzes divorce mediation sessions to predict agreement likelihood.
      
      Analyze these factors and provide a probability score (0-100) with reasoning:
      
      POSITIVE INDICATORS:
      - Collaborative communication tone
      - Willingness to compromise
      - Focus on children's welfare
      - Completed sections without conflicts
      - Similar income levels
      - Short marriage duration
      
      NEGATIVE INDICATORS:
      - Hostile communication
      - Inflexible positions
      - Multiple unresolved conflicts
      - Significant income disparities
      - Long marriage with complex assets
      - History of domestic violence
      
      Session factors: ${JSON.stringify(factors)}`;

      const response = await openai.chat.completions.create({
        ...this.modelConfig,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Analyze the agreement likelihood for this session.' }
        ]
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      
      // Store prediction for machine learning improvement
      await this.storePrediction(sessionData.session_id, analysis);

      return {
        likelihood_score: analysis.score,
        confidence_level: analysis.confidence,
        key_factors: analysis.factors,
        recommendations: analysis.recommendations,
        risk_areas: analysis.risks,
        timeline_estimate: analysis.estimated_timeline
      };

    } catch (error) {
      console.error('Prediction error:', error);
      throw new Error('Unable to calculate agreement likelihood');
    }
  }

  // Advanced conflict resolution with pattern recognition
  async analyzeAndResolveConflict(conflictData, sessionHistory = []) {
    try {
      const patterns = await this.identifyConflictPatterns(conflictData, sessionHistory);
      
      const systemPrompt = `You are an expert AI mediator specializing in conflict resolution for divorce cases.
      
      CONFLICT RESOLUTION FRAMEWORKS:
      1. Interest-based negotiation (Harvard Method)
      2. Transformative mediation
      3. Narrative mediation
      4. Solution-focused mediation
      
      SOUTH AFRICAN CONTEXT:
      - Ubuntu philosophy ("I am because we are")
      - Restorative justice principles
      - Cultural mediation practices
      - Children's rights focus (Constitution Section 28)
      
      Conflict details: ${JSON.stringify(conflictData)}
      Historical patterns: ${JSON.stringify(patterns)}`;

      const response = await openai.chat.completions.create({
        ...this.modelConfig,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Provide a comprehensive conflict resolution strategy.' }
        ]
      });

      const resolution = JSON.parse(response.choices[0].message.content);

      return {
        resolution_strategy: resolution.strategy,
        mediation_techniques: resolution.techniques,
        communication_scripts: resolution.scripts,
        compromise_options: resolution.compromises,
        escalation_prevention: resolution.prevention,
        cultural_considerations: resolution.cultural_notes,
        success_probability: resolution.success_rate
      };

    } catch (error) {
      console.error('Conflict resolution error:', error);
      throw new Error('Unable to analyze conflict');
    }
  }

  // Emotional intelligence and tone analysis
  async analyzeEmotionalState(messageText, speakerContext = {}) {
    try {
      const systemPrompt = `You are an AI system specialized in emotional intelligence for mediation contexts.
      
      EMOTIONAL ANALYSIS FRAMEWORK:
      - Primary emotions: anger, fear, sadness, joy, surprise, disgust
      - Secondary emotions: frustration, anxiety, grief, hope, confusion, resentment
      - Stress indicators: repetitive language, absolute statements, blame language
      - De-escalation opportunities: validation needs, underlying interests
      
      CULTURAL EMOTIONAL EXPRESSIONS:
      - Consider South African cultural communication styles
      - Respect for different emotional expression norms
      - Language barriers affecting emotional clarity
      
      Speaker context: ${JSON.stringify(speakerContext)}`;

      const response = await openai.chat.completions.create({
        ...this.modelConfig,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze the emotional state in this message: "${messageText}"` }
        ]
      });

      const analysis = JSON.parse(response.choices[0].message.content);

      return {
        primary_emotion: analysis.primary_emotion,
        intensity_level: analysis.intensity, // 1-10
        stress_indicators: analysis.stress_signals,
        underlying_needs: analysis.needs,
        de_escalation_suggestions: analysis.de_escalation,
        communication_recommendations: analysis.communication_tips,
        cultural_considerations: analysis.cultural_notes
      };

    } catch (error) {
      console.error('Emotional analysis error:', error);
      throw new Error('Unable to analyze emotional state');
    }
  }

  // Multi-language support with real-time translation
  async translateAndAnalyze(text, sourceLanguage, targetLanguage = 'en') {
    try {
      const systemPrompt = `You are a specialized translation AI for legal and mediation contexts.
      
      TRANSLATION REQUIREMENTS:
      - Maintain legal terminology accuracy
      - Preserve emotional tone and intent
      - Consider cultural context in translation
      - Flag potential misunderstandings
      
      SOUTH AFRICAN LANGUAGE CONTEXT:
      - Official languages: Afrikaans, English, isiNdebele, isiXhosa, isiZulu, 
        Sepedi, Sesotho, Setswana, siSwati, Tshivenda, Xitsonga
      - Legal terminology standardization
      - Cultural concepts that may not translate directly
      
      Source language: ${sourceLanguage}
      Target language: ${targetLanguage}`;

      const response = await openai.chat.completions.create({
        ...this.modelConfig,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Translate and analyze: "${text}"` }
        ]
      });

      const result = JSON.parse(response.choices[0].message.content);

      return {
        translated_text: result.translation,
        confidence_score: result.confidence,
        cultural_notes: result.cultural_considerations,
        potential_misunderstandings: result.warnings,
        alternative_translations: result.alternatives,
        emotional_tone_preserved: result.tone_analysis
      };

    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Unable to translate text');
    }
  }

  // Legal research and case law integration
  async researchLegalPrecedents(legalQuery, jurisdiction = 'south_africa') {
    try {
      const systemPrompt = `You are a legal research AI specialized in South African family law.
      
      LEGAL RESEARCH SCOPE:
      - Constitutional Court decisions
      - High Court precedents
      - Family law statutes and regulations
      - International family law (where applicable)
      - Recent legislative changes
      
      DISCLAIMER REQUIREMENT:
      Always emphasize that this is research information only, not legal advice.
      
      Query: ${legalQuery}
      Jurisdiction: ${jurisdiction}`;

      const response = await openai.chat.completions.create({
        ...this.modelConfig,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Research relevant legal precedents and provide summary.' }
        ]
      });

      const research = JSON.parse(response.choices[0].message.content);

      return {
        relevant_cases: research.cases,
        statutory_provisions: research.statutes,
        legal_principles: research.principles,
        recent_developments: research.recent_changes,
        practical_implications: research.implications,
        research_confidence: research.confidence,
        disclaimer: "This research is for informational purposes only. Consult with a qualified attorney for legal advice."
      };

    } catch (error) {
      console.error('Legal research error:', error);
      throw new Error('Unable to conduct legal research');
    }
  }

  // Voice integration and accessibility
  async processVoiceInput(audioTranscript, speakerIdentity) {
    try {
      // First, clean and process the transcript
      const cleanedTranscript = await this.cleanTranscript(audioTranscript);
      
      // Analyze the content
      const analysis = await this.analyzeEmotionalState(cleanedTranscript, { speaker: speakerIdentity });
      
      // Generate appropriate response
      const systemPrompt = `You are an AI assistant processing voice input in a mediation session.
      
      VOICE PROCESSING CONSIDERATIONS:
      - Account for speech-to-text errors
      - Consider emotional context from voice tone
      - Provide clear, spoken-friendly responses
      - Be sensitive to accessibility needs
      
      Speaker: ${speakerIdentity}
      Transcript: ${cleanedTranscript}
      Emotional analysis: ${JSON.stringify(analysis)}`;

      const response = await openai.chat.completions.create({
        ...this.modelConfig,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Process this voice input and provide appropriate response.' }
        ]
      });

      return {
        processed_transcript: cleanedTranscript,
        emotional_analysis: analysis,
        ai_response: response.choices[0].message.content,
        suggested_follow_up: await this.generateFollowUpQuestions(cleanedTranscript),
        accessibility_notes: await this.generateAccessibilitySupport(cleanedTranscript)
      };

    } catch (error) {
      console.error('Voice processing error:', error);
      throw new Error('Unable to process voice input');
    }
  }

  /**
   * MACHINE LEARNING AND PATTERN RECOGNITION
   */

  // Pattern recognition for successful mediation outcomes
  async identifySuccessPatterns(sessionData) {
    try {
      // Analyze historical successful cases
      const successfulCases = await this.getSuccessfulCases();
      const currentPatterns = await this.extractSessionPatterns(sessionData);
      
      const similarities = await this.comparePatterns(currentPatterns, successfulCases);
      
      return {
        success_indicators: similarities.positive_patterns,
        risk_factors: similarities.negative_patterns,
        recommendations: similarities.improvement_suggestions,
        confidence_score: similarities.confidence
      };

    } catch (error) {
      console.error('Pattern recognition error:', error);
      throw new Error('Unable to identify patterns');
    }
  }

  // Continuous learning from case outcomes
  async learnFromOutcome(sessionId, finalOutcome, userFeedback = null) {
    try {
      const sessionData = await this.getSessionData(sessionId);
      const predictions = await this.getPredictions(sessionId);
      
      // Calculate prediction accuracy
      const accuracy = this.calculateAccuracy(predictions, finalOutcome);
      
      // Store learning data
      await pool.query(`
        INSERT INTO ai_learning_data (session_id, predicted_outcome, actual_outcome, accuracy_score, user_feedback)
        VALUES ($1, $2, $3, $4, $5)
      `, [sessionId, JSON.stringify(predictions), JSON.stringify(finalOutcome), accuracy, userFeedback]);

      // Update model weights (simplified ML approach)
      await this.updateModelWeights(sessionData, finalOutcome, accuracy);

      return { learning_recorded: true, accuracy_improvement: accuracy };

    } catch (error) {
      console.error('Learning error:', error);
      throw new Error('Unable to record learning data');
    }
  }

  /**
   * HELPER METHODS
   */

  async extractPredictiveFactors(sessionData) {
    const factors = {
      communication_tone: await this.analyzeCommunicationTone(sessionData.messages || []),
      completion_rate: this.calculateCompletionRate(sessionData.form_sections || []),
      conflict_count: (sessionData.conflicts || []).length,
      collaboration_score: await this.calculateCollaborationScore(sessionData),
      time_to_complete: this.calculateTimeMetrics(sessionData),
      income_disparity: this.calculateIncomeDisparity(sessionData.financial_data || {}),
      children_involved: (sessionData.children || []).length > 0,
      property_complexity: this.assessPropertyComplexity(sessionData.assets || [])
    };
    
    return factors;
  }

  async identifyConflictPatterns(conflictData, sessionHistory) {
    // Analyze historical conflicts to identify patterns
    const patterns = [];
    
    // Common conflict categories
    const categories = ['financial', 'children', 'property', 'communication', 'trust'];
    
    for (const category of categories) {
      const categoryConflicts = sessionHistory.filter(item => 
        item.type === 'conflict' && item.category === category
      );
      
      if (categoryConflicts.length > 0) {
        patterns.push({
          category,
          frequency: categoryConflicts.length,
          resolution_success_rate: this.calculateResolutionRate(categoryConflicts),
          common_triggers: this.identifyTriggers(categoryConflicts)
        });
      }
    }
    
    return patterns;
  }

  calculateConfidence(query, analysis) {
    // Simple confidence calculation based on query complexity and response completeness
    const queryComplexity = query.split(' ').length;
    const responseCompleteness = analysis.split(' ').length;
    
    const confidence = Math.min(95, Math.max(60, 
      (responseCompleteness / queryComplexity) * 75
    ));
    
    return Math.round(confidence);
  }

  async generateFollowUpQuestions(query, context = {}) {
    const systemPrompt = `Generate 3-5 relevant follow-up questions based on the user's query and context.
    Focus on clarification, deeper understanding, and practical next steps.
    
    Query: ${query}
    Context: ${JSON.stringify(context)}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 200,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Generate follow-up questions.' }
        ]
      });

      return response.choices[0].message.content.split('\n').filter(q => q.trim());
    } catch (error) {
      return ['Would you like more specific information about this topic?'];
    }
  }

  // Store AI interactions for continuous improvement
  async storeLegalInteraction(query, response, context) {
    try {
      await pool.query(`
        INSERT INTO ai_interactions (query, response, context, interaction_type, created_at)
        VALUES ($1, $2, $3, $4, NOW())
      `, [query, response, JSON.stringify(context), 'legal_guidance']);
    } catch (error) {
      console.error('Storage error:', error);
    }
  }

  async storePrediction(sessionId, prediction) {
    try {
      await pool.query(`
        INSERT INTO ai_predictions (session_id, prediction_data, prediction_type, created_at)
        VALUES ($1, $2, $3, NOW())
      `, [sessionId, JSON.stringify(prediction), 'agreement_likelihood']);
    } catch (error) {
      console.error('Prediction storage error:', error);
    }
  }

  // Health check for AI services
  async healthCheck() {
    try {
      const testResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Test' }]
      });

      return testResponse.choices && testResponse.choices.length > 0;
    } catch (error) {
      console.error('AI health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new AdvancedAIService();