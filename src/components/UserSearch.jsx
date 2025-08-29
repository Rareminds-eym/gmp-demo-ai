import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Search, User, Calendar, AlertCircle, Users, BarChart } from 'lucide-react';
import BatchEvaluationProcessor from './BatchEvaluationProcessor';

const UserSearch = ({ onUserSelect, selectedUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const [batchUsers, setBatchUsers] = useState([]);
  const [showBatchProcessor, setShowBatchProcessor] = useState(false);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [batchComplete, setBatchComplete] = useState(false);

  // Debounced search function
  const searchUsers = useCallback(async (email) => {
    if (!email || email.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    setError(null);

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
          stage8_final_technology,
          stage8_final_collaboration,
          stage8_final_creativity,
          stage8_final_speed_scale,
          stage8_final_impact,
          stage10_reflection
        `)
        .ilike('email', `%${email.trim()}%`)
        .order('updated_at', { ascending: false })
        .limit(20); // Get more results for potential batch processing

      if (error) {
        console.error('Database query failed:', error);
        throw error;
      }

      console.log(`Found ${data ? data.length : 0} users matching "${email}"`);
      setSuggestions(data || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Error searching users:', err);
      let errorMessage = 'Failed to search users. ';
      
      if (err.code === 'PGRST301') {
        errorMessage += 'Table not found or no access permissions.';
      } else if (err.message.includes('JWT')) {
        errorMessage += 'Authentication failed. Check your Supabase credentials.';
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, searchUsers]);

  const handleUserSelect = (user) => {
    setSearchTerm(user.email);
    setShowSuggestions(false);
    onUserSelect(user);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value === '') {
      onUserSelect(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const getCompletedUserIds = () => {
    return [];
  };

  const loadBatchUsers = async (isNextBatch = false) => {
    setLoadingBatch(true);
    setError(null);
    setBatchComplete(false);

    try {
      const completedEmails = getCompletedUserIds();
      console.log(`Completed users to skip: ${completedEmails.length}`);

      // Calculate batch range based on start_id
      const batchNumber = Math.floor(currentOffset / 5);
      const startIdFrom = (batchNumber * 5) + 1; // Batch 1: 1-5, Batch 2: 6-10, etc.
      const startIdTo = startIdFrom + 4; // End of range

      console.log(`Loading batch ${batchNumber + 1}, start_id range: ${startIdFrom}-${startIdTo}`);

      // Load users based on start_id column for sequential ordering
      const { data, error } = await supabase
        .from('level2_screen3_progress')
        .select(`
          id,
          user_id,
          email,
          start_id,
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
          stage8_final_technology,
          stage8_final_collaboration,
          stage8_final_creativity,
          stage8_final_speed_scale,
          stage8_final_impact,
          stage10_reflection
        `)
        .gte('start_id', startIdFrom)
        .lte('start_id', startIdTo)
        .order('start_id', { ascending: true });

      if (error) {
        console.error('Database query failed:', error);
        throw error;
      }

      // Filter out completed users
      const uncompletedUsers = (data || []).filter(user => !completedEmails.includes(user.email));

      console.log(`Found ${data ? data.length : 0} users in start_id range ${startIdFrom}-${startIdTo}, ${uncompletedUsers.length} uncompleted`);

      if (uncompletedUsers.length === 0) {
        setError(`No uncompleted users found in start_id range ${startIdFrom}-${startIdTo}`);
        return;
      }

      setBatchUsers(uncompletedUsers);
      setShowBatchProcessor(true);
      setBatchComplete(false); // Reset batch completion status

      // Update offset for next batch (move to next set of 5)
      setCurrentOffset(prev => prev + 5);

    } catch (err) {
      console.error('Error loading batch users:', err);
      let errorMessage = 'Failed to load users for batch processing. ';

      if (err.code === 'PGRST301') {
        errorMessage += 'Table not found or no access permissions.';
      } else if (err.message.includes('JWT')) {
        errorMessage += 'Authentication failed. Check your Supabase credentials.';
      } else {
        errorMessage += err.message;
      }

      setError(errorMessage);
    } finally {
      setLoadingBatch(false);
    }
  };

  const handleBatchComplete = () => {
    console.log('Batch processing completed');
    setBatchComplete(true);
  };

  const loadNextBatch = async () => {
    // Reset the batch processor state
    setBatchComplete(false);
    setShowBatchProcessor(false);

    // Load next batch of users
    await loadBatchUsers(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      {/* Batch Processing Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">User Evaluation</h2>
              <p className="text-gray-600">Process first 5 users from database with AI evaluation</p>
            </div>
          </div>
          
          {!showBatchProcessor && (
            <button
              onClick={() => loadBatchUsers(false)}
              disabled={loadingBatch}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <BarChart className="h-5 w-5" />
              <span>
                {loadingBatch ? 'Loading Users...' : 'Load First 5 Users for Batch Processing'}
              </span>
            </button>
          )}

          {showBatchProcessor && batchComplete && (
            <button
              onClick={loadNextBatch}
              disabled={loadingBatch}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              <BarChart className="h-5 w-5" />
              <span>
                {loadingBatch ? 'Loading Next Users...' : 'Load Next 5 Users'}
              </span>
            </button>
          )}

          {showBatchProcessor && !batchComplete && (
            <div className="flex items-center space-x-2 bg-gray-100 text-gray-600 font-semibold py-3 px-6 rounded-lg">
              <BarChart className="h-5 w-5" />
              <span>Current Batch Processing...</span>
            </div>
          )}
        </div>
        
        {loadingBatch && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mr-2"></div>
            <span className="text-gray-600">Loading users for batch processing...</span>
          </div>
        )}
      </div>

      {/* Batch Evaluation Processor */}
      {showBatchProcessor && (
        <div className="mb-8">
          <BatchEvaluationProcessor 
            users={batchUsers} 
            onComplete={handleBatchComplete}
          />
        </div>
      )}

      {/* Individual User Search */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Search className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Individual User Search</h3>
        </div>
        
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="email"
            value={searchTerm}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Search by email address..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-lg"
            autoComplete="off"
          />
          {loading && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {/* Search suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg max-h-96 overflow-y-auto">
            {suggestions.map((user) => (
              <div
                key={user.id}
                className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                onClick={() => handleUserSelect(user)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Case ID: {user.case_id || user.selected_case_id || 'N/A'}</span>
                        <span>Stage: {user.current_stage}/10</span>
                        <span>Progress: {user.progress_percentage || 0}%</span>
                      </div>
                      {user.idea_statement && (
                        <p className="text-xs text-gray-600 mt-1 truncate max-w-md">
                          {user.idea_statement}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.is_completed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.is_completed ? 'Completed' : 'In Progress'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results message */}
        {showSuggestions && suggestions.length === 0 && searchTerm.length >= 2 && !loading && (
          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-lg">
            <div className="px-4 py-3 text-center text-gray-500">
              No users found with email containing "{searchTerm}"
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      {/* Selected user info */}
      {selectedUser && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Selected User</h3>
              <p className="text-blue-700">{selectedUser.email}</p>
              <div className="flex items-center space-x-4 text-sm text-blue-600 mt-1">
                <span>Case ID: {selectedUser.case_id || selectedUser.selected_case_id || 'N/A'}</span>
                <span>Stage: {selectedUser.current_stage}/10</span>
                <span>Progress: {selectedUser.progress_percentage || 0}%</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-blue-600">
              <Calendar className="h-4 w-4" />
              <span>Last updated: {new Date(selectedUser.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default UserSearch;
