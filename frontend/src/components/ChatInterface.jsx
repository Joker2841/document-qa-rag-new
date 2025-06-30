import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { useAppStore, useSettingsStore } from '../store/store';
import { 
  Send, 
  Bot, 
  User, 
  Clock, 
  FileText, 
  Search,
  Lightbulb,
  Zap,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageSquare,
  Mic,
  Plus,
  Filter,
  MoreHorizontal,
  CheckCircle,
  TrendingUp,
  Brain,
  Bookmark,
  AlertCircle
} from 'lucide-react';

const ChatInterface = () => {
  const [input, setInput] = useState('');
  const [expandedSources, setExpandedSources] = useState({});
  const [bookmarkedMessages, setBookmarkedMessages] = useState(new Set());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Optimized state selectors to prevent unnecessary re-renders
  const isLoading = useAppStore(state => state.isLoading);
  const askQuestion = useAppStore(state => state.askQuestion);
  const queryHistory = useAppStore(state => state.queryHistory);
  const documents = useAppStore(state => state.documents);
  const selectedDocuments = useAppStore(state => state.selectedDocuments);
  const setActiveTab = useAppStore(state => state.setActiveTab);

  // Settings selectors
  const maxSources = useSettingsStore(state => state.maxSources);
  const temperature = useSettingsStore(state => state.temperature);
  const showSources = useSettingsStore(state => state.showSources);
  const autoScroll = useSettingsStore(state => state.autoScroll);

  // Memoized computed values
  const selectedDocs = useMemo(() => 
    documents.filter(doc => selectedDocuments.includes(doc.id)), 
    [documents, selectedDocuments]
  );

  const reversedQueryHistory = useMemo(() => 
    [...queryHistory].reverse(), 
    [queryHistory]
  );

  const sampleQuestions = useMemo(() => [
    "What are the main topics covered in these documents?",
    "Can you summarize the key findings?",
    "What are the recommendations mentioned?",
    "Explain the methodology used in the research",
    "What are the limitations discussed?",
    "How do these findings compare to industry standards?"
  ], []);

  // Memoized callbacks
  const scrollToBottom = useCallback(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [autoScroll]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (selectedDocuments.length === 0) {
      toast.error('Please select at least one document to ask questions about.');
      return;
    }

    const question = input.trim();
    setInput('');
    setCurrentQuestion(question); // Track the question being asked
    
    try {
      await askQuestion(question, {
        maxSources,
        temperature
      });
    } catch (error) {
      console.error('Failed to ask question:', error);
      toast.error('There was an error processing your question.');
    } finally {
      setCurrentQuestion(''); // Clear after processing
    }
  }, [input, isLoading, selectedDocuments.length, askQuestion, maxSources, temperature]);

  const handleSampleQuestion = useCallback((question) => {
    setInput(question);
    inputRef.current?.focus();
  }, []);

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  }, []);

  const toggleSourceExpansion = useCallback((sourceId) => {
    setExpandedSources(prev => ({
      ...prev,
      [sourceId]: !prev[sourceId]
    }));
  }, []);
  
  const toggleBookmark = useCallback((messageId) => {
    setBookmarkedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  const handleQuickAction = useCallback((action) => {
    const template = `${action} the key points from these documents`;
    setInput(template);
    inputRef.current?.focus();
  }, []);

  const handleBrowseDocuments = useCallback(() => {
    setActiveTab('documents');
  }, [setActiveTab]);

  // Effects
  useEffect(() => {
    scrollToBottom();
  }, [queryHistory, isLoading, scrollToBottom]);

  // Helper function for similarity score display
  const formatSimilarityScore = useCallback((score) => {
    if (score === undefined || score === null) return 'N/A';
    return `${Math.round(score * 100)}% Match`;
  }, []);

  const [currentQuestion, setCurrentQuestion] = useState('');

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Enhanced Header with Glassmorphism */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg shadow-blue-500/5"
      >
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                className="relative p-3 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl shadow-lg"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Bot className="w-8 h-8 text-white" aria-hidden="true" />
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                  AI Research Assistant
                </h1>
                <p className="text-slate-600 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
                  Analyzing {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''} with advanced AI
                </p>
              </div>
            </div>
            
            {/* Document Pills */}
            {selectedDocs.length > 0 && (
              <motion.div 
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex -space-x-3">
                  {selectedDocs.slice(0, 3).map((doc, index) => (
                    <motion.div
                      key={doc.id}
                      className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center border-3 border-white shadow-lg text-white font-bold text-sm"
                      title={doc.filename}
                      style={{ zIndex: selectedDocs.length - index }}
                      whileHover={{ scale: 1.1, zIndex: 10 }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {doc.filename?.charAt(0)?.toUpperCase() || 'D'}
                    </motion.div>
                  ))}
                  {selectedDocs.length > 3 && (
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-400 to-slate-600 rounded-xl flex items-center justify-center border-3 border-white shadow-lg text-white font-bold text-sm">
                      +{selectedDocs.length - 3}
                    </div>
                  )}
                </div>
                <div className="ml-3 text-right">
                  <div className="text-sm font-semibold text-slate-700">{selectedDocs.length} Active</div>
                  <div className="text-xs text-slate-500">Documents</div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Messages Area with Custom Scrollbar */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 max-w-6xl mx-auto w-full custom-scrollbar">
        {/* Welcome Screen */}
        {queryHistory.length === 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <motion.div 
              className="w-24 h-24 bg-gradient-to-br from-blue-100 via-purple-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl"
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                rotate: { repeat: Infinity, duration: 4 },
                scale: { repeat: Infinity, duration: 2 }
              }}
            >
              <Brain className="w-12 h-12 text-blue-600" aria-hidden="true" />
            </motion.div>
            
            <motion.h2 
              className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Ready to Unlock Insights
            </motion.h2>
            
            <motion.p 
              className="text-slate-600 text-lg mb-12 max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              I'll analyze your documents with advanced AI to provide accurate, sourced answers to your questions
            </motion.p>

            {/* Enhanced Sample Questions */}
            {selectedDocs.length > 0 && (
              <motion.div 
                className="max-w-4xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center justify-center gap-3 mb-8">
                  <Lightbulb className="w-5 h-5 text-amber-500" aria-hidden="true" />
                  <span className="text-slate-700 font-semibold">Suggested Questions</span>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sampleQuestions.map((question, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      onClick={() => handleSampleQuestion(question)}
                      className="group p-5 text-left bg-white/70 backdrop-blur-sm hover:bg-white/90 rounded-2xl border border-white/50 hover:border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      aria-label={`Ask: ${question}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                          <MessageSquare className="w-4 h-4 text-white" aria-hidden="true" />
                        </div>
                        <p className="text-slate-700 group-hover:text-slate-900 transition-colors font-medium">
                          {question}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Enhanced Query History */}
        <AnimatePresence mode="wait">
          {reversedQueryHistory
            .filter(item => item.question && item.answer && item.answer.answer && item.answer.answer.trim() !== '' && !item.isError)
            .map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                {/* User Question */}
                <div className="flex gap-4 items-start">
                  <motion.div 
                    className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <User className="w-5 h-5 text-white" aria-hidden="true" />
                  </motion.div>
                  <motion.div 
                    className="flex-1 max-w-4xl"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl p-6 border border-slate-200/50 shadow-md">
                      <p className="text-slate-800 font-medium text-lg leading-relaxed">{item.question}</p>
                      <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                        <Clock className="w-4 h-4" aria-hidden="true" />
                        <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* AI Answer */}
                <div className="flex gap-4 items-start">
                  <motion.div 
                    className="relative w-10 h-10 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                  >
                    <Bot className="w-5 h-5 text-white" aria-hidden="true" />
                  </motion.div>
                  <motion.div 
                    className="flex-1 max-w-4xl"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-xl">
                      <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed">
                        <ReactMarkdown
                          components={{
                            strong: ({node, ...props}) => <strong className="font-semibold text-slate-900 bg-blue-50 px-1 rounded" {...props} />,
                            p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                          }}
                        >
                          {item.answer.answer}
                        </ReactMarkdown>
                      </div>

                      {/* Enhanced Sources Section */}
                      {showSources && item.answer.sources && item.answer.sources.length > 0 && (
                        <motion.div 
                          className="mt-6 pt-6 border-t border-slate-200"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg">
                              <FileText className="w-4 h-4 text-white" aria-hidden="true" />
                            </div>
                            <h4 className="font-semibold text-slate-800">
                              Sources ({item.answer.sources.length})
                            </h4>
                            <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                          </div>
                          
                          <div className="space-y-3">
                            {item.answer.sources.map((source, sourceIndex) => {
                              const sourceId = `${item.id}-${sourceIndex}`;
                              return (
                                <motion.div 
                                  key={sourceId}
                                  className="bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-xl p-4 border border-slate-200/50"
                                  whileHover={{ scale: 1.01 }}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">
                                          {source.document_name?.charAt(0) || 'D'}
                                        </span>
                                      </div>
                                      <span className="font-medium text-slate-800 truncate">
                                        {source.document_name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="px-3 py-1 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full text-xs font-semibold text-emerald-700">
                                        {formatSimilarityScore(source.similarity_score)}
                                      </div>
                                      <motion.button
                                        onClick={() => toggleSourceExpansion(sourceId)}
                                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        aria-label={expandedSources[sourceId] ? 'Collapse source' : 'Expand source'}
                                      >
                                        {expandedSources[sourceId] ? (
                                          <ChevronUp className="w-4 h-4" aria-hidden="true" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4" aria-hidden="true" />
                                        )}
                                      </motion.button>
                                    </div>
                                  </div>
                                  
                                  <AnimatePresence>
                                    {expandedSources[sourceId] && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-slate-600 border-t border-slate-200 pt-3 mt-3 bg-white/50 rounded-lg p-3"
                                      >
                                        <p className="whitespace-pre-wrap leading-relaxed">{source.content}</p>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}

                      {/* Enhanced Action Buttons */}
                      <motion.div 
                        className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        <div className="flex items-center gap-3">
                          <motion.button
                            onClick={() => copyToClipboard(item.answer.answer)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            aria-label="Copy answer to clipboard"
                          >
                            <Copy className="w-4 h-4" aria-hidden="true" />
                            Copy
                          </motion.button>
                          <motion.button
                            onClick={() => toggleBookmark(item.id)}
                            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                              bookmarkedMessages.has(item.id)
                                ? 'text-amber-600 bg-amber-100 hover:bg-amber-200'
                                : 'text-slate-600 hover:text-amber-600 bg-slate-100 hover:bg-amber-100'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            aria-label={bookmarkedMessages.has(item.id) ? 'Remove from bookmarks' : 'Add to bookmarks'}
                          >
                            <Bookmark className={`w-4 h-4 ${bookmarkedMessages.has(item.id) ? 'fill-current' : ''}`} aria-hidden="true" />
                            {bookmarkedMessages.has(item.id) ? 'Saved' : 'Save'}
                          </motion.button>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                          <div className="flex items-center gap-1">
                            <Zap className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                            <span>{item.answer.response_time?.toFixed(1) || '...'}s</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4 text-blue-500" aria-hidden="true" />
                            <span>Verified</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>

        {/* Error Messages */}
        <AnimatePresence>
          {reversedQueryHistory
            .filter(item => item.isError)
            .map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-4xl mx-auto"
              >
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900 mb-1">Error processing question</h4>
                    <p className="text-red-700 text-sm">{item.question}</p>
                    <p className="text-red-600 text-sm mt-2">Please try again or check your connection.</p>
                  </div>
                </div>
              </motion.div>
            ))}
        </AnimatePresence>

        {/* Loading State */}
        <AnimatePresence>
          {isLoading && currentQuestion && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="space-y-6"
            >
              {/* Show the question being processed */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <User className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1 max-w-4xl">
                  <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 rounded-2xl p-6 border border-slate-200/50 shadow-md">
                    <p className="text-slate-800 font-medium text-lg leading-relaxed">{currentQuestion}</p>
                    <div className="flex items-center gap-2 mt-4 text-sm text-slate-500">
                      <Clock className="w-4 h-4" aria-hidden="true" />
                      <span>Just now</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Processing Animation */}
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Bot className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1 max-w-4xl">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="flex space-x-2">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                            animate={{ 
                              scale: [1, 1.5, 1],
                              opacity: [0.5, 1, 0.5]
                            }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 1.5,
                              delay: i * 0.2
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-slate-600 font-medium">Analyzing documents and generating response...</span>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Brain className="w-4 h-4" aria-hidden="true" />
                        <span>Processing with advanced AI models</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input Area */}
      <motion.div 
        className="backdrop-blur-xl bg-white/80 border-t border-white/20 shadow-lg shadow-blue-500/5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-6xl mx-auto p-6">
          {selectedDocuments.length === 0 ? (
            <motion.div 
              className="text-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-slate-500" aria-hidden="true" />
                </div>
                <p className="text-slate-600 text-lg font-medium mb-4">Select documents to start asking questions</p>
                <motion.button
                  onClick={handleBrowseDocuments}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Browse and select documents"
                >
                  <Plus className="w-5 h-5" aria-hidden="true" />
                  Browse Documents
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-4 items-end">
                <div className="flex-1 relative">
                  <motion.input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything about your documents..."
                    className="w-full px-6 py-4 pr-32 bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl shadow-lg focus:ring-4 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all duration-300 text-lg placeholder-slate-400"
                    disabled={isLoading}
                    whileFocus={{ scale: 1.02 }}
                    aria-label="Ask a question about your documents"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    <motion.button
                      type="button"
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label="Voice input (coming soon)"
                      disabled
                    >
                      <Mic className="w-5 h-5" aria-hidden="true" />
                    </motion.button>
                    <div className="w-px h-6 bg-slate-300" />
                    <motion.button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label="Send question"
                    >
                      <Send className="w-5 h-5" aria-hidden="true" />
                    </motion.button>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">Quick actions:</span>
                  <div className="flex gap-2">
                    {['Summarize', 'Compare', 'Analyze'].map((action) => (
                      <motion.button
                        key={action}
                        type="button"
                        onClick={() => handleQuickAction(action)}
                        className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label={`Quick action: ${action}`}
                      >
                        {action}
                      </motion.button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span>AI Ready</span>
                  </div>
                  <div className="w-px h-4 bg-slate-300" />
                  <span>{selectedDocs.length} docs active</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </motion.div>

      {/* Custom Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(148, 163, 184, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;