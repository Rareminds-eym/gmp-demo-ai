# Database Setup for Evaluation Results

This directory contains the database schema and documentation for storing AI evaluation results from the batch processing system.

## Overview

The `evaluation_results` table stores comprehensive AI evaluation data for each user processed through the BatchEvaluationProcessor. This includes detailed stage-by-stage scores, feedback, and metadata.

## Setup Instructions

### 1. Create the Table in Supabase

1. **Access your Supabase project:**
   - Go to your Supabase dashboard
   - Select your project (the one configured in your `.env` file)

2. **Run the SQL schema:**
   - Navigate to the "SQL Editor" in your Supabase dashboard
   - Open `evaluation_results_schema.sql` and copy the contents
   - Paste and execute the SQL script

3. **Verify table creation:**
   - Check the "Database" section to confirm the `evaluation_results` table exists
   - Verify all columns and constraints are properly set

### 2. Configure Row Level Security (Optional)

The schema includes RLS policies for basic authentication. You may want to customize these based on your security requirements:

```sql
-- Example: Restrict access to specific user roles
CREATE POLICY "Allow admin users to manage evaluation_results" 
ON evaluation_results FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');
```

### 3. Database Schema Details

#### Table: `evaluation_results`

**Key Columns:**
- `id`: Primary key (auto-generated)
- `email`: User email address (required)
- `total_score`: Overall score (0-100)
- Stage-specific scores and feedback for all 8 evaluation stages
- `overall_feedback`: AI-generated comprehensive feedback
- `recommendations`: JSON array of recommendations
- `processing_batch_id`: Unique identifier for batch processing session
- `processed_at`: Timestamp of evaluation completion

**Indexes:**
- Email-based queries
- Score-based filtering
- Processing time lookups
- Batch tracking

### 4. Database Service Functions

The application includes several service functions in `src/lib/databaseService.js`:

- `saveEvaluationResults()`: Save successful AI evaluations
- `saveEvaluationError()`: Save failed evaluation attempts
- `fetchEvaluationResults()`: Retrieve results by email
- `fetchEvaluationStatistics()`: Get evaluation statistics

### 5. Integration with BatchEvaluationProcessor

The batch processor automatically:

1. **Generates unique batch IDs** for tracking processing sessions
2. **Saves successful evaluations** with complete stage scores and feedback
3. **Logs processing errors** with error details
4. **Maintains dual storage** (database + LocalStorage for backward compatibility)

## Data Structure Example

When a user is evaluated, the following data is stored:

```json
{
  "email": "user@example.com",
  "total_score": 75,
  "idea_score": 12,
  "idea_status": "good",
  "idea_feedback": "Strong problem identification...",
  // ... other stage scores and feedback
  "overall_feedback": "The participant demonstrates...",
  "recommendations": [
    "Consider partnering with pharmaceutical companies",
    "Develop a pilot program to test the solution"
  ],
  "processing_batch_id": "batch_1640995200000_abc123",
  "processed_at": "2024-01-01T12:00:00Z"
}
```

## Monitoring and Analytics

Use the database to track:

- **Evaluation trends** over time
- **Score distributions** across different case studies
- **Batch processing performance**
- **User evaluation history**
- **AI model performance** statistics

## Backup and Maintenance

- Supabase automatically handles backups for paid plans
- Consider exporting critical evaluation data periodically
- Monitor table size and performance as data grows
- Archive old evaluation results if storage becomes a concern

## Troubleshooting

### Schema Setup Issues

**Error: "type 'idx_evaluation_results_email' does not exist"**

This error occurs due to incorrect PostgreSQL syntax in the original schema. Use one of these solutions:

1. **Use the fixed schema**: Run `evaluation_results_schema.sql` (now updated with correct PostgreSQL syntax)
2. **Use step-by-step setup**: Run `setup_step_by_step.sql` section by section
3. **Use minimal schema**: Run `minimal_schema.sql` for a simplified version

**If the table already exists with errors:**
```sql
-- Drop the table and start fresh
DROP TABLE IF EXISTS evaluation_results CASCADE;
-- Then run one of the corrected schema files
```

### Runtime Issues

**Common Issues:**

1. **Permission errors**: Check RLS policies and authentication
2. **JSON parsing errors**: Ensure recommendations array is valid JSON
3. **Constraint violations**: Verify score ranges (0-100, stage-specific limits)
4. **Connection issues**: Confirm Supabase URL and keys in `.env` file

**Debug queries:**

```sql
-- Check recent evaluations
SELECT email, total_score, processed_at 
FROM evaluation_results 
ORDER BY processed_at DESC 
LIMIT 10;

-- Get evaluation statistics
SELECT 
  COUNT(*) as total_evaluations,
  AVG(total_score) as avg_score,
  COUNT(*) FILTER (WHERE evaluation_status = 'error') as failed_count
FROM evaluation_results;

-- Find evaluations by batch
SELECT email, total_score 
FROM evaluation_results 
WHERE processing_batch_id = 'your_batch_id'
ORDER BY processed_at;
```
