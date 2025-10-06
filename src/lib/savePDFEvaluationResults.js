import { supabase } from './supabase';

/**
 * Safely parse JSON string, return default value if parsing fails
 * @param {string} jsonString - JSON string to parse
 * @param {any} defaultValue - Default value if parsing fails
 * @returns {any} - Parsed object or default value
 */
const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return jsonString ? JSON.parse(jsonString) : defaultValue;
  } catch (error) {
    console.warn('Failed to parse JSON:', jsonString, error);
    return defaultValue;
  }
};

/**
 * Test Supabase connection and table access
 * @returns {Object} - Test result
 */
export const testSupabaseConnection = async () => {
  try {
    console.log('=== SUPABASE CONNECTION DEBUG ===');
    
    // Check environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('Environment check:');
    console.log('- VITE_SUPABASE_URL:', supabaseUrl);
    console.log('- VITE_SUPABASE_ANON_KEY exists:', !!supabaseKey);
    console.log('- VITE_SUPABASE_ANON_KEY length:', supabaseKey?.length || 0);
    
    if (!supabaseUrl || !supabaseKey) {
      return { 
        success: false, 
        error: 'Missing environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local',
        suggestion: 'Create or update .env.local file with your Supabase credentials'
      };
    }
    
    // Check if URL looks valid
    if (!supabaseUrl.includes('.supabase.co') && !supabaseUrl.includes('localhost')) {
      console.error('Supabase URL looks invalid:', supabaseUrl);
      return {
        success: false,
        error: 'Invalid Supabase URL format',
        suggestion: 'URL should be like https://your-project.supabase.co'
      };
    }
    
    // Test 1: Simple table query
    console.log('\nTest 1: Table access test...');
    const { data, error, status, statusText } = await supabase
      .from('pdf_evaluations')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Table access failed:');
      console.error('- Error:', error);
      console.error('- Status:', status);
      console.error('- Status Text:', statusText);
      console.error('- Error message:', error.message);
      console.error('- Error code:', error.code);
      console.error('- Error hint:', error.hint);
      console.error('- Error details:', error.details);
      
      // Check if it's a network/auth issue
      if (error.message?.includes('fetch')) {
        return {
          success: false,
          error: 'Network connectivity issue: ' + error.message,
          suggestion: 'Check your internet connection and Supabase URL'
        };
      }
      
      if (error.message?.includes('Invalid API key') || error.code === 'PGRST301') {
        return {
          success: false,
          error: 'Authentication failed: ' + error.message,
          suggestion: 'Check your VITE_SUPABASE_ANON_KEY is correct'
        };
      }
      
      // Test 2: Try a basic health check
      console.log('\nTest 2: Basic connectivity test...');
      try {
        const response = await fetch(supabaseUrl + '/rest/v1/', {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });
        
        console.log('Basic connectivity response:', response.status, response.statusText);
        
        if (!response.ok) {
          return {
            success: false,
            error: `Connection failed: ${response.status} ${response.statusText}`,
            suggestion: 'Verify your Supabase project URL and API key'
          };
        }
        
        return {
          success: false,
          error: `Table access denied: ${error.message}`,
          suggestion: 'Table exists but access denied. Check table permissions or RLS policies'
        };
      } catch (fetchError) {
        console.error('Basic connectivity test failed:', fetchError);
        return {
          success: false,
          error: `Connection failed: ${error.message}. Network error: ${fetchError.message}`,
          suggestion: 'Check your internet connection and Supabase configuration'
        };
      }
    }
    
    console.log('✅ Supabase connection test successful!');
    console.log('Records found:', data?.length || 0);
    return { success: true, error: null, data };
  } catch (err) {
    console.error('Unexpected error during connection test:', err);
    return { 
      success: false, 
      error: 'Unexpected error: ' + err.message,
      suggestion: 'Check browser console for detailed error information'
    };
  }
};

