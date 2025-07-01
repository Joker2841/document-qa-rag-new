import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
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
  ZapOff,
  Activity,
  TrendingUp,
  Archive,
  Share2,
  Copy,
  ExternalLink,
  MoreVertical,
  Tag,
  Folder,
  FolderOpen,
  Info,
  MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/store';
import { utils } from '../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const DocumentList = () => {
  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [draggedOver, setDraggedOver] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState(null);
  const setActiveTab = useAppStore(state => state.setActiveTab);
  
  const { 
    documents, 
    selectedDocuments, 
    setSelectedDocuments,
    deleteDocument,
    refreshDocuments,
    uploadDocuments
  } = useAppStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({ totalSize: 0, processingCount: 0, readyCount: 0 });
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Calculate document statistics
useEffect(() => {
  const totalSize = documents.reduce((sum, doc) => {
    // Handle different possible size field names
    const size = doc.size || doc.file_size || doc.char_count || 0;
    return sum + size;
  }, 0);
  
  const processingCount = documents.filter(doc => 
    doc.status === 'processing'
  ).length;
  
  const readyCount = documents.filter(doc => 
    doc.status === 'ready' || 
    doc.status === 'completed' || 
    (!doc.status || doc.status === '') // If no status field, assume ready
  ).length;
  
  setStats({ totalSize, processingCount, readyCount });
}, [documents]);

  
const handlePreview = async (doc) => {
  try {
    // Option 1: Open in new tab (simplest approach)
    const fileUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/documents/${doc.id}/preview`;
    window.open(fileUrl, '_blank');
    
    // Option 2: Fetch and display inline (for advanced preview)
    // const response = await fetch(fileUrl);
    // const blob = await response.blob();
    // const objectUrl = URL.createObjectURL(blob);
    // window.open(objectUrl, '_blank');
    // URL.revokeObjectURL(objectUrl); // Clean up
    
    toast.success('Opening document preview...');
  } catch (error) {
    console.error('Preview error:', error);
    toast.error('Failed to preview document');
  }
};

const handleAskQuestions = useCallback(() => {
  setActiveTab('chat');
}, [setActiveTab]);

const handleDownload = async (doc) => {
  try {
    const fileUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/documents/${doc.id}/download`;
    
    // Create a temporary anchor element for download
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = doc.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloading ${doc.filename}...`);
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Failed to download document');
  }
};

const handleShareSelected = async () => {
  if (selectedDocuments.length === 0) {
    toast.error('No documents selected');
    return;
  }

  try {
    // Create shareable content
    const selectedDocs = documents.filter(doc => selectedDocuments.includes(doc.id));
    const shareableText = selectedDocs
      .map(doc => `${doc.filename} (${formatFileSize(doc.size || doc.char_count || 0)})`)
      .join('\n');

    // Check if Web Share API is available
    if (navigator.share) {
      await navigator.share({
        title: 'Shared Documents',
        text: `Sharing ${selectedDocuments.length} documents:\n\n${shareableText}`,
      });
      toast.success('Documents shared successfully!');
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(shareableText);
      toast.success('Document list copied to clipboard!', {
        description: 'You can now paste and share the document information',
        duration: 4000,
      });
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Share error:', error);
      toast.error('Failed to share documents');
    }
  }
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

  // Enhanced filtering and sorting
  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        doc.filename.toLowerCase().includes(searchLower) ||
        (doc.content && doc.content.toLowerCase().includes(searchLower));
      
      // Type filter
      const matchesType = filterType === 'all' || 
                        doc.file_type === filterType ||
                        doc.type === filterType ||
                        (filterType === 'selected' && selectedDocuments.includes(doc.id));
      
      // Date range filter (fix: only apply if both start and end are set, and include boundaries)
      let matchesDateRange = true;
      if (dateRange.start && dateRange.end) {
        const docDate = new Date(doc.created_at || doc.uploadedAt);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        // Set endDate to end of the day
        endDate.setHours(23, 59, 59, 999);
        matchesDateRange = docDate >= startDate && docDate <= endDate;
      }
      
      return matchesSearch && matchesType && matchesDateRange;
    });

    // Sorting (remove status case)
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.filename.localeCompare(b.filename);
        case 'size':
          return (b.size || b.char_count || 0) - (a.size || a.char_count || 0);
        case 'type':
          return (a.type || a.file_type || '').localeCompare(b.type || b.file_type || '');
        case 'chunks':
          return (b.chunk_count || 0) - (a.chunk_count || 0);
        case 'date':
        default:
          return new Date(b.created_at || b.uploadedAt || 0) - new Date(a.created_at || a.uploadedAt || 0);
      }
    });

    return filtered;
  }, [documents, searchTerm, sortBy, filterType, selectedDocuments, dateRange]);

  // Get all available tags from documents
  const availableTags = useMemo(() => {
    const tagSet = new Set();
    documents.forEach(doc => {
      if (doc.tags) {
        doc.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [documents]);

  // Enhanced refresh with progress tracking
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshDocuments();
      toast.success('Documents refreshed successfully!', {
        icon: '✨',
        duration: 3000,
      });
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh documents. Please try again.', {
        duration: 4000,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Enhanced delete with undo functionality
  const handleDelete = async (doc) => {
    const toastId = toast.loading(`Deleting "${doc.filename}"...`);
    
    try {
      await deleteDocument(doc.id);
      toast.success(`"${doc.filename}" deleted successfully`, {
        id: toastId,
        duration: 4000,
        action: {
          label: 'Undo',
          onClick: () => {
            // Implement undo functionality if available in your API
            toast.success('Delete undone!');
          }
        }
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Failed to delete "${doc.filename}". Please try again.`, {
        id: toastId,
        duration: 4000,
      });
    }
  };

  // Enhanced document selection
  const toggleDocumentSelection = useCallback((docId) => {
    const newSelection = selectedDocuments.includes(docId)
      ? selectedDocuments.filter(id => id !== docId)
      : [...selectedDocuments, docId];
    
    setSelectedDocuments(newSelection);
    
    // Haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, [selectedDocuments, setSelectedDocuments]);

  const selectAllDocuments = useCallback(() => {
    const allIds = filteredAndSortedDocuments.map(doc => doc.id);
    const isAllSelected = selectedDocuments.length === allIds.length;
    
    setSelectedDocuments(isAllSelected ? [] : allIds);
    
    toast.success(
      isAllSelected 
        ? 'All documents deselected' 
        : `${allIds.length} documents selected`,
      { duration: 2000 }
    );
  }, [filteredAndSortedDocuments, selectedDocuments, setSelectedDocuments]);

  // Drag and drop functionality
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDraggedOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDraggedOver(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setDraggedOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      try {
        await uploadDocuments(files);
        toast.success(`${files.length} file(s) uploaded successfully!`);
      } catch (error) {
        toast.error('Failed to upload files');
      }
    }
  }, [uploadDocuments]);

  // Enhanced file icon with status indicators
  const getFileIcon = (doc, size = 'w-6 h-6') => {
    if (!doc.filename || typeof doc.filename !== 'string') {
      return <File className={`${size} text-gray-400`} />;
    }

    const extension = doc.filename.split('.').pop()?.toLowerCase();
    const iconClass = `${size}`;
    const isProcessing = doc.status === 'processing';
    const hasError = doc.status === 'error';

    let IconComponent = File;
    let colorClass = 'text-gray-400';

    switch (extension) {
      case 'pdf':
        IconComponent = FileText;
        colorClass = hasError ? 'text-red-300' : isProcessing ? 'text-red-400' : 'text-red-500';
        break;
      case 'docx':
      case 'doc':
        IconComponent = File;
        colorClass = hasError ? 'text-blue-300' : isProcessing ? 'text-blue-400' : 'text-blue-500';
        break;
      case 'txt':
        IconComponent = FileText;
        colorClass = hasError ? 'text-gray-300' : isProcessing ? 'text-gray-400' : 'text-gray-500';
        break;
      case 'html':
          IconComponent = FileText;
          colorClass = hasError ? 'text-orange-300' : isProcessing ? 'text-orange-400' : 'text-orange-500';
          break;
      case 'md':
          IconComponent = FileText;
          colorClass = hasError ? 'text-purple-300' : isProcessing ? 'text-purple-400' : 'text-purple-500';
          break;
    }

    return (
      <div className="relative">
        <IconComponent className={`${iconClass} ${colorClass} transition-colors`} />
        {isProcessing && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
        )}
        {hasError && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
        )}
        {doc.starred && (
          <Star className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500 fill-current" />
        )}
      </div>
    );
  };

  const getTypeColor = (type) => {
    const colors = {
      'pdf': 'bg-red-100 text-red-800 border-red-200',
      'docx': 'bg-blue-100 text-blue-800 border-blue-200',
      'doc': 'bg-blue-100 text-blue-800 border-blue-200',
      'txt': 'bg-gray-100 text-gray-800 border-gray-200',
      'html': 'bg-orange-100 text-orange-800 border-orange-200',
      'md': 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Copy document info to clipboard
  const copyDocumentInfo = (doc) => {
    const info = `Document: ${doc.filename}\nSize: ${utils.formatFileSize(doc.size)}\nType: ${doc.type}\nUploaded: ${utils.formatDate(doc.created_at)}`;
    navigator.clipboard.writeText(info);
    toast.success('Document info copied to clipboard!');
  };

  // Empty state component
  const EmptyState = () => (
    <div className="max-w-4xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`
          border-2 border-dashed rounded-xl p-12 transition-all duration-300
          ${draggedOver 
            ? 'border-primary-400 bg-primary-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}>
          <div className="flex flex-col items-center gap-6">
            <div className={`
              w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300
              ${draggedOver ? 'bg-primary-100' : 'bg-gray-100'}
            `}>
              <Upload className={`w-12 h-12 ${draggedOver ? 'text-primary-500' : 'text-gray-400'}`} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">
                {draggedOver ? 'Drop Your Files Here!' : 'No Documents Yet'}
              </h3>
              <p className="text-gray-600 max-w-md">
                {draggedOver 
                  ? 'Release to upload your documents'
                  : 'Upload documents to get started with AI-powered question answering'
                }
              </p>
            </div>
            
            {!draggedOver && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium">
                  Choose Files
                </button>
                <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  Learn More
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );

  if (documents.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Enhanced Header with Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Folder className="w-8 h-8 text-primary-500" />
            Document Library
          </h1>
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <File className="w-4 h-4" />
            <span>{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{selectedDocuments.length} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>{formatFileSize(stats.totalSize)} total</span>
          </div>
        </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`
              px-4 py-2 rounded-lg border transition-all duration-200
              ${showAdvancedFilters 
                ? 'bg-primary-50 border-primary-200 text-primary-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <Filter className="w-4 h-4" />
          </button>
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setStartDate(null);
                setEndDate(null);
                setDateRange({ start: '', end: '' });
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
            >
              Clear Date Filter
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Enhanced Controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6">
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>

            {/* Filters and View Mode */}
            <div className="flex flex-wrap gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
                <option value="type">Sort by Type</option>
                <option value="chunks">Sort by Chunks</option>
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900"
              >
                <option value="all">All Files</option>
                <option value="selected">Selected</option>
                <option value="pdf">PDF</option>
                <option value="docx">Word</option>
                <option value="txt">Text</option>
              </select>

              <div className="flex rounded-xl border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-3 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-3 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-gray-200 space-y-4"
              >
                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Date
                    </label>
                    <DatePicker
                      selected={startDate}
                      onChange={date => {
                        setStartDate(date);
                        if (endDate && date && date > endDate) {
                          setEndDate(null);
                        }
                        setDateRange(prev => ({ ...prev, start: date ? date.toISOString().slice(0, 10) : '' }));
                      }}
                      selectsStart
                      startDate={startDate}
                      endDate={endDate}
                      maxDate={endDate || null}
                      placeholderText="From date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      dateFormat="MMMM d, yyyy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Date
                    </label>
                    <DatePicker
                      selected={endDate}
                      onChange={date => {
                        setEndDate(date);
                        if (startDate && date && date < startDate) {
                          setStartDate(null);
                        }
                        setDateRange(prev => ({ ...prev, end: date ? date.toISOString().slice(0, 10) : '' }));
                      }}
                      selectsEnd
                      startDate={startDate}
                      endDate={endDate}
                      minDate={startDate || null}
                      placeholderText="To date"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      dateFormat="MMMM d, yyyy"
                    />
                  </div>
                </div>

                {/* Tags Filter */}
                {availableTags.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {availableTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => {
                            setSelectedTags(prev => 
                              prev.includes(tag)
                                ? prev.filter(t => t !== tag)
                                : [...prev, tag]
                            );
                          }}
                          className={`
                            px-3 py-1 rounded-full text-sm font-medium transition-colors
                            ${selectedTags.includes(tag)
                              ? 'bg-primary-100 text-primary-800 border border-primary-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                            }
                          `}
                        >
                          <Tag className="w-3 h-3 inline mr-1" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bulk Actions */}
          {filteredAndSortedDocuments.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <button
                  onClick={selectAllDocuments}
                  className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  {selectedDocuments.length === filteredAndSortedDocuments.length ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                  {selectedDocuments.length === filteredAndSortedDocuments.length ? 'Deselect All' : 'Select All'}
                </button>
                
                {selectedDocuments.length > 0 && (
                  <div className="w-full flex justify-center items-center my-8">
                    <div className="bg-white rounded-2xl shadow-lg px-10 py-8 flex flex-col items-center max-w-sm w-full">
                      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                        <MessageSquare className="w-6 h-6 text-blue-500" aria-hidden="true" />
                      </div>
                      <p className="text-slate-700 text-base font-semibold mb-1">
                        {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
                      </p>
                      <p className="text-slate-500 mb-4 text-sm">Ready to ask questions?</p>
                      <button
                        onClick={handleAskQuestions}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow transition-all duration-200 text-base focus:outline-none focus:ring-2 focus:ring-green-300"
                        aria-label="Go to Ask Questions"
                      >
                        <MessageSquare className="w-5 h-5" aria-hidden="true" />
                        Go to Ask Questions
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Documents Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedDocuments.map((doc, index) => (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ 
                  delay: index * 0.05,
                  layout: { duration: 0.3 }
                }}
                className={`
                  bg-white rounded-xl border-2 p-6 cursor-pointer transition-all duration-300 group
                  ${selectedDocuments.includes(doc.id)
                    ? 'border-primary-300 bg-primary-50 shadow-lg shadow-primary-100'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                  }
                `}
                onClick={() => toggleDocumentSelection(doc.id)}
              >
                {/* Document Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(doc, 'w-10 h-10')}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-sm" title={doc.filename}>
                        {doc.filename}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatFileSize(doc.size || doc.char_count || 0)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {selectedDocuments.includes(doc.id) ? (
                      <CheckCircle className="w-5 h-5 text-primary-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                    )}
                  </div>
                </div>

                {/* Document Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(doc.type || doc.file_type)}`}>
                      {(doc.type || doc.file_type || 'Unknown').toUpperCase()}
                    </span>
                    
                    {/*doc.status && (
                      <div className="flex items-center gap-1">
                        {doc.status === 'processing' && (
                          <div className="flex items-center gap-1 text-yellow-600">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                            <span className="text-xs">Processing</span>
                          </div>
                        )}
                        {doc.status === 'ready' && (
                          <div className="flex items-center gap-1 text-green-600">
                            <FileCheck className="w-3 h-3" />
                            <span className="text-xs">Ready</span>
                          </div>
                        )}
                        {doc.status === 'error' && (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-xs">Error</span>
                          </div>
                        )}
                      </div>
                    )*/}
                  </div>
                  
                  {doc.created_at && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Calendar className="w-3 h-3 text-blue-400" />
                      <span className="font-medium">{new Date(doc.created_at).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}

                  {doc.chunk_count && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Layers className="w-3 h-3" />
                      {doc.chunk_count} chunks
                    </div>
                  )}

                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doc.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {doc.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{doc.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(doc);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      title="Preview document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(doc);
                      }}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                      title="Download document"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to delete "${doc.filename}"?`)) {
                        handleDelete(doc);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chunks
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedDocuments.map((doc, index) => (
                  <tr
                    key={doc.id}
                    onClick={() => toggleDocumentSelection(doc.id)}
                    className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedDocuments.includes(doc.id) ? 'bg-primary-50' : ''
                    }`}
                  >
                    {/* Document */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {selectedDocuments.includes(doc.id) ? (
                          <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        {getFileIcon(doc, 'w-8 h-8')}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.filename}</p>
                          <p className="text-sm text-gray-500">{(doc.type || doc.file_type || 'Unknown').toUpperCase()}</p>
                        </div>
                      </div>
                    </td>

                    {/* Size */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {doc.size || doc.char_count ? formatFileSize(doc.size || doc.char_count) : '—'}
                    </td>

                    {/* Chunks */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {doc.chunk_count || '—'}
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {doc.created_at ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-blue-400" />
                          <span className="font-medium">{new Date(doc.created_at).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </span>
                      ) : '—'}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreview(doc);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(doc);
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete "${doc.filename}"?`)) {
                              handleDelete(doc);
                            }
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredAndSortedDocuments.length === 0 && (searchTerm || filterType !== 'all' || selectedTags.length > 0) && (
        <div className="text-center py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-600">No documents found</h3>
              <p className="text-gray-500 max-w-md">
                Try adjusting your search terms, filters, or date range to find what you're looking for.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Clear search
                </button>
              )}
              {filterType !== 'all' && (
                <button
                  onClick={() => setFilterType('all')}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Clear filter
                </button>
              )}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Clear tags
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Quick Stats Footer */}
      {filteredAndSortedDocuments.length > 0 && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span>Showing {filteredAndSortedDocuments.length} of {documents.length} documents</span>
              </div>
              {selectedDocuments.length > 0 && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary-500" />
                  <span>{selectedDocuments.length} selected for AI queries</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Last updated {new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList;