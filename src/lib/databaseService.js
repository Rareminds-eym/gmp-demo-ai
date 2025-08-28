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
