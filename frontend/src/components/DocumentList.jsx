import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { 
  File, 
  FileText, 
  Trash2, 
  Eye, 
  Download, 
  Search,
  Filter,
  Calendar,
  CheckCircle,
  Circle,
  RefreshCw,
  AlertCircle,
  Grid3X3,
  List,
  Upload,
  Star,
  Clock,
  FileCheck,
  Layers,
  Activity,
  TrendingUp,
  Archive,
  MoreVertical,
  Tag,
  Folder,
  FolderOpen,
  Info,
  MessageSquare,
  Zap,
  Database,
  FileCode,
  ChevronRight,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/store';
import { utils } from '../services/api';
// import DatePicker from 'react-datepicker';
// import 'react-datepicker/dist/react-datepicker.css';

// Add this CSS to your global styles or at the top of the component
const datePickerStyles = `
  .react-datepicker-popper {
    z-index: 9999 !important;
  }
  .react-datepicker {
    background-color: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #e2e8f0;
    font-family: 'Inter', sans-serif;
  }
  .react-datepicker__header {
    background-color: #0f172a;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }
  .react-datepicker__current-month,
  .react-datepicker__day-name {
    color: #e2e8f0;
  }
  .react-datepicker__day {
    color: #e2e8f0;
  }
  .react-datepicker__day:hover {
    background-color: rgba(102, 126, 234, 0.2);
  }
  .react-datepicker__day--selected {
    background-color: #667eea;
    color: white;
  }
  .react-datepicker__day--disabled {
    color: #64748b;
  }
`;



const DocumentList = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    documents, 
    selectedDocuments, 
    setSelectedDocuments,
    deleteDocument,
    refreshDocuments,
    uploadDocuments
  } = useAppStore();

  // Calculate stats
  const stats = useMemo(() => {
    const totalSize = documents.reduce((sum, doc) => {
      const size = doc.size || doc.file_size || doc.char_count || 0;
      return sum + size;
    }, 0);
    
    const processingCount = documents.filter(doc => 
      doc.status === 'processing'
    ).length;
    
    const readyCount = documents.filter(doc => 
      doc.status === 'ready' || 
      doc.status === 'completed' || 
      doc.status === 'processed' ||
      (!doc.status || doc.status === '')
    ).length;
    
    return { totalSize, processingCount, readyCount };
  }, [documents]);

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon with color
  const getFileIcon = (doc) => {
    if (!doc.filename || typeof doc.filename !== 'string') {
      return { icon: File, color: 'from-gray-400 to-gray-500' };
    }

    const extension = doc.filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return { icon: FileText, color: 'from-red-400 to-red-500' };
      case 'doc':
      case 'docx':
        return { icon: FileText, color: 'from-blue-400 to-blue-500' };
      case 'txt':
        return { icon: File, color: 'from-gray-400 to-gray-500' };
      case 'md':
        return { icon: FileCode, color: 'from-purple-400 to-purple-500' };
      case 'html':
        return { icon: FileCode, color: 'from-orange-400 to-orange-500' };
      default:
        return { icon: File, color: 'from-gray-400 to-gray-500' };
    }
  };

  // Filter and sort documents
  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents.filter((doc) => {
      const matchesSearch = !searchTerm || 
                          doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || 
                        doc.file_type === filterType ||
                        doc.type === filterType ||
                        (filterType === 'selected' && selectedDocuments.includes(doc.id));
      
      let matchesDateRange = true;
      if (dateRange.start && dateRange.end) {
        const docDate = new Date(doc.created_at || doc.uploadedAt);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        matchesDateRange = docDate >= startDate && docDate <= endDate;
      }
      
      return matchesSearch && matchesType && matchesDateRange;
    });

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.filename.localeCompare(b.filename);
        case 'size':
          return (b.size || b.char_count || 0) - (a.size || a.char_count || 0);
        case 'type':
          return (a.type || a.file_type || '').localeCompare(b.type || b.file_type || '');
        case 'chunks':
          return (b.chunks_created || 0) - (a.chunks_created || 0);
        case 'date':
        default:
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
    });

    return filtered;
  }, [documents, searchTerm, sortBy, filterType, selectedDocuments, dateRange]);

  // Handlers
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshDocuments();
      toast.success('Documents refreshed!', { icon: '✨' });
    } catch (error) {
      toast.error('Failed to refresh documents');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePreview = async (doc) => {
    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/documents/${doc.id}/preview`;
      window.open(url, '_blank');
      toast.success('Opening document preview');
    } catch (error) {
      toast.error('Failed to preview document');
    }
  };
  
  const handleDownload = async (doc) => {
    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/documents/${doc.id}/download`;
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download document');
    }
  };
  
  // Fix the Ask Questions button to properly navigate
  const handleAskQuestions = () => {
    if (selectedDocuments.length === 0) {
      toast.error('Please select at least one document');
      return;
    }
    
    // Navigate to chat tab
    useAppStore.getState().setActiveTab('chat');
    
    toast.success(`${selectedDocuments.length} document${selectedDocuments.length > 1 ? 's' : ''} selected for questions`);
  };

  const handleDelete = async (doc) => {
    try {
      await deleteDocument(doc.id);
      toast.success(`Deleted "${doc.filename}"`);
    } catch (error) {
      toast.error(`Failed to delete "${doc.filename}"`);
    }
  };

  const toggleDocumentSelection = (docId) => {
    const newSelection = selectedDocuments.includes(docId)
      ? selectedDocuments.filter(id => id !== docId)
      : [...selectedDocuments, docId];
    
    setSelectedDocuments(newSelection);
  };

  const selectAllDocuments = () => {
    const allIds = filteredAndSortedDocuments.map(doc => doc.id);
    const isAllSelected = selectedDocuments.length === allIds.length;
    setSelectedDocuments(isAllSelected ? [] : allIds);
  };

  // Empty state
  if (documents.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <div className="text-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="mb-8"
          >
            <Folder className="w-24 h-24 text-primary-400/50 mx-auto" />
          </motion.div>
          
          <h3 className="text-2xl font-bold gradient-text mb-4">
            No Documents Yet
          </h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            Upload your first document to start building your knowledge base
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => useAppStore.getState().setActiveTab('upload')}
            className="px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-primary-500/25 transition-all"
          >
            <Upload className="w-5 h-5 inline mr-2" />
            Upload Documents
          </motion.button>
        </div>
      </motion.div>
    );
  }

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = datePickerStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6"
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h2 className="text-3xl font-bold gradient-text mb-2">
              Document Library
            </h2>
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span>{documents.length} documents</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>{documents.reduce((sum, doc) => sum + (doc.chunks_created || 0), 0)} chunks</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span>{formatFileSize(stats.totalSize)} processed</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`
                p-3 rounded-xl transition-all
                ${showAdvancedFilters 
                  ? 'bg-primary-500/20 text-primary-400' 
                  : 'bg-white/10 text-gray-400 hover:text-white'
                }
              `}
            >
              <Filter className="w-5 h-5" />
            </button>
            
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-3 bg-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/20 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-6 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="size">Sort by Size</option>
              <option value="type">Sort by Type</option>
              <option value="chunks">Sort by Chunks</option>
            </select>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value=".pdf">PDF Files</option>
              <option value=".docx">Word Files</option>
              <option value=".txt">Text Files</option>
              <option value=".html">HTML Files</option>
              <option value=".md">Markdown Files</option>
              <option value="selected">Selected Only</option>
            </select>

            {/* Select All */}
            {filteredAndSortedDocuments.length > 0 && (
              <button
                onClick={selectAllDocuments}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                {selectedDocuments.length === filteredAndSortedDocuments.length ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
                Select All
              </button>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-all ${
                viewMode === 'grid' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-all ${
                viewMode === 'list' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">Advanced Filters</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Date Range
                </label>
                <div className="flex items-center gap-3">
                <DatePicker
                    selected={startDate}
                    onChange={date => {
                      setStartDate(date);
                      setDateRange(prev => ({ ...prev, start: date ? date.toISOString().slice(0, 10) : '' }));
                    }}
                    popperPlacement="top-start"
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    placeholderText="From"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                  />
                  <span className="text-gray-400">to</span>
                  <DatePicker
                    selected={endDate}
                    onChange={date => {
                      setEndDate(date);
                      setDateRange(prev => ({ ...prev, end: date ? date.toISOString().slice(0, 10) : '' }));
                    }}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    placeholderText="To"
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSortBy('date');
                    setFilterType('all');
                    setStartDate(null);
                    setEndDate(null);
                    setDateRange({ start: '', end: '' });
                  }}
                  className="px-6 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Grid/List */}
      <motion.div
        layout
        className={`grid gap-4 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}
      >
        <AnimatePresence>
          {filteredAndSortedDocuments.map((doc, index) => {
            const FileIcon = getFileIcon(doc);
            const isSelected = selectedDocuments.includes(doc.id);
            
            return (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => toggleDocumentSelection(doc.id)}
                className={`
                  glass-card rounded-xl p-6 cursor-pointer transition-all
                  ${isSelected 
                    ? 'ring-2 ring-primary-500 bg-primary-500/10' 
                    : 'hover:bg-white/10'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`
                    w-12 h-12 rounded-lg bg-gradient-to-r ${FileIcon.color}
                    flex items-center justify-center text-white
                  `}>
                    <FileIcon.icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <CheckCircle className="w-5 h-5 text-primary-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-white mb-2 truncate" title={doc.filename}>
                  {doc.filename}
                </h3>

                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                    <span>{formatFileSize(doc.char_count || 0)}</span>
                  </div>
                  
                  {doc.chunks_created && (
                    <div className="flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      {doc.chunks_created} chunks
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(doc);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Preview document"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(doc);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Download document"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete "${doc.filename}"?`)) {
                        handleDelete(doc);
                      }
                    }}
                    className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Footer Stats */}
      {filteredAndSortedDocuments.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-6 text-gray-400">
              <span>
                Showing {filteredAndSortedDocuments.length} of {documents.length} documents
              </span>
              {selectedDocuments.length > 0 && (
                <span className="text-primary-400">
                  {selectedDocuments.length} selected for queries
                </span>
              )}
            </div>
            
            <button
              onClick={handleAskQuestions}
              disabled={selectedDocuments.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              Ask Questions ({selectedDocuments.length})
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DocumentList;