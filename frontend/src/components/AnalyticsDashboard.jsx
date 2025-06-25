import React, { useEffect, useState } from 'react';
import { useAnalyticsStore } from '../store/store';
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle,
  Users,
  Database,
  RefreshCw
} from 'lucide-react';

const AnalyticsDashboard = () => {
  const { stats, popularQuestions, isLoading, loadStats, loadPopularQuestions } = useAnalyticsStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
    loadPopularQuestions();
  }, [loadStats, loadPopularQuestions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadStats(), loadPopularQuestions()]);
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor your document Q&A system performance</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Queries"
          value={stats?.total_queries || 0}
          icon={MessageSquare}
          color="blue"
          trend="+12% from last week"
        />
        <StatCard
          title="Total Documents"
          value={stats?.total_documents || 0}
          icon={Database}
          color="green"
          trend="+5% from last week"
        />
        <StatCard
          title="Avg Response Time"
          value={`${(stats?.avg_response_time || 0).toFixed(2)}s`}
          icon={Clock}
          color="orange"
          trend="-8% from last week"
        />
        <StatCard
          title="Success Rate"
          value={stats ? `${((stats.successful_queries / stats.total_queries) * 100).toFixed(1)}%` : '0%'}
          icon={CheckCircle}
          color="emerald"
          trend="+2% from last week"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Success vs Failure Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Query Success Rate
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-gray-700">Successful Queries</span>
              </div>
              <span className="font-semibold text-green-600">
                {stats?.successful_queries || 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: stats?.total_queries 
                    ? `${(stats.successful_queries / stats.total_queries) * 100}%` 
                    : '0%' 
                }}
              ></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-gray-700">Failed Queries</span>
              </div>
              <span className="font-semibold text-red-600">
                {stats?.failed_queries || 0}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: stats?.total_queries 
                    ? `${(stats.failed_queries / stats.total_queries) * 100}%` 
                    : '0%' 
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* LLM Usage */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            LLM Usage
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="text-gray-700">Primary LLM</span>
              <span className="font-semibold text-purple-600">
                {stats?.top_llm_used || 'N/A'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {stats?.total_queries > 0 
                ? `Processing ${stats.total_queries} total queries` 
                : 'No queries processed yet'}
            </div>
          </div>
        </div>
      </div>

      {/* Popular Questions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Popular Questions
          </h3>
        </div>
        <div className="overflow-x-auto">
          {popularQuestions && popularQuestions.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Asked
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {popularQuestions.map((question, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md truncate" title={question.question}>
                        {question.question}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {question.frequency}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${question.success_rate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-700">
                          {question.success_rate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {question.avg_response_time.toFixed(2)}s
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(question.last_asked).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No popular questions yet</p>
              <p className="text-sm text-gray-400 mt-1">Questions will appear here once users start asking</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-sm text-gray-600">
          Last updated: {stats?.last_updated ? new Date(stats.last_updated).toLocaleString() : 'Never'}
        </p>
      </div>
    </div>
  );
};

// StatCard Component
const StatCard = ({ title, value, icon: Icon, color, trend }) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    orange: 'text-orange-600 bg-orange-100',
    emerald: 'text-emerald-600 bg-emerald-100',
    purple: 'text-purple-600 bg-purple-100',
    indigo: 'text-indigo-600 bg-indigo-100'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;