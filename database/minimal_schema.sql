-- Minimal schema for evaluation_results table
-- This is a simplified version that should work without issues

CREATE TABLE evaluation_results (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    user_id UUID,
    case_id INTEGER,
    total_score INTEGER NOT NULL DEFAULT 0,
    
    -- Stage scores (simplified)
    idea_score INTEGER DEFAULT 0,
    idea_status TEXT,
    idea_feedback TEXT,
    
    problem_score INTEGER DEFAULT 0,
    problem_status TEXT,
    problem_feedback TEXT,
    
    technology_score INTEGER DEFAULT 0,
    technology_status TEXT,
    technology_feedback TEXT,
    
    collaboration_score INTEGER DEFAULT 0,
    collaboration_status TEXT,
    collaboration_feedback TEXT,
    
    creativity_score INTEGER DEFAULT 0,
    creativity_status TEXT,
    creativity_feedback TEXT,
    
    scale_score INTEGER DEFAULT 0,
    scale_status TEXT,
    scale_feedback TEXT,
    
    impact_score INTEGER DEFAULT 0,
    impact_status TEXT,
    impact_feedback TEXT,
    
    pitch_score INTEGER DEFAULT 0,
    pitch_status TEXT,
    pitch_feedback TEXT,
    
    -- Overall feedback
    overall_feedback TEXT,
    recommendations JSONB,
    
    -- Metadata
    evaluation_status TEXT DEFAULT 'success',
    error_message TEXT,
    processing_batch_id TEXT,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    ai_model TEXT DEFAULT 'gemini-2.0-flash-exp'
);

-- Basic indexes
CREATE INDEX ON evaluation_results (email);
CREATE INDEX ON evaluation_results (processed_at);
CREATE INDEX ON evaluation_results (total_score);

-- Enable RLS
ALTER TABLE evaluation_results ENABLE ROW LEVEL SECURITY;

-- Basic policy for authenticated users
CREATE POLICY evaluation_results_policy ON evaluation_results
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
