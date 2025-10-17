-- Advanced AI System Database Schema Extensions
-- Enhanced tables for comprehensive AI functionality

-- AI interactions logging for continuous learning
CREATE TABLE IF NOT EXISTS ai_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID,
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    interaction_type TEXT NOT NULL CHECK (interaction_type IN (
        'legal_guidance', 'conflict_resolution', 'emotional_analysis', 
        'translation', 'voice_input', 'predictive_analysis'
    )),
    confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
    user_feedback TEXT,
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI predictions for agreement likelihood and outcomes
CREATE TABLE IF NOT EXISTS ai_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
    prediction_type TEXT NOT NULL CHECK (prediction_type IN (
        'agreement_likelihood', 'completion_timeline', 'conflict_escalation',
        'success_probability', 'cost_estimate'
    )),
    prediction_data JSONB NOT NULL,
    confidence_level INTEGER CHECK (confidence_level BETWEEN 0 AND 100),
    factors_considered JSONB DEFAULT '{}',
    actual_outcome JSONB,
    accuracy_score DECIMAL(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    validated_at TIMESTAMPTZ
);

-- Machine learning data for pattern recognition
CREATE TABLE IF NOT EXISTS ai_learning_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
    pattern_type TEXT NOT NULL CHECK (pattern_type IN (
        'communication_pattern', 'conflict_pattern', 'success_pattern',
        'cultural_pattern', 'emotional_pattern'
    )),
    input_features JSONB NOT NULL,
    predicted_outcome JSONB,
    actual_outcome JSONB,
    accuracy_score DECIMAL(5,2),
    user_feedback JSONB,
    model_version TEXT DEFAULT '1.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Legal research cache and knowledge base
CREATE TABLE IF NOT EXISTS ai_legal_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_hash TEXT UNIQUE NOT NULL,
    legal_topic TEXT NOT NULL,
    jurisdiction TEXT DEFAULT 'south_africa',
    research_data JSONB NOT NULL,
    case_references JSONB DEFAULT '[]',
    statutory_references JSONB DEFAULT '[]',
    confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expiry_date TIMESTAMPTZ,
    validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'outdated'))
);

-- Emotional analysis and tone tracking
CREATE TABLE IF NOT EXISTS ai_emotional_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
    message_id UUID,
    speaker_type TEXT CHECK (speaker_type IN ('party1', 'party2', 'mediator', 'ai')),
    emotional_data JSONB NOT NULL,
    tone_score INTEGER CHECK (tone_score BETWEEN -10 AND 10), -- -10 very negative, 10 very positive
    stress_level INTEGER CHECK (stress_level BETWEEN 0 AND 10),
    intervention_suggested BOOLEAN DEFAULT FALSE,
    intervention_type TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Multi-language support and translation cache
CREATE TABLE IF NOT EXISTS ai_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_text_hash TEXT NOT NULL,
    source_language TEXT NOT NULL,
    target_language TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
    cultural_notes JSONB DEFAULT '{}',
    context_type TEXT DEFAULT 'general' CHECK (context_type IN ('general', 'legal', 'emotional', 'technical')),
    human_validated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(source_text_hash, source_language, target_language)
);

-- Voice processing and accessibility features
CREATE TABLE IF NOT EXISTS ai_voice_processing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
    audio_transcript TEXT NOT NULL,
    processed_transcript TEXT,
    speaker_identity TEXT,
    emotional_markers JSONB DEFAULT '{}',
    accessibility_features JSONB DEFAULT '{}',
    processing_confidence INTEGER CHECK (processing_confidence BETWEEN 0 AND 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI model performance tracking
CREATE TABLE IF NOT EXISTS ai_model_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_type TEXT NOT NULL,
    model_version TEXT NOT NULL,
    performance_metrics JSONB NOT NULL,
    test_case_results JSONB DEFAULT '{}',
    accuracy_score DECIMAL(5,2),
    precision_score DECIMAL(5,2),
    recall_score DECIMAL(5,2),
    f1_score DECIMAL(5,2),
    evaluation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    production_ready BOOLEAN DEFAULT FALSE
);

-- Conflict resolution patterns and strategies
CREATE TABLE IF NOT EXISTS ai_conflict_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_name TEXT NOT NULL,
    pattern_description TEXT,
    typical_triggers JSONB DEFAULT '[]',
    successful_strategies JSONB DEFAULT '[]',
    success_rate DECIMAL(5,2),
    cultural_considerations JSONB DEFAULT '{}',
    legal_implications JSONB DEFAULT '{}',
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cultural sensitivity and context database
CREATE TABLE IF NOT EXISTS ai_cultural_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    culture_group TEXT NOT NULL,
    context_category TEXT NOT NULL CHECK (context_category IN (
        'communication_style', 'family_structure', 'decision_making',
        'conflict_resolution', 'child_rearing', 'financial_practices'
    )),
    context_data JSONB NOT NULL,
    sensitivity_notes JSONB DEFAULT '{}',
    do_dont_guidelines JSONB DEFAULT '{}',
    expert_validated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- AI feedback and improvement suggestions