/**
 * Saves PDF evaluation results to the database
 * @param {Object} evaluationData - The PDF evaluation result data
 * @param {string} evaluationData.fileName - PDF file name
 * @param {string} evaluationData.fileId - Google Drive file ID (optional)
 * @param {number} evaluationData.fileSize - File size in bytes (optional)
 * @param {Object} evaluationData.criterion1 - Criterion 1 results {score, justification}
 * @param {Object} evaluationData.criterion2 - Criterion 2 results {score, justification}
 * @param {Object} evaluationData.criterion3 - Criterion 3 results {score, justification}
 * @param {Object} evaluationData.criterion4 - Criterion 4 results {score, justification}
 * @param {number} evaluationData.total_score - Total score (sum of all criteria)
 * @param {Array} evaluationData.strengths - Array of strength statements
 * @param {Array} evaluationData.improvements - Array of improvement suggestions
 * @param {string} evaluationData.overall_feedback - Overall feedback text
 * @param {string} evaluationData.sessionId - Processing session ID (optional)
 * @param {string} evaluationData.driveFolderId - Google Drive folder ID (optional)
 * @param {number} evaluationData.processingDurationMs - Processing time in ms (optional)
 * @returns {Object} - Object containing insert result and any errors
 */
export const savePDFEvaluationResults = async (evaluationData) => {
  try {
    const {
      fileName,
      fileId = null,
      fileSize = null,
      criterion1,
      criterion2,
      criterion3,
      criterion4,
      total_score,
      strengths = [],
      improvements = [],
      overall_feedback = null,
      sessionId = null,
      driveFolderId = null,
      processingDurationMs = null,
      driveAccessTokenHash = null
    } = evaluationData;
    
    if (!fileName || !criterion1 || !criterion2 || !criterion3 || !criterion4 || total_score === undefined) {
      console.error('Missing required fields:', {
        fileName: !!fileName,
        criterion1: !!criterion1,
        criterion2: !!criterion2,
        criterion3: !!criterion3,
        criterion4: !!criterion4,
        total_score: total_score !== undefined
      });
      throw new Error('fileName, all criteria, and total_score are required');
    }

    // Validate criterion structure
    const criteriaToValidate = [criterion1, criterion2, criterion3, criterion4];
    const criteriaNames = ['criterion1', 'criterion2', 'criterion3', 'criterion4'];
    
    for (let i = 0; i < criteriaToValidate.length; i++) {
      const criteria = criteriaToValidate[i];
      const name = criteriaNames[i];
      
      if (!criteria || typeof criteria.score !== 'number' || !criteria.justification) {
        console.error(`Invalid ${name} structure:`, criteria);
        throw new Error(`${name} must have score (number) and justification (string)`);
      }
    }

    const pdfEvaluationRecord = {
      file_name: fileName,
      file_id: fileId,
      file_size: fileSize,
      
      // Criteria scores and justifications
      criterion1_score: criterion1.score || 0,
      criterion1_justification: criterion1.justification || null,
      
      criterion2_score: criterion2.score || 0,
      criterion2_justification: criterion2.justification || null,
      
      criterion3_score: criterion3.score || 0,
      criterion3_justification: criterion3.justification || null,
      
      criterion4_score: criterion4.score || 0,
      criterion4_justification: criterion4.justification || null,
      
      // Total score
      total_score: total_score,
      
      // Feedback (store as JSONB - Supabase handles JSON.stringify automatically)
      strengths: strengths,
      improvements: improvements,
      overall_feedback: overall_feedback,
      
      // Processing metadata
      evaluation_status: 'success',
      processing_session_id: sessionId,
      ai_model: 'gemini-2.0-flash-exp',
      processing_duration_ms: processingDurationMs,
      
      // Google Drive metadata
      drive_folder_id: driveFolderId,
      drive_access_token_hash: driveAccessTokenHash
    };

    console.log('Attempting to insert PDF evaluation record:', {
      file_name: pdfEvaluationRecord.file_name,
      total_score: pdfEvaluationRecord.total_score,
      criterion1_score: pdfEvaluationRecord.criterion1_score,
      criterion2_score: pdfEvaluationRecord.criterion2_score,
      criterion3_score: pdfEvaluationRecord.criterion3_score,
      criterion4_score: pdfEvaluationRecord.criterion4_score
    });

    const { data, error } = await supabase
      .from('pdf_evaluations')
      .insert([pdfEvaluationRecord])
      .select();

    if (error) {
      console.error('Failed to insert PDF evaluation results:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      console.error('Record that failed to insert:', pdfEvaluationRecord);
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      console.warn('Insert succeeded but no data returned');
      return { data: null, error: 'No data returned from insert' };
    }

    console.log(`Successfully saved PDF evaluation results for ${fileName}`);
    console.log('Inserted record ID:', data[0]?.id);
    console.log('Full inserted record:', data[0]);
    return { data: data[0], error: null };
  } catch (err) {
    console.error('Error saving PDF evaluation results:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Saves PDF evaluation error to the database
 * @param {Object} errorData - The error data
 * @param {string} errorData.fileName - PDF file name
 * @param {string} errorData.fileId - Google Drive file ID (optional)
 * @param {string} errorData.error_message - Error message
 * @param {string} errorData.sessionId - Processing session ID (optional)
 * @param {string} errorData.driveFolderId - Google Drive folder ID (optional)
 * @returns {Object} - Object containing insert result and any errors
 */
export const savePDFEvaluationError = async (errorData) => {
  try {
    const { fileName, fileId, error_message, sessionId, driveFolderId, driveAccessTokenHash } = errorData;
    
    if (!fileName || !error_message) {
      throw new Error('fileName and error_message are required');
    }

    const errorRecord = {
      file_name: fileName,
      file_id: fileId || null,
      total_score: 0,
      evaluation_status: 'error',
      error_message: error_message,
      processing_session_id: sessionId || null,
      ai_model: 'gemini-2.0-flash-exp',
      drive_folder_id: driveFolderId || null,
      drive_access_token_hash: driveAccessTokenHash || null
    };

    const { data, error } = await supabase
      .from('pdf_evaluations')
      .insert([errorRecord])
      .select();

    if (error) {
      console.error('Failed to insert PDF evaluation error:', error);
      return { data: null, error: error.message };
    }

    console.log(`Successfully saved PDF evaluation error for ${fileName}`);
    return { data: data[0], error: null };
  } catch (err) {
    console.error('Error saving PDF evaluation error:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Fetches PDF evaluation results with optional filters
 * @param {Object} filters - Filter options
 * @param {string} filters.fileName - File name filter (partial match)
 * @param {string} filters.fileId - Google Drive file ID filter
 * @param {string} filters.sessionId - Session ID filter
 * @param {number} filters.minScore - Minimum score filter
 * @param {number} filters.maxScore - Maximum score filter
 * @param {string} filters.evaluationStatus - Evaluation status filter
 * @param {number} filters.limit - Limit results
 * @returns {Object} - Object containing filtered PDF evaluations and any errors
 */
export const fetchPDFEvaluationResults = async (filters = {}) => {
  try {
    let query = supabase
      .from('pdf_evaluations')
      .select('*');

    // Apply filters
    if (filters.fileName) {
      query = query.ilike('file_name', `%${filters.fileName.trim()}%`);
    }
    
    if (filters.fileId) {
      query = query.eq('file_id', filters.fileId);
    }
    
    if (filters.sessionId) {
      query = query.eq('processing_session_id', filters.sessionId);
    }
    
    if (filters.minScore !== undefined) {
      query = query.gte('total_score', filters.minScore);
    }
    
    if (filters.maxScore !== undefined) {
      query = query.lte('total_score', filters.maxScore);
    }
    
    if (filters.evaluationStatus) {
      query = query.eq('evaluation_status', filters.evaluationStatus);
    }

    // Apply ordering and limit
    query = query.order('processed_at', { ascending: false });
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch PDF evaluation results:', error);
      return { data: null, error: error.message };
    }

    console.log(`Fetched ${data ? data.length : 0} PDF evaluation records`);
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error fetching PDF evaluation results:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Checks if a PDF evaluation already exists for the given file
 * @param {string} fileName - File name to check
 * @param {string} fileId - Google Drive file ID (optional)
 * @returns {Object} - Object containing exists flag and any errors
 */
export const checkPDFEvaluationExists = async (fileName, fileId = null) => {
  try {
    if (!fileName) {
      throw new Error('fileName is required');
    }

    let query = supabase
      .from('pdf_evaluations')
      .select('*') // Select all fields to get complete evaluation data
      .eq('file_name', fileName)
      .order('processed_at', { ascending: false })
      .limit(1);

    // Add file_id filter if provided
    if (fileId) {
      query = query.eq('file_id', fileId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to check PDF evaluation existence:', error);
      return { exists: false, data: null, error: error.message };
    }

    const exists = data && data.length > 0;
    const record = exists ? data[0] : null;
    const isSuccess = record && record.evaluation_status === 'success';
    
    return { 
      exists, 
      data: record, 
      error: null,
      isSuccess,
      needsUpdate: exists && !isSuccess
    };
  } catch (err) {
    console.error('Error checking PDF evaluation existence:', err);
    return { exists: false, data: null, error: err.message };
  }
};
