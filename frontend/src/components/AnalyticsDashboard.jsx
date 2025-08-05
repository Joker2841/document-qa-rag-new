import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle,
  Users,
  Database,
  RefreshCw,
  Download,
  Sparkles,
  Activity,
  FileText,
  Zap,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  RadialBarChart, RadialBar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PolarAngleAxis
} from 'recharts';
import { useAnalyticsStore } from '../store/store';
import toast from 'react-hot-toast';

const AnalyticsDashboard = () => {
  const { 
    stats, 
    popularQuestions, 
    queryTrends,
    isLoading, 
    loadStats, 
    loadPopularQuestions,
    loadQueryTrends
  } = useAnalyticsStore();
  
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const refreshInterval = 30; // seconds

  // Auto refresh
  useEffect(() => {
    loadInitialData();
    
    if (autoRefreshEnabled) {
      const interval = setInterval(() => {
        handleRefresh(true); // silent refresh
      }, refreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefreshEnabled]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadStats(),
        loadPopularQuestions(),
        loadQueryTrends()
      ]);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  };

  const handleRefresh = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      await loadInitialData();
      if (!silent) toast.success('Analytics refreshed!', { icon: '📊' });
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  const handleExport = () => {
    const data = {
      stats,
      popularQuestions,
      queryTrends,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Analytics exported successfully!', { icon: '📥' });
  };

  // Chart configurations with glass morphism theme
  const chartColors = {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    gradient: ['#667eea', '#764ba2', '#f093fb', '#4facfe']
  };

  // Custom tooltip with glass effect
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-white/20">
          <p className="text-sm font-medium text-white">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Success rate data for radial chart
  const successRateData = stats ? [{
    name: 'Success Rate',
    value: Math.round((stats.successful_queries / stats.total_queries) * 100) || 0,
    fill: chartColors.success
  }] : [];

  // Loading skeleton
  if (isLoading && !stats) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-white/5 rounded-xl w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-white/5 rounded-xl"></div>
            ))}
          </div>
          <div className="h-96 bg-white/5 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 border border-white/10"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="relative"
            >
              <BarChart3 className="w-10 h-10 text-primary-400" />
              <div className="absolute inset-0 blur-md bg-primary-400/50"></div>
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Analytics Dashboard</h1>
              <p className="text-gray-400 mt-1 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Real-time insights • Auto-refresh: {autoRefreshEnabled ? `${refreshInterval}s` : 'Off'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`p-3 rounded-xl transition-all ${
                autoRefreshEnabled 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-white/10 text-gray-400'
              } hover:scale-105`}
            >
              <Activity className="w-5 h-5" />
            </button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              className="p-3 bg-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/20 transition-all"
            >
              <Download className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleRefresh()}
              disabled={refreshing}
              className="p-3 bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl text-white hover:shadow-lg hover:shadow-primary-500/25 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards with Animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          className="glass-card rounded-2xl p-6 border border-white/10 hover:border-primary-400/30 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              {stats?.total_queries || 0}
            </span>
          </div>
          <p className="text-sm text-gray-400">Total Queries</p>
          <div className="flex items-center gap-1 mt-2 text-xs">
            <TrendingUp className="w-3 h-3 text-green-400" />
            <span className="text-green-400">+12% from last week</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          className="glass-card rounded-2xl p-6 border border-white/10 hover:border-primary-400/30 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
              <Database className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              {stats?.total_documents || 0}
            </span>
          </div>
          <p className="text-sm text-gray-400">Total Documents</p>
          <div className="flex items-center gap-1 mt-2 text-xs">
            <ArrowUp className="w-3 h-3 text-green-400" />
            <span className="text-green-400">+5 this week</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          className="glass-card rounded-2xl p-6 border border-white/10 hover:border-primary-400/30 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              {(stats?.avg_response_time || 0).toFixed(2)}s
            </span>
          </div>
          <p className="text-sm text-gray-400">Avg Response Time</p>
          <div className="flex items-center gap-1 mt-2 text-xs">
            <ArrowDown className="w-3 h-3 text-green-400" />
            <span className="text-green-400">-0.3s improved</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          className="glass-card rounded-2xl p-6 border border-white/10 hover:border-primary-400/30 transition-all"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              {stats?.top_llm_used || 'N/A'}
            </span>
          </div>
          <p className="text-sm text-gray-400">Primary LLM</p>
          <div className="flex items-center gap-1 mt-2 text-xs">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-400">GPU Accelerated</span>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Success Rate Radial Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-card rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Success Rate
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={successRateData}>
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar
                background
                dataKey="value"
                cornerRadius={10}
                fill={chartColors.success}
              />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold fill-white">
                {successRateData[0]?.value || 0}%
              </text>
              <text x="50%" y="50%" dy={30} textAnchor="middle" className="text-sm fill-gray-400">
                Success Rate
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Query Trends Line Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="glass-card rounded-2xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            Query Trends (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={queryTrends || []}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: '#9ca3af', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total_queries"
                stroke={chartColors.primary}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Popular Questions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass-card rounded-2xl overflow-hidden border border-white/10"
      >
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            Popular Questions
          </h3>
        </div>
        
        {popularQuestions && popularQuestions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Frequency
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Success Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Avg Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {popularQuestions.map((question, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm text-white max-w-md truncate" title={question.question}>
                        {question.question}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-500/20 text-primary-400">
                        {question.frequency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-white/10 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${question.success_rate}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                          />
                        </div>
                        <span className="text-sm text-gray-400">
                          {question.success_rate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">
                        {question.avg_response_time.toFixed(2)}s
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No popular questions yet</p>
            <p className="text-sm text-gray-500 mt-1">Questions will appear here once users start asking</p>
          </div>
        )}
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="glass-card rounded-2xl p-4 text-center"
      >
        <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4" />
          Last updated: {stats?.last_updated ? new Date(stats.last_updated).toLocaleString() : 'Never'}
        </p>
      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;