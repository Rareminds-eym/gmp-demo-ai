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
