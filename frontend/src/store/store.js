import { create } from 'zustand';
import { documentAPI, queryAPI } from '../services/api';
import { analyticsAPI } from '../services/api';

// Helper: Normalize documents to ensure required fields and avoid undefined values
function normalizeDocuments(docs) {
  return docs.map(doc => ({
    id: doc.id ?? '',
    filename: typeof doc.filename === 'string' ? doc.filename : 'unknown',
    file_type: typeof doc.file_type === 'string' ? doc.file_type : 'unknown',
    status: doc.status ?? 'uploaded',
    char_count: doc.char_count ?? 0,
    created_at: doc.created_at ?? new Date().toISOString(),
    ...doc,
  }));
}

export const useAppStore = create((set, get) => ({
  // Documents
  documents: [],
  selectedDocuments: [],
  isUploading: false,
  uploadProgress: 0,

  // Query
  currentQuestion: '',
  currentAnswer: null,
  isLoading: false,
  queryHistory: [],

  // UI
  activeTab: 'upload',
  sidebarOpen: true,

  // Init
  isInitialized: false,

  // Analytics
  stats: null,

  setDocuments: (documents) => {
    const normalizedDocs = normalizeDocuments(documents);
    set({ documents: normalizedDocs });
  },

  setSelectedDocuments: (selectedDocuments) => set({ selectedDocuments }),

  uploadDocuments: async (files) => {
    set({ isUploading: true, uploadProgress: 0 });
  
    try {
      // Pass the WebSocket client ID with the upload
      const result = await documentAPI.uploadDocuments(files, (progress) => {
        set({ uploadProgress: progress });
      });
  
      // Don't immediately refresh - let WebSocket handle the updates
      set({
        isUploading: false,
        uploadProgress: 0,
      });
  
      // Refresh documents after a delay to ensure processing is visible
      setTimeout(async () => {
        const { documents, count } = await documentAPI.getDocuments();
        set({
          documents: normalizeDocuments(documents),
          totalDocumentCount: count,
          activeTab: 'documents',
        });
      }, 2000);
  
      return result;
    } catch (error) {
      set({ isUploading: false, uploadProgress: 0 });
      throw error;
    }
  },

  deleteDocument: async (documentId) => {
    try {
      await documentAPI.deleteDocument(documentId);
      const documents = get().documents.filter((doc) => doc.id !== documentId);
      const selectedDocuments = get().selectedDocuments.filter((id) => id !== documentId);
      set({ documents, selectedDocuments });
    } catch (error) {
      throw error;
    }
  },

  refreshDocuments: async () => {
    try {
      const { documents, count } = await documentAPI.getDocuments();
      set({ documents: normalizeDocuments(documents), totalDocumentCount: count });
    } catch (error) {
      console.error('Failed to refresh documents:', error);
    }
  },

  setCurrentQuestion: (question) => set({ currentQuestion: question }),

  conversationContext: [],
  
  clearConversation: () => set({ 
  conversationContext: [],
  queryHistory: []
  }),

  askQuestion: async (question, options = {}) => {
    const { selectedDocuments, queryHistory, conversationContext } = get();
    const selectedDocumentIds = options.document_ids || selectedDocuments.map(doc => doc.id);
    
    set({ isLoading: true });
  
    try {
      // Use context-aware endpoint
      const result = await queryAPI.askQuestionWithContext(
        question, 
        conversationContext,
        selectedDocumentIds, 
        options
      );
  
      // Update conversation context (keep last 3)
      const newContext = [
        ...conversationContext.slice(-2),
        { question, answer: result.answer }
      ];
  
      const historyItem = {
        id: result.timestamp || `query_${Date.now()}`,
        question,
        answer: {
          answer: result.answer,
          sources: result.sources,
          response_time: result.response_time,
        },
        timestamp: result.timestamp ?? new Date().toISOString(),
        documentIds: selectedDocuments,
      };
  
      set((state) => ({
        isLoading: false,
        queryHistory: [historyItem, ...state.queryHistory.slice(0, 49)],
        conversationContext: newContext,
        activeTab: 'chat',
      }));
  
      return result;
  
    } catch (error) {
      // Error handling stays the same
      const errorHistoryItem = {
        id: `error_${Date.now()}`,
        question,
        answer: {
          answer: 'Sorry, an error occurred while processing your question. Please try again.',
          sources: [],
          response_time: 0,
        },
        timestamp: new Date().toISOString(),
        documentIds: selectedDocuments,
        isError: true,
      };
  
      set((state) => ({
        isLoading: false,
        queryHistory: [errorHistoryItem, ...state.queryHistory.slice(0, 49)],
      }));
      
      console.error('Failed to ask question:', error);
      throw error;
    }
  },

  // Add streaming-related state
  isStreaming: false,
  streamingMessageId: null,
  useStreaming: true, // Toggle for streaming mode

  // Toggle streaming mode
  toggleStreaming: () => set((state) => ({ useStreaming: !state.useStreaming })),

  // Ask question with streaming support
  askQuestionWithStreaming: async (question, options = {}) => {
    const { selectedDocuments, queryHistory, conversationContext } = get();
    const selectedDocumentIds = options.document_ids || selectedDocuments.map(doc => doc.id);
    
    set({ isLoading: true, isStreaming: true });

    // Create a temporary message ID for tracking
    const tempMessageId = `streaming_${Date.now()}`;
    set({ streamingMessageId: tempMessageId });

    try {
      // First, search for context chunks via HTTP
      const searchResults = await queryAPI.searchDocuments(question, selectedDocumentIds, 5);
      
      if (!searchResults.results || searchResults.results.length === 0) {
        throw new Error('No relevant documents found');
      }

      // Send streaming request via WebSocket
      websocketService.send({
        type: 'stream_answer',
        question: question,
        context_chunks: searchResults.results,
        conversation_context: conversationContext
      });

      // Create placeholder for streaming message
      const historyItem = {
        id: tempMessageId,
        question,
        answer: {
          answer: '', // Will be filled by streaming
          sources: searchResults.results.map(r => ({
            document_name: r.metadata?.filename || 'Unknown',
            similarity_score: r.score || 0,
            content: r.content
          })),
          response_time: 0,
        },
        timestamp: new Date().toISOString(),
        documentIds: selectedDocuments,
        isStreaming: true
      };

      set((state) => ({
        queryHistory: [historyItem, ...state.queryHistory.slice(0, 49)],
        activeTab: 'chat',
      }));

      return { success: true, messageId: tempMessageId };

    } catch (error) {
      set({ isLoading: false, isStreaming: false });
      console.error('Failed to start streaming:', error);
      throw error;
    }
  },

  // Update streaming message
  updateStreamingMessage: (messageId, content, isComplete = false) => {
    set((state) => ({
      queryHistory: state.queryHistory.map(item => 
        item.id === messageId 
          ? {
              ...item,
              answer: { ...item.answer, answer: content },
              isStreaming: !isComplete
            }
          : item
      ),
      isLoading: isComplete ? false : state.isLoading,
      isStreaming: !isComplete
    }));
  },

  searchDocuments: async (query, limit = 10) => {
    const { selectedDocuments } = get();
    try {
      return await queryAPI.searchDocuments(query, selectedDocuments, limit);
    } catch (error) {
      throw error;
    }
  },

  

  clearCurrentAnswer: () => set({ currentAnswer: null }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  initialize: async () => {
    try {
      const { documents, count } = await documentAPI.getDocuments();
      set({ documents: normalizeDocuments(documents), totalDocumentCount: count });

      try {
const { queries } = await queryAPI.getQueryHistory(20);
const mapped = queries.map((q) => ({
  id: Date.now() + Math.random(), // fallback unique id
  question: q.question,
  answer: {
    answer: q.answer ?? '',
    sources: [], // or q.sources if your backend provides them
    response_time: q.response_time ?? null
  },
  timestamp: q.created_at ?? new Date().toISOString()
}));
set({ queryHistory: mapped });

      } catch (error) {
        console.log('Query history not available');
      }

      set({ isInitialized: true });
    } catch (error) {
      console.error('Failed to initialize app:', error);
      set({ isInitialized: true });
    }
  },
}));

export const useSettingsStore = create((set) => ({
  maxSources: 5,
  temperature: 0.3,
  chunkSize: 1000,
  scoreThreshold: 0.3,
  showSources: true,
  autoScroll: true,
  soundEnabled: false,
  selectedLLM: 'local',
  gpuEnabled: true,

  updateSettings: (newSettings) => {
    set(newSettings);
    // Save to localStorage
    localStorage.setItem('documind-settings', JSON.stringify(newSettings));
  },

  resetSettings: () => {
    const defaults = {
      maxSources: 5,
      temperature: 0.3,
      chunkSize: 1000,
      scoreThreshold: 0.3,
      showSources: true,
      autoScroll: true,
      soundEnabled: false,
      selectedLLM: 'local',
      gpuEnabled: true
    };
    set(defaults);
    localStorage.removeItem('documind-settings');
  },

  // Load settings from localStorage on init
  loadSettings: () => {
    const saved = localStorage.getItem('documind-settings');
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        set(settings);
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }
}));
// Improved analytics store with better error handling
export const useAnalyticsStore = create((set, get) => ({
  stats: {
    total_queries: 0,
    total_documents: 0,
    avg_response_time: 0.0,
    successful_queries: 0,
    failed_queries: 0,
    last_updated: null,
    top_llm_used: null
  },
  popularQuestions: [],
  queryTrends: [],
  llmUsage: {},
  isLoading: false,
  error: null,

  loadStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await analyticsAPI.getStats();
      set({ stats, isLoading: false });
      return stats;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to load stats'
      });
      console.error('Failed to load stats:', error);
      throw error;
    }
  },

  loadPopularQuestions: async (limit = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await analyticsAPI.getPopularQuestions(limit);
      set({ 
        popularQuestions: response.questions || [],
        isLoading: false 
      });
      return response;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to load popular questions',
        popularQuestions: []
      });
      console.error('Failed to load popular questions:', error);
      throw error;
    }
  },

  loadQueryTrends: async (days = 7) => {
    set({ isLoading: true, error: null });
    try {
      const response = await analyticsAPI.getQueryTrends(days);
      set({ 
        queryTrends: response.trends || [],
        isLoading: false 
      });
      return response;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to load query trends',
        queryTrends: []
      });
      console.error('Failed to load query trends:', error);
      throw error;
    }
  },

  loadLLMUsage: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await analyticsAPI.getLLMUsage();
      set({ 
        llmUsage: response.llm_usage || {},
        isLoading: false 
      });
      return response;
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to load LLM usage',
        llmUsage: {}
      });
      console.error('Failed to load LLM usage:', error);
      throw error;
    }
  },

  loadAllAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const [stats, popularQuestions, queryTrends, llmUsage] = await Promise.allSettled([
        analyticsAPI.getStats(),
        analyticsAPI.getPopularQuestions(10),
        analyticsAPI.getQueryTrends(7),
        analyticsAPI.getLLMUsage()
      ]);

      set({
        stats: stats.status === 'fulfilled' ? stats.value : get().stats,
        popularQuestions: popularQuestions.status === 'fulfilled' ? popularQuestions.value.questions || [] : [],
        queryTrends: queryTrends.status === 'fulfilled' ? queryTrends.value.trends || [] : [],
        llmUsage: llmUsage.status === 'fulfilled' ? llmUsage.value.llm_usage || {} : {},
        isLoading: false,
        error: null
      });

      // Log any failed requests
      if (stats.status === 'rejected') console.error('Stats failed:', stats.reason);
      if (popularQuestions.status === 'rejected') console.error('Popular questions failed:', popularQuestions.reason);
      if (queryTrends.status === 'rejected') console.error('Query trends failed:', queryTrends.reason);
      if (llmUsage.status === 'rejected') console.error('LLM usage failed:', llmUsage.reason);

    } catch (error) {
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to load analytics data'
      });
      console.error('Failed to load all analytics:', error);
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    stats: {
      total_queries: 0,
      total_documents: 0,
      avg_response_time: 0.0,
      successful_queries: 0,
      failed_queries: 0,
      last_updated: null,
      top_llm_used: null
    },
    popularQuestions: [],
    queryTrends: [],
    llmUsage: {},
    isLoading: false,
    error: null
  })
}));
