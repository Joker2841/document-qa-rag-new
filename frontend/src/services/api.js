import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1',
  timeout: 90000, // 90 seconds for document processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.metadata = { startTime: new Date() };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Calculate response time
    const endTime = new Date();
    const duration = endTime - response.config.metadata.startTime;
    response.duration = duration;
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          toast.error(data.detail || 'Invalid request');
          break;
        case 401:
          toast.error('Unauthorized access');
          break;
        case 403:
          toast.error('Access forbidden');
          break;
        case 404:
          toast.error('Resource not found');
          break;
        case 413:
          toast.error('File too large');
          break;
        case 422:
          toast.error('Invalid file format');
          break;
        case 500:
          toast.error('Server error. Please try again.');
          break;
        default:
          toast.error('Something went wrong');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('Request failed');
    }
    
    return Promise.reject(error);
  }
);

// Document API functions
export const documentAPI = {
  // Upload documents
  uploadDocuments: async (files, onProgress) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('file', file);
    });

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress?.(percentCompleted);
      },
    });

    return response.data;
  },

  // Get all documents
  getDocuments: async () => {
    const response = await api.get('/documents');
    return response.data;
  },

  // Delete document
  deleteDocument: async (documentId) => {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  },

  // Get document content
  getDocumentContent: async (documentId) => {
    const response = await api.get(`/documents/${documentId}/content`);
    return response.data;
  },

  // Search documents using the better RAG service endpoint
  searchDocuments: async (query, options = {}) => {
    const response = await api.post('/documents/search', {
      query,
      top_k: options.limit || options.top_k || 5,
      score_threshold: options.threshold || options.score_threshold || 0.3
    });
    return response.data;
  },
};

// Query API functions
export const queryAPI = {
  // Ask question
  askQuestion: async (question, documentIds = [], options = {}) => {
    const response = await api.post('/query/ask', {
      question,
      document_ids: documentIds,
      top_k: options.top_k || 5,
      score_threshold: options.score_threshold || 0.3,
      max_tokens: options.max_tokens || 512,
      temperature: options.temperature || 0.7,
    });

    return response.data;
  },

  // Search documents - NOW USES THE BETTER ENDPOINT
  searchDocuments: async (query, documentIds = [], limit = 10) => {
    // Use the better-performing documents/search endpoint
    return documentAPI.searchDocuments(query, {
      limit,
      document_ids: documentIds,
      top_k: limit,
      score_threshold: 0.3
    });
  },

    // Ask question with conversation context
  askQuestionWithContext: async (question, conversationContext = [], documentIds = [], options = {}) => {
    const response = await api.post('/query/ask-with-context', {
      question,
      document_ids: documentIds,
      top_k: options.top_k || 5,
      score_threshold: options.score_threshold || 0.3,
      max_tokens: options.max_tokens || 512,
      temperature: options.temperature || 0.3,
    }, {
      data: {
        conversation_context: conversationContext
      }
    });

    return response.data;
  },

  // Get query history
  getQueryHistory: async (limit = 50) => {
    const response = await api.get(`/query/history?limit=${limit}`);
    return response.data;
  },
};

// Analytics API functions
export const analyticsAPI = {
  // Get usage statistics
  getStats: async () => {
    try {
      const response = await api.get('/analytics/stats');
      return response.data;
    } catch (error) {
      console.error('Analytics API - getStats error:', error);
      // Return default stats if API fails
      return {
        total_queries: 0,
        total_documents: 0,
        avg_response_time: 0.0,
        successful_queries: 0,
        failed_queries: 0,
        last_updated: new Date().toISOString(),
        top_llm_used: null
      };
    }
  },

  // Get popular questions
  getPopularQuestions: async (limit = 10) => {
    try {
      const response = await api.get(`/analytics/popular-questions?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Analytics API - getPopularQuestions error:', error);
      // Return empty structure if API fails
      return {
        questions: [],
        total_unique_questions: 0
      };
    }
  },

  // Get query trends
  getQueryTrends: async (days = 7) => {
    try {
      const response = await api.get(`/analytics/query-trends?days=${days}`);
      return response.data;
    } catch (error) {
      console.error('Analytics API - getQueryTrends error:', error);
      return {
        success: false,
        trends: []
      };
    }
  },

  // Get LLM usage statistics
  getLLMUsage: async () => {
    try {
      const response = await api.get('/analytics/llm-usage');
      return response.data;
    } catch (error) {
      console.error('Analytics API - getLLMUsage error:', error);
      return {
        success: false,
        llm_usage: {},
        top_llm: null,
        top_llm_count: 0
      };
    }
  }
};

// Search API - Unified interface using the better endpoint
export const searchAPI = {
  // Main search function using the excellent RAG service
  search: async (query, options = {}) => {
    return documentAPI.searchDocuments(query, options);
  },
  
  // Semantic search with more options
  semanticSearch: async (query, options = {}) => {
    const response = await api.post('/documents/search', {
      query,
      top_k: options.topK || 5,
      score_threshold: options.scoreThreshold || 0.3,
      // Add any additional options your RAG service supports
    });
    return response.data;
  },
};

// Utility functions
export const utils = {
  // Format file size
  formatFileSize: (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Format date
  formatDate: (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  // Validate file
  validateFile: (file) => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/html',
      'text/markdown',
      'text/x-markdown',
      'application/x-pdf',
    ];
    
    const allowedExtensions = ['.pdf', '.docx', '.doc', '.txt', '.html', '.md'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (file.size > maxSize) {
      throw new Error(`File "${file.name}" is too large. Maximum size is 50MB.`);
    }

    // Check by extension if MIME type check fails
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      throw new Error(`File "${file.name}" has unsupported format. Supported: PDF, Word, Text, HTML, Markdown`);
    }

    return true;
  },

  // Debounce function
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Highlight text with HTML safe escaping
  highlightText: (text, query) => {
    if (!query || !text) return text;
    
    // Escape special regex characters in query
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
  },

  // Extract text snippet around match
  extractSnippet: (text, query, maxLength = 200) => {
    if (!query || !text) return text.substring(0, maxLength) + '...';
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) {
      return text.substring(0, maxLength) + '...';
    }
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 150);
    
    let snippet = text.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';
    
    return snippet;
  },
};

export default api;