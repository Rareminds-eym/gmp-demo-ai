import React, { useState, useEffect } from 'react';
import { fetchStageData, fetchFilteredStageData, fetchStageStatistics } from '../lib/databaseService';
import { 
  Search, 
  Users, 
  Filter, 
  RefreshCw, 
  Download,
  ChevronDown,
  ChevronRight,
  BarChart3,
  User,
  Calendar,
  CheckCircle,
  Clock,
  Lightbulb,
  Target,
  Zap,
  Brain,
  Rocket,
  MessageSquare
} from 'lucide-react';

const StageDataViewer = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    email: '',
    case_id: '',
    is_completed: '',
    current_stage: '',
    limit: 50
  });
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [showStatistics, setShowStatistics] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
    loadStatistics();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchFilteredStageData(filters);
      if (result.error) {
        setError(result.error);
      } else {
        setData(result.data);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const result = await fetchStageStatistics();
      if (result.error) {
        console.error('Failed to load statistics:', result.error);
      } else {
        setStatistics(result.data);
      }
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = () => {
    loadData();
  };

  const resetFilters = () => {
    setFilters({
      email: '',
      case_id: '',
      is_completed: '',
      current_stage: '',
      limit: 50
    });
  };

  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const exportData = () => {
    if (data.length === 0) return;
    
    const csvContent = [
      // Headers
      [
        'ID', 'Email', 'Case ID', 'Current Stage', 'Progress %', 'Completed',
        'Created At', 'Updated At', 'Idea Statement', 'Stage 2: Problem',
        'Stage 3: Technology', 'Stage 4: Collaboration', 'Stage 5: Creativity',
        'Stage 6: Speed & Scale', 'Stage 7: Impact', 'Stage 8: Final Problem',
        'Stage 10: Reflection'
      ].join(','),
      // Data rows
      ...data.map(row => [
        row.id,
        `"${row.email}"`,
        row.case_id || row.selected_case_id || '',
        row.current_stage,
        row.progress_percentage || 0,
        row.is_completed ? 'Yes' : 'No',
        new Date(row.created_at).toLocaleDateString(),
        new Date(row.updated_at).toLocaleDateString(),
        `"${(row.idea_statement || '').replace(/"/g, '""')}"`,
        `"${(row.stage2_problem || '').replace(/"/g, '""')}"`,
        `"${(row.stage3_technology || '').replace(/"/g, '""')}"`,
        `"${(row.stage4_collaboration || '').replace(/"/g, '""')}"`,
        `"${(row.stage5_creativity || '').replace(/"/g, '""')}"`,
        `"${(row.stage6_speed_scale || '').replace(/"/g, '""')}"`,
        `"${(row.stage7_impact || '').replace(/"/g, '""')}"`,
        `"${(row.stage8_final_problem || '').replace(/"/g, '""')}"`,
        `"${(row.stage10_reflection || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `stage_data_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStageIcon = (stageNum) => {
    const iconMap = {
      1: Lightbulb,
      2: Target,
      3: Zap,
      4: Users,
      5: Brain,
      6: Rocket,
      7: Target,
      8: MessageSquare,
      10: Brain
    };
    const Icon = iconMap[stageNum] || MessageSquare;
    return <Icon className="h-4 w-4" />;
  };

  const renderStageContent = (user) => {
    const stages = [
      { key: 'idea_statement', label: 'Stage 1: Idea Statement', stage: 1 },
      { key: 'stage2_problem', label: 'Stage 2: Problem Analysis', stage: 2 },
      { key: 'stage3_technology', label: 'Stage 3: Technology', stage: 3 },
      { key: 'stage4_collaboration', label: 'Stage 4: Collaboration', stage: 4 },
      { key: 'stage5_creativity', label: 'Stage 5: Creativity', stage: 5 },
      { key: 'stage6_speed_scale', label: 'Stage 6: Speed & Scale', stage: 6 },
      { key: 'stage7_impact', label: 'Stage 7: Impact', stage: 7 },
      { key: 'stage8_final_problem', label: 'Stage 8: Final Problem', stage: 8 },
      { key: 'stage10_reflection', label: 'Stage 10: Reflection', stage: 10 }
    ];

    return (
      <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-lg">
        {stages.map(({ key, label, stage }) => (
          <div key={key} className="border-l-4 border-blue-200 pl-4">
            <div className="flex items-center space-x-2 mb-2">
              {getStageIcon(stage)}
              <h4 className="text-sm font-medium text-gray-900">{label}</h4>
            </div>
            <div className="text-sm text-gray-700 bg-white p-3 rounded border">
              {user[key] ? (
                <p className="whitespace-pre-wrap">{user[key]}</p>
              ) : (
                <span className="text-gray-400 italic">No response provided</span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span>Stage Data Viewer</span>
            </h1>
            <p className="text-gray-600 mt-2">View and analyze all stage responses from the database</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowStatistics(!showStatistics)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Statistics</span>
            </button>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </button>
            
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={exportData}
              disabled={data.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Statistics Panel */}
        {showStatistics && statistics && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Database Statistics</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Overview</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Users:</span>
                    <span className="font-medium">{statistics.total_users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-medium text-green-600">{statistics.completed_users}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completion Rate:</span>
                    <span className="font-medium">
                      {statistics.total_users > 0 
                        ? ((statistics.completed_users / statistics.total_users) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Stage Progress</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(statistics.stage_completion).map(([stage, count]) => (
                    <div key={stage} className="flex justify-between">
                      <span className="text-gray-600">Stage {stage}:</span>
                      <span className="font-medium">{count} users</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Response Rates</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(statistics.stage_response_rates).map(([stage, data]) => (
                    <div key={stage} className="flex justify-between">
                      <span className="text-gray-600">{stage.replace('stage', 'Stage ').replace('_', ' ')}:</span>
                      <span className="font-medium">{data.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="text"
                  value={filters.email}
                  onChange={(e) => handleFilterChange('email', e.target.value)}
                  placeholder="Search by email..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Case ID</label>
                <input
                  type="number"
                  value={filters.case_id}
                  onChange={(e) => handleFilterChange('case_id', e.target.value)}
                  placeholder="Case ID..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Completion Status</label>
                <select
                  value={filters.is_completed}
                  onChange={(e) => handleFilterChange('is_completed', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All</option>
                  <option value="true">Completed</option>
                  <option value="false">In Progress</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Stage</label>
                <select
                  value={filters.current_stage}
                  onChange={(e) => handleFilterChange('current_stage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Stages</option>
                  {[1,2,3,4,5,6,7,8,9,10].map(stage => (
                    <option key={stage} value={stage}>Stage {stage}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Limit</label>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={25}>25 results</option>
                  <option value={50}>50 results</option>
                  <option value={100}>100 results</option>
                  <option value={200}>200 results</option>
                  <option value="">All results</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={applyFilters}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Search className="h-4 w-4" />
                <span>Apply Filters</span>
              </button>
              
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Stage Data ({data.length} records)</span>
            </h2>
            {loading && (
              <div className="flex items-center space-x-2 text-gray-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {loading ? 'Loading data...' : 'No data found'}
                  </td>
                </tr>
              ) : (
                data.map((user) => (
                  <React.Fragment key={user.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <User className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.email}</p>
                            <p className="text-sm text-gray-500">ID: {user.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          Case ID: {user.case_id || user.selected_case_id || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          Stage {user.current_stage}/10
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.progress_percentage || 0}% complete
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.is_completed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.is_completed ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          <span>{user.is_completed ? 'Completed' : 'In Progress'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(user.updated_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleRowExpansion(user.id)}
                          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {expandedRows.has(user.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="text-sm">
                            {expandedRows.has(user.id) ? 'Hide' : 'Show'} Details
                          </span>
                        </button>
                      </td>
                    </tr>
                    
                    {expandedRows.has(user.id) && (
                      <tr>
                        <td colSpan={6} className="px-6 py-0">
                          {renderStageContent(user)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StageDataViewer;
