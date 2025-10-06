-- Table to store PDF evaluation results from Google Drive PDF Evaluator
-- Based on Food Safety and Quality Management project evaluation rubric
CREATE TABLE IF NOT EXISTS pdf_evaluation (
    id SERIAL PRIMARY KEY,
    
    -- File metadata
    file_name VARCHAR(500) NOT NULL,
    file_id VARCHAR(100), -- Google Drive file ID
    file_size BIGINT, -- File size in bytes
    
    -- Evaluation criteria scores (based on rubric)
    criterion1_score INTEGER CHECK (criterion1_score >= 0 AND criterion1_score <= 10),
    criterion1_justification TEXT,
    
    criterion2_score INTEGER CHECK (criterion2_score >= 0 AND criterion2_score <= 10), 
    criterion2_justification TEXT,
    
    criterion3_score INTEGER CHECK (criterion3_score >= 0 AND criterion3_score <= 5),
    criterion3_justification TEXT,
    
    criterion4_score INTEGER CHECK (criterion4_score >= 0 AND criterion4_score <= 5),
    criterion4_justification TEXT,
    
    -- Total score (sum of all criteria)
    total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 30),
    
    -- Feedback arrays
    strengths JSONB, -- Array of strength statements
    improvements JSONB, -- Array of improvement suggestions  
    overall_feedback TEXT,
    
    -- Processing metadata
    evaluation_status VARCHAR(20) NOT NULL DEFAULT 'success', -- success, error
    error_message TEXT,
    processing_session_id VARCHAR(100), -- Session identifier for batch processing
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ai_model VARCHAR(50) DEFAULT 'gemini-2.0-flash-exp',
    processing_duration_ms INTEGER, -- Time taken to process this file
    
    -- Google Drive metadata
    drive_folder_id VARCHAR(100), -- Google Drive folder ID where file was found
    drive_access_token_hash VARCHAR(64), -- Hash of access token used (for audit)
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_pdf_evaluation_file_name ON pdf_evaluation (file_name);
CREATE INDEX idx_pdf_evaluation_processed_at ON pdf_evaluation (processed_at);
CREATE INDEX idx_pdf_evaluation_total_score ON pdf_evaluation (total_score);
CREATE INDEX idx_pdf_evaluation_file_id ON pdf_evaluation (file_id);
CREATE INDEX idx_pdf_evaluation_session ON pdf_evaluation (processing_session_id);
CREATE INDEX idx_pdf_evaluation_status ON pdf_evaluation (evaluation_status);

-- Create partial index for successful evaluations only
CREATE INDEX idx_pdf_evaluation_successful ON pdf_evaluation (total_score, processed_at) 
WHERE evaluation_status = 'success';

-- Add RLS (Row Level Security)
ALTER TABLE pdf_evaluation ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated users to read pdf_evaluation" 
ON pdf_evaluation FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert pdf_evaluation" 
ON pdf_evaluation FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update pdf_evaluation" 
ON pdf_evaluation FOR UPDATE 
TO authenticated 
USING (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pdf_evaluation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pdf_evaluation_updated_at
    BEFORE UPDATE ON pdf_evaluation
    FOR EACH ROW
    EXECUTE FUNCTION update_pdf_evaluation_updated_at();

-- Add comments for documentation
COMMENT ON TABLE pdf_evaluation IS 'Stores AI evaluation results from Google Drive PDF evaluator for Food Safety and Quality Management projects';
COMMENT ON COLUMN pdf_evaluation.criterion1_score IS 'Report Completeness and Structure (0-10 marks)';
COMMENT ON COLUMN pdf_evaluation.criterion2_score IS 'Depth of Analysis (0-10 marks)';
COMMENT ON COLUMN pdf_evaluation.criterion3_score IS 'Quality of Documentation (0-5 marks)';
COMMENT ON COLUMN pdf_evaluation.criterion4_score IS 'Originality and Effort (0-5 marks)';
COMMENT ON COLUMN pdf_evaluation.total_score IS 'Total score out of 30 marks';
COMMENT ON COLUMN pdf_evaluation.strengths IS 'JSON array of identified strengths';
COMMENT ON COLUMN pdf_evaluation.improvements IS 'JSON array of improvement suggestions';
COMMENT ON COLUMN pdf_evaluation.processing_session_id IS 'Identifier for the batch processing session';
COMMENT ON COLUMN pdf_evaluation.ai_model IS 'AI model used for evaluation (e.g., gemini-2.0-flash-exp)';
COMMENT ON COLUMN pdf_evaluation.drive_access_token_hash IS 'Hash of Google Drive access token (for audit trail)';
