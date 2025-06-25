import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  ExternalLink, 
  Copy,
  Search,
  Bookmark,
  Star,
  Quote,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  Download,
  Share2,
  Clock,
  FileImage,
  FileCode,
  Layers,
  Tag,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Zap,
  Target
} from 'lucide-react';

const SourceDisplay = ({ sources = [], searchQuery = '', className = '' }) => {
  const [expandedSources, setExpandedSources] = useState(new Set([0]));
  const [selectedSource, setSelectedSource] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterType, setFilterType] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('comfortable'); // comfortable, compact, detailed
  const [searchHighlight, setSearchHighlight] = useState('');
  const [notification, setNotification] = useState(null);
  const searchInputRef = useRef(null);

  // Enhanced notification system
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const copyToClipboard = async (text, label = 'content') => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification(`${label} copied to clipboard!`);
    } catch (err) {
      showNotification(`Failed to copy ${label}`, 'error');
    }
  };

  const toggleSource = (index) => {
    const newExpanded = new Set(expandedSources);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSources(newExpanded);
  };

  const toggleFavorite = (index) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(index)) {
      newFavorites.delete(index);
      showNotification('Removed from favorites');
    } else {
      newFavorites.add(index);
      showNotification('Added to favorites');
    }
    setFavorites(newFavorites);
  };

  // Enhanced text highlighting with better regex
  const highlightText = (text, query) => {
    if (!query) return text;
    
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-gradient-to-r from-yellow-200 to-yellow-300 px-1 py-0.5 rounded-sm font-medium shadow-sm">
          {part}
        </mark>
      ) : part
    );
  };

  // Enhanced relevance scoring with visual indicators
  const getRelevanceInfo = (score) => {
    if (score >= 0.9) return { 
      color: 'text-emerald-700 bg-emerald-100 border-emerald-200', 
      label: 'Excellent Match', 
      icon: <Target className="w-3 h-3" /> 
    };
    if (score >= 0.8) return { 
      color: 'text-green-700 bg-green-100 border-green-200', 
      label: 'Strong Match', 
      icon: <CheckCircle2 className="w-3 h-3" /> 
    };
    if (score >= 0.6) return { 
      color: 'text-amber-700 bg-amber-100 border-amber-200', 
      label: 'Good Match', 
      icon: <Zap className="w-3 h-3" /> 
    };
    if (score >= 0.4) return { 
      color: 'text-orange-700 bg-orange-100 border-orange-200', 
      label: 'Fair Match', 
      icon: <AlertCircle className="w-3 h-3" /> 
    };
    return { 
      color: 'text-red-700 bg-red-100 border-red-200', 
      label: 'Weak Match', 
      icon: <AlertCircle className="w-3 h-3" /> 
    };
  };

  // Enhanced file type detection with more types
  const getFileIcon = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    const iconMap = {
      pdf: { icon: <FileText className="w-4 h-4" />, color: 'text-red-500', bg: 'bg-red-50' },
      docx: { icon: <FileText className="w-4 h-4" />, color: 'text-blue-500', bg: 'bg-blue-50' },
      doc: { icon: <FileText className="w-4 h-4" />, color: 'text-blue-500', bg: 'bg-blue-50' },
      txt: { icon: <FileText className="w-4 h-4" />, color: 'text-gray-500', bg: 'bg-gray-50' },
      html: { icon: <FileCode className="w-4 h-4" />, color: 'text-orange-500', bg: 'bg-orange-50' },
      md: { icon: <FileText className="w-4 h-4" />, color: 'text-purple-500', bg: 'bg-purple-50' },
      jpg: { icon: <FileImage className="w-4 h-4" />, color: 'text-green-500', bg: 'bg-green-50' },
      jpeg: { icon: <FileImage className="w-4 h-4" />, color: 'text-green-500', bg: 'bg-green-50' },
      png: { icon: <FileImage className="w-4 h-4" />, color: 'text-green-500', bg: 'bg-green-50' },
      default: { icon: <FileText className="w-4 h-4" />, color: 'text-gray-400', bg: 'bg-gray-50' }
    };
    return iconMap[extension] || iconMap.default;
  };

  // Enhanced sorting and filtering
  const sortedAndFilteredSources = useMemo(() => {
    let filtered = sources;

    // Apply filters
    if (filterType === 'favorites') {
      filtered = sources.filter((_, index) => favorites.has(index));
    } else if (filterType === 'high-relevance') {
      filtered = sources.filter(source => source.similarity_score >= 0.7);
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'relevance':
          aValue = a.similarity_score || 0;
          bValue = b.similarity_score || 0;
          break;
        case 'name':
          aValue = a.document_name || '';
          bValue = b.document_name || '';
          break;
        case 'date':
          aValue = new Date(a.metadata?.created_at || 0);
          bValue = new Date(b.metadata?.created_at || 0);
          break;
        case 'size':
          aValue = a.metadata?.size || 0;
          bValue = b.metadata?.size || 0;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [sources, favorites, sortBy, sortOrder, filterType]);

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!sources || sources.length === 0) {
    return (
      <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 text-center ${className}`}>
        <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Sources Found</h3>
        <p className="text-gray-500">Try adjusting your search query or filters</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-50 border-green-400 text-green-800' 
            : 'bg-red-50 border-red-400 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Enhanced Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <Bookmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Source Library
              </h3>
              <p className="text-sm text-gray-600">
                {sortedAndFilteredSources.length} of {sources.length} sources
                {favorites.size > 0 && (
                  <span className="ml-2 text-yellow-600">
                    • {favorites.size} favorited
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search in sources..."
                value={searchHighlight}
                onChange={(e) => setSearchHighlight(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* View Mode */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {['compact', 'comfortable', 'detailed'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === mode
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filters</span>
            </button>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setExpandedSources(new Set(sources.map((_, i) => i)))}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Expand All
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => setExpandedSources(new Set())}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Sources</option>
                  <option value="favorites">Favorites Only</option>
                  <option value="high-relevance">High Relevance (70%+)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="relevance">Relevance Score</option>
                  <option value="name">Document Name</option>
                  <option value="date">Date Created</option>
                  <option value="size">File Size</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {sortOrder === 'asc' ? (
                    <SortAsc className="w-4 h-4" />
                  ) : (
                    <SortDesc className="w-4 h-4" />
                  )}
                  <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sources Grid */}
      <div className="space-y-4">
        {sortedAndFilteredSources.map((source, index) => {
          const fileIcon = getFileIcon(source.document_name);
          const relevanceInfo = getRelevanceInfo(source.similarity_score || 0);
          const isExpanded = expandedSources.has(index);
          const isFavorite = favorites.has(index);
          
          return (
            <div
              key={index}
              className={`bg-white border-2 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg ${
                isExpanded ? 'border-blue-200 shadow-md' : 'border-gray-200'
              }`}
            >
              {/* Source Header */}
              <div
                className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                  isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => toggleSource(index)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* File Icon */}
                  <div className={`p-2 rounded-lg ${fileIcon.bg}`}>
                    <div className={fileIcon.color}>
                      {fileIcon.icon}
                    </div>
                  </div>
                  
                  {/* Source Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 truncate text-lg">
                        {source.document_name || `Source ${index + 1}`}
                      </h4>
                      {isFavorite && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Relevance Score */}
                      {source.similarity_score && (
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${relevanceInfo.color}`}>
                          {relevanceInfo.icon}
                          <span>{Math.round(source.similarity_score * 100)}%</span>
                          <span className="hidden sm:inline">• {relevanceInfo.label}</span>
                        </div>
                      )}
                      
                      {/* Page/Chunk Info */}
                      {source.page_number && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          Page {source.page_number}
                        </span>
                      )}
                      
                      {source.chunk_index !== undefined && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          Chunk {source.chunk_index + 1}
                        </span>
                      )}
                      
                      {/* File Size */}
                      {source.metadata?.size && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {formatFileSize(source.metadata.size)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Header Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(index);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      isFavorite 
                        ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100' 
                        : 'text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'
                    }`}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(source.content || source.text || '', 'Source content');
                    }}
                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Copy content"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  
                  <div className="p-2">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50">
                  <div className="p-6 space-y-6">
                    {/* Content Preview */}
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Quote className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-semibold text-gray-700">Content Preview</span>
                      </div>
                      <div className="text-sm text-gray-700 leading-relaxed max-h-40 overflow-y-auto">
                        {highlightText(
                          source.content || source.text || 'No content available', 
                          searchHighlight || searchQuery
                        )}
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { label: 'Document ID', value: source.document_id, icon: <Tag className="w-4 h-4" /> },
                        { label: 'Created', value: source.metadata?.created_at ? formatDate(source.metadata.created_at) : null, icon: <Clock className="w-4 h-4" /> },
                        { label: 'File Size', value: source.metadata?.size ? formatFileSize(source.metadata.size) : null, icon: <Layers className="w-4 h-4" /> },
                        { label: 'Total Chunks', value: source.metadata?.total_chunks, icon: <Layers className="w-4 h-4" /> },
                      ].filter(item => item.value).map((item, idx) => (
                        <div key={idx} className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-gray-400">{item.icon}</div>
                            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                              {item.label}
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 font-medium">
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-200">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setSelectedSource(source)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          View Full Document
                        </button>
                        
                        <button
                          onClick={() => copyToClipboard(source.document_name || 'Unknown Document', 'Document name')}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Last updated: {formatDate(source.metadata?.created_at || new Date())}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Enhanced Modal */}
      {selectedSource && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    {getFileIcon(selectedSource.document_name).icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {selectedSource.document_name}
                    </h3>
                    <p className="text-blue-100 text-sm">
                      {selectedSource.metadata?.size && `${formatFileSize(selectedSource.metadata.size)} • `}
                      {selectedSource.similarity_score && `${Math.round(selectedSource.similarity_score * 100)}% match`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSource(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <div className="w-6 h-6 flex items-center justify-center text-xl font-bold">×</div>
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="prose prose-sm max-w-none">
                <div className="bg-gray-50 rounded-lg p-4 text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {highlightText(
                    selectedSource.content || selectedSource.text || 'No content available', 
                    searchHighlight || searchQuery
                  )}
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-gray-50 p-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Document ID: {selectedSource.document_id || 'N/A'}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => copyToClipboard(selectedSource.content || selectedSource.text || '', 'Full content')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Copy All
                  </button>
                  <button
                    onClick={() => setSelectedSource(null)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SourceDisplay;