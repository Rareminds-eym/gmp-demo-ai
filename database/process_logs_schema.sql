-- Table to store comprehensive logs for the batch evaluation process
CREATE TABLE IF NOT EXISTS process_logs (
    id SERIAL PRIMARY KEY,
    
    -- Session and batch information
    session_id VARCHAR(100) NOT NULL, -- Unique session identifier
    batch_id VARCHAR(100), -- Batch processing identifier
    batch_number INTEGER, -- Which batch in the session (1, 2, 3, etc.)
    total_batches INTEGER, -- Total number of batches in session
    
    -- User and processing information
    email VARCHAR(255), -- User email being processed (NULL for session-level logs)
    user_index INTEGER, -- User position in batch (1, 2, 3, etc.)
    total_users INTEGER, -- Total users in batch
    global_user_index INTEGER, -- User position across all batches
    total_session_users INTEGER, -- Total users in entire session
    
    -- Log details
    log_level VARCHAR(20) NOT NULL DEFAULT 'INFO', -- DEBUG, INFO, WARN, ERROR
    log_type VARCHAR(50) NOT NULL, -- SESSION_START, BATCH_START, USER_PROCESSING, USER_SKIP, USER_SUCCESS, USER_ERROR, BATCH_COMPLETE, SESSION_COMPLETE, etc.
    message TEXT NOT NULL, -- Human-readable log message
    details JSONB, -- Additional structured data
    
    -- Processing results (for user-level logs)
    processing_status VARCHAR(20), -- success, error, skipped
    total_score INTEGER CHECK (total_score >= 0 AND total_score <= 70),
    processing_duration_ms INTEGER, -- Time taken to process this user in milliseconds
    api_calls_made INTEGER DEFAULT 0, -- Number of API calls made for this user
    
    -- Error information
    error_message TEXT,
    error_code VARCHAR(50),
    stack_trace TEXT,
    
    -- Database operation tracking
    db_save_attempted BOOLEAN DEFAULT FALSE,
    db_save_successful BOOLEAN DEFAULT FALSE,
    db_error_message TEXT,
    
    -- Timing information
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Metadata
    component_name VARCHAR(100) DEFAULT 'BatchEvaluationProcessor', -- Which component created this log
    ai_model VARCHAR(50), -- AI model used (if applicable)
    environment VARCHAR(20) DEFAULT 'production', -- development, staging, production
    
    -- Performance metrics
    memory_usage_mb DECIMAL(10,2),
    cpu_usage_percent DECIMAL(5,2)
);

-- Create indexes for performance
CREATE INDEX idx_process_logs_session_id ON process_logs (session_id);
CREATE INDEX idx_process_logs_batch_id ON process_logs (batch_id);
CREATE INDEX idx_process_logs_email ON process_logs (email);
CREATE INDEX idx_process_logs_log_type ON process_logs (log_type);
CREATE INDEX idx_process_logs_log_level ON process_logs (log_level);
CREATE INDEX idx_process_logs_created_at ON process_logs (created_at);
CREATE INDEX idx_process_logs_processing_status ON process_logs (processing_status);

-- Composite indexes for common queries
CREATE INDEX idx_process_logs_session_batch ON process_logs (session_id, batch_id);
CREATE INDEX idx_process_logs_session_type ON process_logs (session_id, log_type);
CREATE INDEX idx_process_logs_status_level ON process_logs (processing_status, log_level);

-- Add RLS (Row Level Security)
ALTER TABLE process_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for access control
CREATE POLICY "Allow authenticated users to read process_logs" 
ON process_logs FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert process_logs" 
ON process_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Add table and column comments
COMMENT ON TABLE process_logs IS 'Comprehensive logging table for batch evaluation process tracking';
COMMENT ON COLUMN process_logs.session_id IS 'Unique identifier for the entire processing session';
COMMENT ON COLUMN process_logs.batch_id IS 'Identifier for a specific batch within a session';
COMMENT ON COLUMN process_logs.log_type IS 'Type of log entry (SESSION_START, USER_PROCESSING, etc.)';
COMMENT ON COLUMN process_logs.details IS 'Additional structured data in JSON format';
COMMENT ON COLUMN process_logs.processing_duration_ms IS 'Time taken to process in milliseconds';
COMMENT ON COLUMN process_logs.api_calls_made IS 'Number of external API calls made';
COMMENT ON COLUMN process_logs.db_save_attempted IS 'Whether database save was attempted';
COMMENT ON COLUMN process_logs.db_save_successful IS 'Whether database save was successful';

-- Create a view for easy querying of session summaries
CREATE OR REPLACE VIEW session_summary AS
SELECT 
    session_id,
    MIN(created_at) as session_started,
    MAX(created_at) as session_ended,
    COUNT(DISTINCT batch_id) as total_batches,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as total_users_processed,
    COUNT(CASE WHEN processing_status = 'success' THEN 1 END) as successful_users,
    COUNT(CASE WHEN processing_status = 'error' THEN 1 END) as failed_users,
    COUNT(CASE WHEN processing_status = 'skipped' THEN 1 END) as skipped_users,
    AVG(CASE WHEN processing_status = 'success' THEN total_score END) as avg_score,
    SUM(processing_duration_ms) as total_processing_time_ms,
    SUM(api_calls_made) as total_api_calls,
    COUNT(CASE WHEN log_level = 'ERROR' THEN 1 END) as error_count,
    COUNT(CASE WHEN log_level = 'WARN' THEN 1 END) as warning_count
