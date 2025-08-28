import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Search, User, Calendar, AlertCircle } from 'lucide-react';

const UserSearch = ({ onUserSelect, selectedUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);

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
        .limit(10);

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

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
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
  );
};

export default UserSearch;
