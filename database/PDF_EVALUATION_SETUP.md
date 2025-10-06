# PDF Evaluation Database Setup

This document explains how to set up and use the PDF evaluation database integration for the Google Drive PDF Evaluator component.

## Database Setup

### 1. Create the Table

Run the SQL schema in your Supabase SQL editor:

```sql
-- Execute the contents of pdf_evaluation_schema.sql
-- This creates the pdf_evaluation table with all necessary indexes, triggers, and policies
```

You can find the complete schema in `pdf_evaluation_schema.sql`.

### 2. Verify Table Creation

After running the schema, verify the table was created:

```sql
-- Check if table exists
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'pdf_evaluation';

-- Check table structure
\d pdf_evaluation;
```

## How It Works

### Automatic Data Saving

The `GoogleDrivePDFEvaluator` component now automatically saves evaluation results to the database:

1. **Session Tracking**: Each evaluation session gets a unique ID for tracking
2. **Success Cases**: Complete evaluation results are saved with all criteria scores and feedback
3. **Error Cases**: Failed evaluations are logged with error messages for debugging

### Data Structure

Each PDF evaluation record includes:

- **File Information**: name, Google Drive ID, file size
- **Evaluation Scores**: 4 criteria scores (10+10+5+5 = 30 total)
- **Feedback**: strengths, improvements, overall feedback
- **Metadata**: processing time, session ID, AI model used

### Example Usage

The component automatically handles database operations during evaluation:

```javascript
// When a PDF is successfully evaluated:
const evaluationData = {
  fileName: 'Report.pdf',
  fileId: 'google_drive_file_id',
  criterion1: { score: 8, justification: 'Good structure...' },
  criterion2: { score: 7, justification: 'Solid analysis...' },
  criterion3: { score: 4, justification: 'Clear formatting...' },
  criterion4: { score: 5, justification: 'Original work...' },
  total_score: 24,
  strengths: ['Clear structure', 'Good references'],
  improvements: ['Expand methodology', 'Add more examples']
};

// This is automatically saved to the database
```

## Database Queries

### View Recent Evaluations

```sql
SELECT 
  file_name,
  total_score,
  criterion1_score,
  criterion2_score, 
  criterion3_score,
  criterion4_score,
  processed_at
FROM pdf_evaluation
WHERE evaluation_status = 'success'
ORDER BY processed_at DESC
LIMIT 10;
```

### Check Evaluation Statistics

```sql
SELECT 
  COUNT(*) as total_evaluations,
  AVG(total_score) as average_score,
  MIN(total_score) as min_score,
  MAX(total_score) as max_score,
  COUNT(*) FILTER (WHERE total_score >= 24) as excellent_count,
  COUNT(*) FILTER (WHERE total_score >= 18 AND total_score < 24) as good_count,
  COUNT(*) FILTER (WHERE total_score < 18) as needs_improvement_count
FROM pdf_evaluation
WHERE evaluation_status = 'success';
```

### View Session Activity

```sql
SELECT 
  processing_session_id,
  COUNT(*) as files_processed,
  AVG(total_score) as avg_score,
  MIN(processed_at) as session_start,
  MAX(processed_at) as session_end
FROM pdf_evaluation
WHERE evaluation_status = 'success'
GROUP BY processing_session_id
ORDER BY session_start DESC;
```

### Find Evaluation Errors

```sql
SELECT 
  file_name,
  error_message,
  processed_at
FROM pdf_evaluation
WHERE evaluation_status = 'error'
ORDER BY processed_at DESC;
```

## Environment Variables

Make sure these environment variables are set in your `.env.local`:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=your_supabase_url  
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_DRIVE_CLIENT_ID=your_google_drive_client_id
VITE_GOOGLE_DRIVE_API_KEY=your_google_drive_api_key
```

## Features

- ✅ Automatic database saving after each evaluation
- ✅ Session tracking for batch evaluations
- ✅ Error logging and debugging
- ✅ Processing time tracking
- ✅ Google Drive metadata storage
- ✅ Structured criteria scoring
- ✅ JSON feedback storage (strengths/improvements)
- ✅ Row-level security policies
- ✅ Automatic timestamp management

## Troubleshooting

### Common Issues

1. **Table doesn't exist**: Run the schema SQL in Supabase
2. **Permission denied**: Check RLS policies and authentication
3. **Import errors**: Verify the database service file path
4. **Connection issues**: Check Supabase environment variables

### Debugging

Check the browser console for database operation logs:
- Successful saves: `Successfully saved PDF evaluation results for [filename]`
- Errors: `Failed to save evaluation to database: [error message]`

The component logs both successful saves and errors to help with troubleshooting.