FROM process_logs 
GROUP BY session_id;

-- Create a view for batch summaries
CREATE OR REPLACE VIEW batch_summary AS
SELECT 
    session_id,
    batch_id,
    batch_number,
    MIN(created_at) as batch_started,
    MAX(created_at) as batch_ended,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as users_in_batch,
    COUNT(CASE WHEN processing_status = 'success' THEN 1 END) as successful_users,
    COUNT(CASE WHEN processing_status = 'error' THEN 1 END) as failed_users,
    COUNT(CASE WHEN processing_status = 'skipped' THEN 1 END) as skipped_users,
    AVG(CASE WHEN processing_status = 'success' THEN total_score END) as avg_batch_score,
    SUM(processing_duration_ms) as batch_processing_time_ms,
    SUM(api_calls_made) as batch_api_calls
FROM process_logs 
WHERE batch_id IS NOT NULL
GROUP BY session_id, batch_id, batch_number;

-- Grant permissions to views
GRANT SELECT ON session_summary TO authenticated;
GRANT SELECT ON batch_summary TO authenticated;

-- Create email-focused view for tracking user processing
CREATE OR REPLACE VIEW email_processing_summary AS
SELECT 
    email,
    COUNT(*) as total_log_entries,
    COUNT(CASE WHEN log_type LIKE 'USER_%' THEN 1 END) as user_specific_logs,
    MAX(CASE WHEN processing_status = 'success' THEN total_score END) as final_score,
    MAX(CASE WHEN processing_status IS NOT NULL THEN processing_status END) as final_status,
    MIN(created_at) as first_log_time,
    MAX(created_at) as last_log_time,
    SUM(processing_duration_ms) as total_processing_time_ms,
    SUM(api_calls_made) as total_api_calls,
    COUNT(CASE WHEN log_level = 'ERROR' THEN 1 END) as error_count,
    COUNT(CASE WHEN log_level = 'WARN' THEN 1 END) as warning_count,
    -- Extract session info
    STRING_AGG(DISTINCT session_id, ', ') as session_ids,
    STRING_AGG(DISTINCT batch_id, ', ') as batch_ids
FROM process_logs 
WHERE email IS NOT NULL
GROUP BY email
ORDER BY last_log_time DESC;

-- Create view for email activity timeline
CREATE OR REPLACE VIEW email_activity_timeline AS
SELECT 
    email,
    log_type,
    processing_status,
    total_score,
    processing_duration_ms,
    message,
    session_id,
    batch_id,
    created_at,
    CASE 
        WHEN log_type = 'USER_PROCESSING_START' THEN 1
        WHEN log_type = 'USER_SKIPPED' THEN 2 
        WHEN log_type = 'USER_SUCCESS' THEN 3
        WHEN log_type = 'USER_ERROR' THEN 4
        ELSE 5
    END as log_sequence_order
FROM process_logs 
WHERE email IS NOT NULL
ORDER BY email, created_at;

-- Create view for batch email summaries
CREATE OR REPLACE VIEW batch_email_summary AS
SELECT 
    batch_id,
    session_id,
    batch_number,
    COUNT(DISTINCT email) as unique_emails_processed,
    STRING_AGG(DISTINCT email, ', ' ORDER BY email) as email_list,
    COUNT(CASE WHEN processing_status = 'success' THEN 1 END) as successful_emails,
    COUNT(CASE WHEN processing_status = 'error' THEN 1 END) as failed_emails,
    COUNT(CASE WHEN processing_status = 'skipped' THEN 1 END) as skipped_emails,
    AVG(CASE WHEN processing_status = 'success' THEN total_score END) as avg_success_score,
    MIN(created_at) as batch_start_time,
    MAX(created_at) as batch_end_time
FROM process_logs 
WHERE batch_id IS NOT NULL AND email IS NOT NULL
GROUP BY batch_id, session_id, batch_number
ORDER BY session_id, batch_number;

-- Grant permissions to new email-focused views
GRANT SELECT ON email_processing_summary TO authenticated;
GRANT SELECT ON email_activity_timeline TO authenticated;
GRANT SELECT ON batch_email_summary TO authenticated;

-- Add additional email-focused indexes for better query performance
CREATE INDEX idx_process_logs_email_status ON process_logs (email, processing_status);
CREATE INDEX idx_process_logs_email_created ON process_logs (email, created_at);
CREATE INDEX idx_process_logs_email_log_type ON process_logs (email, log_type);

-- Add comments for new views
COMMENT ON VIEW email_processing_summary IS 'Summary of processing activity per email address';
COMMENT ON VIEW email_activity_timeline IS 'Chronological timeline of all activities per email';
COMMENT ON VIEW batch_email_summary IS 'Email processing summary grouped by batch';