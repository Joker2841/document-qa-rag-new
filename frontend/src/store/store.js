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
      const result = await documentAPI.uploadDocuments(files, (progress) => {
        set({ uploadProgress: progress });
      });

      const { documents, count } = await documentAPI.getDocuments();
      set({
        documents: normalizeDocuments(documents),
        totalDocumentCount: count,
        isUploading: false,
        uploadProgress: 0,
        activeTab: 'documents',
      });

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

askQuestion: async (question, options = {}) => {
    const { selectedDocuments, queryHistory } = get();
    const tempId = `temp_${Date.now()}`;

    // Step 1: Immediately add the user's question and a placeholder to the history
    const optimisticUpdate = {
      id: tempId,
      question,
      answer: {
        answer: '...', // This will be replaced by the loading indicator in the UI
        sources: [],
        response_time: 0,
      },
      timestamp: new Date().toISOString(),
      documentIds: selectedDocuments,
      isPlaceholder: true, // Flag to indicate this is a temporary item
    };

    set({
      isLoading: true,
      queryHistory: [optimisticUpdate, ...queryHistory.slice(0, 49)],
      activeTab: 'chat',
    });

    try {
      // Step 2: Make the actual API call
      const result = await queryAPI.askQuestion(question, selectedDocuments, options);

      // Step 3: On success, find the placeholder and replace it with the real answer
      const finalHistoryItem = {
        id: result.timestamp || tempId, // Use a real ID if available
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
        queryHistory: state.queryHistory.map((item) =>
          item.id === tempId ? finalHistoryItem : item
        ),
      }));

      return result;

    } catch (error) {
      // Step 4: On error, update the placeholder to show an error message
      const errorHistoryItem = {
        ...optimisticUpdate,
        answer: {
          answer: 'Sorry, an error occurred while processing your question. Please try again.',
          sources: [],
        },
        isError: true,
      };

      set((state) => ({
        isLoading: false,
        queryHistory: state.queryHistory.map((item) =>
          item.id === tempId ? errorHistoryItem : item
        ),
      }));
      
      console.error('Failed to ask question:', error);
      throw error;
    }
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
  maxSources: 3,
  temperature: 0.7,
  chunkSize: 1000,
  theme: 'light',
  showSources: true,
  autoScroll: true,
  soundEnabled: false,

  updateSettings: (newSettings) => set(newSettings),

  resetSettings: () =>
    set({
      maxSources: 3,
      temperature: 0.7,
      chunkSize: 1000,
      theme: 'light',
      showSources: true,
      autoScroll: true,
      soundEnabled: false,
    }),
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
