-- Table to store AI evaluation results from batch processing
CREATE TABLE IF NOT EXISTS evaluation_results (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    user_id UUID,
    case_id INTEGER,
    total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 70),
    
    -- Individual stage scores
    idea_score INTEGER CHECK (idea_score >= 0 AND idea_score <= 15),
    idea_status VARCHAR(20),
    idea_feedback TEXT,
    
    problem_score INTEGER CHECK (problem_score >= 0 AND problem_score <= 15),
    problem_status VARCHAR(20),
    problem_feedback TEXT,
    
    technology_score INTEGER CHECK (technology_score >= 0 AND technology_score <= 10),
    technology_status VARCHAR(20),
    technology_feedback TEXT,
    
    collaboration_score INTEGER CHECK (collaboration_score >= 0 AND collaboration_score <= 10),
    collaboration_status VARCHAR(20),
    collaboration_feedback TEXT,
    
    creativity_score INTEGER CHECK (creativity_score >= 0 AND creativity_score <= 15),
    creativity_status VARCHAR(20),
    creativity_feedback TEXT,
    
    scale_score INTEGER CHECK (scale_score >= 0 AND scale_score <= 10),
    scale_status VARCHAR(20),
    scale_feedback TEXT,
    
    impact_score INTEGER CHECK (impact_score >= 0 AND impact_score <= 15),
    impact_status VARCHAR(20),
    impact_feedback TEXT,
    
    pitch_score INTEGER CHECK (pitch_score >= 0 AND pitch_score <= 10),
    pitch_status VARCHAR(20),
    pitch_feedback TEXT,
    
    -- Overall feedback and recommendations
    overall_feedback TEXT,
    recommendations JSONB, -- Array of recommendation strings
    
    -- Processing metadata
    evaluation_status VARCHAR(20) NOT NULL DEFAULT 'success', -- success, error
    error_message TEXT,
    processing_batch_id VARCHAR(100),
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ai_model VARCHAR(50) DEFAULT 'gemini-2.0-flash-exp',
    
    -- Constraints
    UNIQUE(email, processed_at) -- Allow multiple evaluations per email but track time
);

-- Create indexes for performance (separate statements for PostgreSQL)
CREATE INDEX idx_evaluation_results_email ON evaluation_results (email);
CREATE INDEX idx_evaluation_results_processed_at ON evaluation_results (processed_at);
CREATE INDEX idx_evaluation_results_total_score ON evaluation_results (total_score);
CREATE INDEX idx_evaluation_results_case_id ON evaluation_results (case_id);
CREATE INDEX idx_evaluation_results_status ON evaluation_results (evaluation_status);

-- Add RLS (Row Level Security) if needed
ALTER TABLE evaluation_results ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow read/write for authenticated users (adjust as needed)
CREATE POLICY "Allow authenticated users to read evaluation_results" 
ON evaluation_results FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert evaluation_results" 
ON evaluation_results FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Add comments for documentation
COMMENT ON TABLE evaluation_results IS 'Stores AI evaluation results from hackathon batch processing';
COMMENT ON COLUMN evaluation_results.total_score IS 'Overall score out of 100 points';
COMMENT ON COLUMN evaluation_results.recommendations IS 'JSON array of AI-generated recommendations';
COMMENT ON COLUMN evaluation_results.processing_batch_id IS 'Identifier for the batch processing session';
COMMENT ON COLUMN evaluation_results.ai_model IS 'AI model used for evaluation (e.g., gemini-2.0-flash-exp)';
