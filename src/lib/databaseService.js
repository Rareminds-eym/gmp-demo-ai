import { supabase } from './supabase';

/**
 * Fetches all stage data from the database using the specified columns
 * @param {string|null} email - Optional email filter
 * @param {number|null} limit - Optional limit for results
 * @returns {Object} - Object containing data and any errors
 */
export const fetchStageData = async (email = null, limit = null) => {
  try {
    let query = supabase
      .from('level2_screen3_progress')
      .select(`
        id,
        user_id,
        email,
        case_id,
        selected_case_id,
        current_stage,
        progress_percentage,
        is_completed,
        created_at,
        updated_at,
        idea_statement,
        stage2_problem,
        stage3_technology,
        stage4_collaboration,
        stage5_creativity,
        stage6_speed_scale,
        stage7_impact,
        stage8_final_problem,
        stage10_reflection
      `)
      .order('updated_at', { ascending: false });

    // Apply email filter if provided
    if (email) {
      query = query.ilike('email', `%${email.trim()}%`);
    }

    // Apply limit if provided
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database query failed:', error);
      return { data: null, error: error.message };
    }

    console.log(`Fetched ${data ? data.length : 0} records from database`);
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error fetching stage data:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Fetches a single user's stage data by email
 * @param {string} email - User's email address
 * @returns {Object} - Object containing user data and any errors
 */
export const fetchUserStageData = async (email) => {
  try {
    const { data, error } = await supabase
      .from('level2_screen3_progress')
      .select(`
        id,
        user_id,
        email,
        case_id,
        selected_case_id,
        current_stage,
        progress_percentage,
        is_completed,
        created_at,
        updated_at,
        idea_statement,
        stage2_problem,
        stage3_technology,
        stage4_collaboration,
        stage5_creativity,
        stage6_speed_scale,
        stage7_impact,
        stage8_final_problem,
        stage10_reflection
      `)
      .eq('email', email.trim())
      .single();

    if (error) {
      console.error('Database query failed:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Error fetching user stage data:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Fetches all stage data with optional filters
 * @param {Object} filters - Filter options
 * @param {string} filters.email - Email filter
 * @param {number} filters.case_id - Case ID filter
 * @param {boolean} filters.is_completed - Completion status filter
 * @param {number} filters.current_stage - Current stage filter
 * @param {number} filters.limit - Limit results
 * @returns {Object} - Object containing filtered data and any errors
 */
export const fetchFilteredStageData = async (filters = {}) => {
  try {
    let query = supabase
      .from('level2_screen3_progress')
      .select(`
        id,
        user_id,
        email,
        case_id,
        selected_case_id,
        current_stage,
        progress_percentage,
        is_completed,
        created_at,
        updated_at,
        idea_statement,
        stage2_problem,
        stage3_technology,
        stage4_collaboration,
        stage5_creativity,
        stage6_speed_scale,
        stage7_impact,
        stage8_final_problem,
        stage10_reflection
      `);

    // Apply filters
    if (filters.email) {
      query = query.ilike('email', `%${filters.email.trim()}%`);
    }
    
    if (filters.case_id) {
      query = query.eq('case_id', filters.case_id);
    }
    
    if (typeof filters.is_completed === 'boolean') {
      query = query.eq('is_completed', filters.is_completed);
    }
    
    if (filters.current_stage) {
      query = query.eq('current_stage', filters.current_stage);
    }

    // Apply ordering and limit
    query = query.order('updated_at', { ascending: false });
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database query failed:', error);
      return { data: null, error: error.message };
    }

    console.log(`Fetched ${data ? data.length : 0} filtered records from database`);
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error fetching filtered stage data:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Fetches statistics about stage completions
 * @returns {Object} - Object containing statistics and any errors
 */
export const fetchStageStatistics = async () => {
  try {
    const { data, error } = await supabase
      .from('level2_screen3_progress')
      .select(`
        current_stage,
        is_completed,
        stage2_problem,
        stage3_technology,
        stage4_collaboration,
        stage5_creativity,
        stage6_speed_scale,
        stage7_impact,
        stage8_final_problem,
        stage10_reflection
      `);

    if (error) {
      console.error('Database query failed:', error);
      return { data: null, error: error.message };
    }

    // Calculate statistics
    const stats = {
      total_users: data.length,
      completed_users: data.filter(user => user.is_completed).length,
      stage_completion: {},
      stage_response_rates: {}
    };

    // Calculate stage completion rates
    for (let stage = 1; stage <= 10; stage++) {
      stats.stage_completion[stage] = data.filter(user => user.current_stage >= stage).length;
    }

    // Calculate response rates for each stage column
    const stageColumns = [
      'stage2_problem',
      'stage3_technology', 
      'stage4_collaboration',
      'stage5_creativity',
      'stage6_speed_scale',
      'stage7_impact',
      'stage8_final_problem',
      'stage10_reflection'
    ];

    stageColumns.forEach(column => {
      const responsesCount = data.filter(user => user[column] && user[column].trim() !== '').length;
      stats.stage_response_rates[column] = {
        responses: responsesCount,
        percentage: data.length > 0 ? ((responsesCount / data.length) * 100).toFixed(2) : 0
      };
    });

    return { data: stats, error: null };
  } catch (err) {
    console.error('Error fetching stage statistics:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Saves AI evaluation results to the database
 * @param {Object} evaluationData - The evaluation result data
 * @param {string} evaluationData.email - User's email
 * @param {string} evaluationData.user_id - User's ID (optional)
 * @param {number} evaluationData.case_id - Case study ID (optional)
 * @param {Object} evaluationData.aiResults - AI evaluation results object
 * @param {string} evaluationData.batchId - Batch processing ID (optional)
 * @returns {Object} - Object containing insert result and any errors
 */
export const saveEvaluationResults = async (evaluationData) => {
  try {
    const { email, user_id, case_id, aiResults, batchId } = evaluationData;
    
    if (!email || !aiResults) {
      throw new Error('Email and AI results are required');
    }

    // Extract stage scores from AI results
    const stageScores = aiResults.stageScores || {};
    
    const evaluationRecord = {
      email: email.trim(),
      user_id: user_id || null,
      case_id: case_id || null,
      total_score: aiResults.totalScore || 0,
      
      // Individual stage scores and feedback
      idea_score: stageScores.idea?.score || null,
      idea_status: stageScores.idea?.status || null,
      idea_feedback: stageScores.idea?.feedback || null,
      
      problem_score: stageScores.problem?.score || null,
      problem_status: stageScores.problem?.status || null,
      problem_feedback: stageScores.problem?.feedback || null,
      
      technology_score: stageScores.technology?.score || null,
      technology_status: stageScores.technology?.status || null,
      technology_feedback: stageScores.technology?.feedback || null,
      
      collaboration_score: stageScores.collaboration?.score || null,
      collaboration_status: stageScores.collaboration?.status || null,
      collaboration_feedback: stageScores.collaboration?.feedback || null,
      
      creativity_score: stageScores.creativity?.score || null,
      creativity_status: stageScores.creativity?.status || null,
      creativity_feedback: stageScores.creativity?.feedback || null,
      
      scale_score: stageScores.scale?.score || null,
      scale_status: stageScores.scale?.status || null,
      scale_feedback: stageScores.scale?.feedback || null,
      
      impact_score: stageScores.impact?.score || null,
      impact_status: stageScores.impact?.status || null,
      impact_feedback: stageScores.impact?.feedback || null,
      
      pitch_score: stageScores.pitch?.score || null,
      pitch_status: stageScores.pitch?.status || null,
      pitch_feedback: stageScores.pitch?.feedback || null,
      
      // Overall feedback and recommendations
      overall_feedback: aiResults.overallFeedback || null,
      recommendations: aiResults.recommendations ? JSON.stringify(aiResults.recommendations) : null,
      
      // Processing metadata
      evaluation_status: 'success',
      processing_batch_id: batchId || null,
      ai_model: 'gemini-2.0-flash-exp'
    };

    const { data, error } = await supabase
      .from('evaluation_results')
      .insert([evaluationRecord])
      .select();

    if (error) {
      console.error('Failed to insert evaluation results:', error);
      return { data: null, error: error.message };
    }

    console.log(`Successfully saved evaluation results for ${email}`);
    return { data: data[0], error: null };
  } catch (err) {
    console.error('Error saving evaluation results:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Saves error evaluation result to the database
 * @param {Object} errorData - The error data
 * @param {string} errorData.email - User's email
 * @param {string} errorData.error_message - Error message
 * @param {string} errorData.batchId - Batch processing ID (optional)
 * @returns {Object} - Object containing insert result and any errors
 */
export const saveEvaluationError = async (errorData) => {
  try {
    const { email, error_message, batchId, user_id, case_id } = errorData;
    
    if (!email || !error_message) {
      throw new Error('Email and error message are required');
    }

    const errorRecord = {
      email: email.trim(),
      user_id: user_id || null,
      case_id: case_id || null,
      total_score: 0,
      evaluation_status: 'error',
      error_message: error_message,
      processing_batch_id: batchId || null,
      ai_model: 'gemini-2.0-flash-exp'
    };

    const { data, error } = await supabase
      .from('evaluation_results')
      .insert([errorRecord])
      .select();

    if (error) {
      console.error('Failed to insert evaluation error:', error);
      return { data: null, error: error.message };
    }

    console.log(`Successfully saved evaluation error for ${email}`);
    return { data: data[0], error: null };
  } catch (err) {
    console.error('Error saving evaluation error:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Updates an existing evaluation result in the database
 * @param {number} recordId - ID of the existing record to update
 * @param {Object} evaluationData - The evaluation data
 * @param {string} evaluationData.email - User's email
 * @param {string} evaluationData.user_id - User's ID (optional)
 * @param {number} evaluationData.case_id - Case study ID (optional)
 * @param {Object} evaluationData.aiResults - AI evaluation results object
 * @param {string} evaluationData.batchId - Batch processing ID (optional)
 * @returns {Object} - Object containing update result and any errors
 */
export const updateEvaluationResults = async (recordId, evaluationData) => {
  try {
    const { email, user_id, case_id, aiResults, batchId } = evaluationData;
    
    if (!recordId || !email || !aiResults) {
      throw new Error('Record ID, email and AI results are required');
    }

    // Extract stage scores from AI results
    const stageScores = aiResults.stageScores || {};
    
    const evaluationRecord = {
      email: email.trim(),
      user_id: user_id || null,
      case_id: case_id || null,
      total_score: aiResults.totalScore || 0,
      
      // Individual stage scores and feedback
      idea_score: stageScores.idea?.score || null,
      idea_status: stageScores.idea?.status || null,
      idea_feedback: stageScores.idea?.feedback || null,
      
      problem_score: stageScores.problem?.score || null,
      problem_status: stageScores.problem?.status || null,
      problem_feedback: stageScores.problem?.feedback || null,
      
      technology_score: stageScores.technology?.score || null,
      technology_status: stageScores.technology?.status || null,
      technology_feedback: stageScores.technology?.feedback || null,
      
      collaboration_score: stageScores.collaboration?.score || null,
      collaboration_status: stageScores.collaboration?.status || null,
      collaboration_feedback: stageScores.collaboration?.feedback || null,
      
      creativity_score: stageScores.creativity?.score || null,
      creativity_status: stageScores.creativity?.status || null,
      creativity_feedback: stageScores.creativity?.feedback || null,
      
      scale_score: stageScores.scale?.score || null,
      scale_status: stageScores.scale?.status || null,
      scale_feedback: stageScores.scale?.feedback || null,
      
      impact_score: stageScores.impact?.score || null,
      impact_status: stageScores.impact?.status || null,
      impact_feedback: stageScores.impact?.feedback || null,
      
      pitch_score: stageScores.pitch?.score || null,
      pitch_status: stageScores.pitch?.status || null,
      pitch_feedback: stageScores.pitch?.feedback || null,
      
      // Overall feedback and recommendations
      overall_feedback: aiResults.overallFeedback || null,
      recommendations: aiResults.recommendations ? JSON.stringify(aiResults.recommendations) : null,
      
      // Processing metadata - update these fields
      evaluation_status: 'success',
      error_message: null, // Clear any previous error message
      processing_batch_id: batchId || null,
      ai_model: 'gemini-2.0-flash-exp',
      processed_at: new Date().toISOString() // Update the processed timestamp
    };

    const { data, error } = await supabase
      .from('evaluation_results')
      .update(evaluationRecord)
      .eq('id', recordId)
      .select();

    if (error) {
      console.error('Failed to update evaluation results:', error);
      return { data: null, error: error.message };
    }

    console.log(`Successfully updated evaluation results for ${email}`);
    return { data: data[0], error: null };
  } catch (err) {
    console.error('Error updating evaluation results:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Fetches evaluation results by email
 * @param {string} email - User's email
 * @returns {Object} - Object containing evaluation results and any errors
 */
export const fetchEvaluationResults = async (email) => {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    const { data, error } = await supabase
      .from('evaluation_results')
      .select('*')
      .eq('email', email.trim())
      .order('processed_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch evaluation results:', error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error fetching evaluation results:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Debug function to check process logs table and show sample data
 * @returns {Object} - Sample data from process_logs table
 */
export const debugProcessLogs = async () => {
  try {
    const { data, error } = await supabase
      .from('process_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Failed to fetch process logs:', error);
      return { data: null, error: error.message };
    }

    console.log('Recent process logs:', data);
    
    // Check for null values
    if (data && data.length > 0) {
      const firstRecord = data[0];
      const nullFields = [];
      
      Object.keys(firstRecord).forEach(key => {
        if (firstRecord[key] === null || firstRecord[key] === undefined) {
          nullFields.push(key);
        }
      });
      
      console.log('Fields with null values:', nullFields);
    }

    return { data, error: null };
  } catch (err) {
    console.error('Error debugging process logs:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Simple test function to insert a basic log entry
 * @returns {Object} - Test result
 */
export const testLogInsertion = async () => {
  try {
    const testRecord = {
      session_id: 'test_session_' + Date.now(),
      log_level: 'INFO',
      log_type: 'TEST',
      message: 'Test log message',
      component_name: 'TestComponent',
      environment: 'development'
    };

    console.log('Inserting test record:', testRecord);

    const { data, error } = await supabase
      .from('process_logs')
      .insert([testRecord])
      .select();

    if (error) {
      console.error('Test insertion failed:', error);
      return { success: false, error: error.message, data: null };
    }

    console.log('Test insertion successful:', data[0]);
    return { success: true, error: null, data: data[0] };
  } catch (err) {
    console.error('Test insertion error:', err);
    return { success: false, error: err.message, data: null };
  }
};

/**
 * Logs process events to the process_logs table
 * @param {Object} logData - The log data
 * @param {string} logData.sessionId - Session identifier
 * @param {string} logData.batchId - Batch identifier (optional)
 * @param {number} logData.batchNumber - Batch number (optional)
 * @param {number} logData.totalBatches - Total batches (optional)
 * @param {string} logData.email - User email (optional)
 * @param {number} logData.userIndex - User index in batch (optional)
 * @param {number} logData.totalUsers - Total users in batch (optional)
 * @param {number} logData.globalUserIndex - Global user index (optional)
 * @param {number} logData.totalSessionUsers - Total users in session (optional)
 * @param {string} logData.logLevel - Log level (DEBUG, INFO, WARN, ERROR)
 * @param {string} logData.logType - Log type (SESSION_START, USER_PROCESSING, etc.)
 * @param {string} logData.message - Log message
 * @param {Object} logData.details - Additional structured data (optional)
 * @param {string} logData.processingStatus - Processing status (optional)
 * @param {number} logData.totalScore - Total score (optional)
 * @param {number} logData.processingDurationMs - Processing duration (optional)
 * @param {number} logData.apiCallsMade - API calls made (optional)
 * @param {string} logData.errorMessage - Error message (optional)
 * @param {string} logData.errorCode - Error code (optional)
 * @param {string} logData.stackTrace - Stack trace (optional)
 * @param {boolean} logData.dbSaveAttempted - Database save attempted (optional)
 * @param {boolean} logData.dbSaveSuccessful - Database save successful (optional)
 * @param {string} logData.dbErrorMessage - Database error message (optional)
 * @param {string} logData.aiModel - AI model used (optional)
 * @returns {Object} - Object containing insert result and any errors
 */
export const logProcessEvent = async (logData) => {
  try {
    const {
      sessionId,
      batchId = null,
      batchNumber = null,
      totalBatches = null,
      email = null,
      userIndex = null,
      totalUsers = null,
      globalUserIndex = null,
      totalSessionUsers = null,
      logLevel = 'INFO',
      logType,
      message,
      details = null,
      processingStatus = null,
      totalScore = null,
      processingDurationMs = null,
      apiCallsMade = 0,
      errorMessage = null,
      errorCode = null,
      stackTrace = null,
      dbSaveAttempted = null,
      dbSaveSuccessful = null,
      dbErrorMessage = null,
      startedAt = null,
      completedAt = null,
      aiModel = null,
      componentName = 'BatchEvaluationProcessor',
      environment = 'production'
    } = logData;

    if (!sessionId || !logType || !message) {
      throw new Error('sessionId, logType, and message are required for logging');
    }

    // Clean and validate data before inserting
    const logRecord = {
      session_id: sessionId,
      batch_id: batchId,
      batch_number: batchNumber,
      total_batches: totalBatches,
      email: email,
      user_index: userIndex,
      total_users: totalUsers,
      global_user_index: globalUserIndex,
      total_session_users: totalSessionUsers,
      log_level: logLevel,
      log_type: logType,
      message: message,
      details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
      processing_status: processingStatus,
      total_score: totalScore,
      processing_duration_ms: processingDurationMs,
      api_calls_made: apiCallsMade,
      error_message: errorMessage,
      error_code: errorCode,
      stack_trace: stackTrace,
      db_save_attempted: dbSaveAttempted,
      db_save_successful: dbSaveSuccessful,
      db_error_message: dbErrorMessage,
      started_at: startedAt ? new Date(startedAt).toISOString() : null,
      completed_at: completedAt ? new Date(completedAt).toISOString() : null,
      component_name: componentName,
      ai_model: aiModel,
      environment: environment
    };

    // Debug logging to see what's being inserted
    console.log('Inserting log record:', {
      session_id: logRecord.session_id,
      log_type: logRecord.log_type,
      email: logRecord.email || 'N/A',
      message: logRecord.message,
      batch_id: logRecord.batch_id,
      processing_status: logRecord.processing_status,
      db_save_attempted: logRecord.db_save_attempted,
      db_save_successful: logRecord.db_save_successful
    });

    const { data, error } = await supabase
      .from('process_logs')
      .insert([logRecord])
      .select();

    if (error) {
      console.error('Failed to insert process log:', error);
      console.error('Log record that failed:', logRecord);
      return { data: null, error: error.message };
    }

    console.log('Successfully inserted log:', data[0]?.id);
    return { data: data[0], error: null };
  } catch (err) {
    console.error('Error logging process event:', err);
    console.error('Original log data:', logData);
    return { data: null, error: err.message };
  }
};

/**
 * Fetches session summary from process logs
 * @param {string} sessionId - Session identifier
 * @returns {Object} - Object containing session summary and any errors
 */
export const getSessionSummary = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    const { data, error } = await supabase
      .from('session_summary')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      console.error('Failed to fetch session summary:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Error fetching session summary:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Fetches batch summaries for a session
 * @param {string} sessionId - Session identifier
 * @returns {Object} - Object containing batch summaries and any errors
 */
export const getBatchSummaries = async (sessionId) => {
  try {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    const { data, error } = await supabase
      .from('batch_summary')
      .select('*')
      .eq('session_id', sessionId)
      .order('batch_number', { ascending: true });

    if (error) {
      console.error('Failed to fetch batch summaries:', error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error fetching batch summaries:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Fetches process logs with optional filters
 * @param {Object} filters - Filter options
 * @param {string} filters.sessionId - Session ID filter
 * @param {string} filters.batchId - Batch ID filter
 * @param {string} filters.email - Email filter
 * @param {string} filters.logLevel - Log level filter
 * @param {string} filters.logType - Log type filter
 * @param {string} filters.processingStatus - Processing status filter
 * @param {number} filters.limit - Limit results
 * @returns {Object} - Object containing filtered logs and any errors
 */
export const getProcessLogs = async (filters = {}) => {
  try {
    let query = supabase
      .from('process_logs')
      .select('*');

    // Apply filters
    if (filters.sessionId) {
      query = query.eq('session_id', filters.sessionId);
    }
    
    if (filters.batchId) {
      query = query.eq('batch_id', filters.batchId);
    }
    
    if (filters.email) {
      query = query.eq('email', filters.email);
    }
    
    if (filters.logLevel) {
      query = query.eq('log_level', filters.logLevel);
    }
    
    if (filters.logType) {
      query = query.eq('log_type', filters.logType);
    }
    
    if (filters.processingStatus) {
      query = query.eq('processing_status', filters.processingStatus);
    }

    // Apply ordering and limit
    query = query.order('created_at', { ascending: false });
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch process logs:', error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error fetching process logs:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Fetches email processing summary from process logs
 * @param {string} email - Optional email filter
 * @returns {Object} - Object containing email processing summaries and any errors
 */
export const getEmailProcessingSummary = async (email = null) => {
  try {
    let query = supabase
      .from('email_processing_summary')
      .select('*');

    if (email) {
      query = query.eq('email', email);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch email processing summary:', error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error fetching email processing summary:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Fetches email activity timeline from process logs
 * @param {string} email - Email to get timeline for
 * @returns {Object} - Object containing email activity timeline and any errors
 */
export const getEmailActivityTimeline = async (email) => {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    const { data, error } = await supabase
      .from('email_activity_timeline')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch email activity timeline:', error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error fetching email activity timeline:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Fetches batch email summaries from process logs
 * @param {string} sessionId - Optional session ID filter
 * @returns {Object} - Object containing batch email summaries and any errors
 */
export const getBatchEmailSummaries = async (sessionId = null) => {
  try {
    let query = supabase
      .from('batch_email_summary')
      .select('*')
      .order('session_id', { ascending: true })
      .order('batch_number', { ascending: true });

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch batch email summaries:', error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error fetching batch email summaries:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Fetches all emails that have been processed in the system
 * @param {Object} filters - Filter options
 * @param {string} filters.processingStatus - Filter by processing status
 * @param {number} filters.minScore - Minimum score filter
 * @param {number} filters.maxScore - Maximum score filter
 * @param {number} filters.limit - Limit results
 * @returns {Object} - Object containing processed emails and any errors
 */
export const getProcessedEmails = async (filters = {}) => {
  try {
    let query = supabase
      .from('process_logs')
      .select('email, processing_status, total_score, created_at, session_id, batch_id')
      .not('email', 'is', null);

    // Apply filters
    if (filters.processingStatus) {
      query = query.eq('processing_status', filters.processingStatus);
    }
    
    if (filters.minScore) {
      query = query.gte('total_score', filters.minScore);
    }
    
    if (filters.maxScore) {
      query = query.lte('total_score', filters.maxScore);
    }

    // Apply ordering and limit
    query = query.order('created_at', { ascending: false });
    
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch processed emails:', error);
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error fetching processed emails:', err);
    return { data: null, error: err.message };
  }
};

/**
 * Checks if an evaluation result already exists for the given email
 * @param {string} email - User's email
 * @returns {Object} - Object containing exists flag and any errors
 */
export const checkEvaluationExists = async (email) => {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    const { data, error } = await supabase
      .from('evaluation_results')
      .select('email, processed_at, total_score, evaluation_status, error_message, id')
      .eq('email', email.trim())
      .order('processed_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Failed to check evaluation existence:', error);
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
    console.error('Error checking evaluation existence:', err);
    return { exists: false, data: null, error: err.message };
  }
};

/**
 * Fetches evaluation results statistics
 * @returns {Object} - Object containing evaluation statistics and any errors
 */
export const fetchEvaluationStatistics = async () => {
  try {
    const { data, error } = await supabase
      .from('evaluation_results')
      .select(`
        total_score,
        evaluation_status,
        processed_at,
        processing_batch_id
      `);

    if (error) {
      console.error('Failed to fetch evaluation statistics:', error);
      return { data: null, error: error.message };
    }

    // Calculate statistics
    const stats = {
      total_evaluations: data.length,
      successful_evaluations: data.filter(item => item.evaluation_status === 'success').length,
      failed_evaluations: data.filter(item => item.evaluation_status === 'error').length,
      average_score: data.length > 0 ? 
        (data.filter(item => item.evaluation_status === 'success')
              .reduce((sum, item) => sum + (item.total_score || 0), 0) / 
         data.filter(item => item.evaluation_status === 'success').length
        ).toFixed(2) : 0,
      score_distribution: {
        excellent: data.filter(item => item.total_score >= 80).length,
        good: data.filter(item => item.total_score >= 60 && item.total_score < 80).length,
        needs_improvement: data.filter(item => item.total_score >= 40 && item.total_score < 60).length,
        poor: data.filter(item => item.total_score < 40 && item.total_score > 0).length
      }
    };

    return { data: stats, error: null };
  } catch (err) {
    console.error('Error fetching evaluation statistics:', err);
    return { data: null, error: err.message };
  }
};