CREATE TABLE IF NOT EXISTS ai_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT REFERENCES sessions(id) ON DELETE CASCADE,
    interaction_id UUID REFERENCES ai_interactions(id) ON DELETE CASCADE,
    user_type TEXT CHECK (user_type IN ('party1', 'party2', 'mediator', 'admin')),
    feedback_type TEXT CHECK (feedback_type IN ('helpful', 'not_helpful', 'incorrect', 'inappropriate', 'excellent')),
    feedback_details TEXT,
    improvement_suggestions TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_ai_interactions_session_id ON ai_interactions(session_id);
CREATE INDEX idx_ai_interactions_type ON ai_interactions(interaction_type);
CREATE INDEX idx_ai_interactions_created_at ON ai_interactions(created_at);

CREATE INDEX idx_ai_predictions_session_id ON ai_predictions(session_id);
CREATE INDEX idx_ai_predictions_type ON ai_predictions(prediction_type);
CREATE INDEX idx_ai_predictions_confidence ON ai_predictions(confidence_level);

CREATE INDEX idx_ai_learning_pattern_type ON ai_learning_data(pattern_type);
CREATE INDEX idx_ai_learning_accuracy ON ai_learning_data(accuracy_score);

CREATE INDEX idx_ai_legal_topic ON ai_legal_knowledge(legal_topic);
CREATE INDEX idx_ai_legal_jurisdiction ON ai_legal_knowledge(jurisdiction);
CREATE INDEX idx_ai_legal_hash ON ai_legal_knowledge(query_hash);

CREATE INDEX idx_ai_emotional_session_id ON ai_emotional_analysis(session_id);
CREATE INDEX idx_ai_emotional_tone ON ai_emotional_analysis(tone_score);
CREATE INDEX idx_ai_emotional_stress ON ai_emotional_analysis(stress_level);

CREATE INDEX idx_ai_translations_hash ON ai_translations(source_text_hash);
CREATE INDEX idx_ai_translations_languages ON ai_translations(source_language, target_language);

CREATE INDEX idx_ai_voice_session_id ON ai_voice_processing(session_id);
CREATE INDEX idx_ai_voice_confidence ON ai_voice_processing(processing_confidence);

CREATE INDEX idx_ai_feedback_interaction_id ON ai_feedback(interaction_id);
CREATE INDEX idx_ai_feedback_rating ON ai_feedback(rating);

-- Enable Row Level Security
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_legal_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_emotional_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_voice_processing ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conflict_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cultural_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can access their session data)
CREATE POLICY "Users can access their ai interactions" ON ai_interactions
    FOR ALL USING (
        session_id IN (
            SELECT id FROM sessions WHERE true -- Adjust based on your auth system
        )
    );

CREATE POLICY "Users can access their ai predictions" ON ai_predictions
    FOR ALL USING (
        session_id IN (
            SELECT id FROM sessions WHERE true -- Adjust based on your auth system
        )
    );

-- Similar policies for other tables...

-- Triggers for updated_at columns
CREATE TRIGGER update_ai_interactions_updated_at 
    BEFORE UPDATE ON ai_interactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_predictions_updated_at 
    BEFORE UPDATE ON ai_predictions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_learning_data_updated_at 
    BEFORE UPDATE ON ai_learning_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for AI cultural context
INSERT INTO ai_cultural_context (culture_group, context_category, context_data, sensitivity_notes) VALUES
('south_african_zulu', 'family_structure', 
 '{"extended_family_role": "central", "elder_authority": "high", "communal_decisions": true}',
 '{"communication": "respect_for_elders", "decision_making": "consensus_building"}'),
 
('south_african_afrikaans', 'family_structure',
 '{"nuclear_family_focus": "high", "individual_autonomy": "valued", "traditional_roles": "some"}',
 '{"communication": "direct_style", "decision_making": "individual_choice"}'),

('south_african_english', 'family_structure',
 '{"nuclear_family_focus": "high", "equality_emphasis": "strong", "modern_roles": "flexible"}',
 '{"communication": "diplomatic", "decision_making": "democratic"}');

-- Sample conflict resolution patterns
INSERT INTO ai_conflict_patterns (pattern_name, pattern_description, typical_triggers, successful_strategies, success_rate) VALUES
('financial_disagreement', 'Disputes over money, property, or support payments',
 '["income_disparity", "hidden_assets", "lifestyle_differences", "debt_responsibility"]',
 '["financial_disclosure", "neutral_valuation", "structured_payment_plans", "financial_counseling"]',
 78.5),

('parenting_conflict', 'Disagreements about child custody and care arrangements',
 '["primary_residence", "decision_making_authority", "contact_schedules", "discipline_styles"]',
 '["child_focus_reframing", "gradual_transition_plans", "communication_protocols", "professional_guidance"]',
 82.3),

('communication_breakdown', 'Poor communication leading to misunderstandings',
 '["blame_language", "historical_grievances", "emotional_escalation", "misinterpretation"]',
 '["active_listening_training", "neutral_language_coaching", "structured_communication", "cooling_off_periods"]',
 73.7);