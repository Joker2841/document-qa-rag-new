import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Zap, 
  FileText,
  Brain,
  MessageSquare,
  ChevronRight,
  Loader,
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  Cpu,
  TrendingUp,
  BookOpen,
  Search,
  Plus,
  History
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/store';
import websocketService from '../services/websocket';

const ChatInterface = () => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [streamingAnswer, setStreamingAnswer] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Map store properties to what ChatInterface expects
  const { 
    queryHistory,
    askQuestion,
    isLoading, 
    documents,
    setActiveTab,
    conversationContext,
    clearConversation
  } = useAppStore();

  // Transform queryHistory to messages format
  const messages = useMemo(() => {
    if (!queryHistory) return [];
    
    return queryHistory.flatMap(item => {
      const userMessage = {
        id: `${item.id}_user`,
        role: 'user',
        content: item.question,
        timestamp: item.timestamp
      };
      
      const assistantMessage = {
        id: `${item.id}_assistant`,
        role: 'assistant',
        content: item.answer?.answer || 'No response',
        sources: item.answer?.sources || [],
        metadata: {
          response_time: item.answer?.response_time,
          llm_used: item.llm_used || 'Unknown',
          context_chunks_count: item.context_chunks_count
        },
        timestamp: item.timestamp,
        error: item.isError
      };
      
      return [userMessage, assistantMessage];
    });
  }, [queryHistory]);

  // Create wrapper functions
  const sendMessage = async (question, documentIds) => {
    try {
      // Pass empty array if no documents selected, which means search all
      await askQuestion(question, { document_ids: documentIds || [] });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please ensure you have documents uploaded.');
    }
  };

  const clearMessages = () => {
    // Since there's no clear function in the store, we'll just show a toast
    toast.info('Clear history feature coming soon!');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate suggestions while typing
  useEffect(() => {
    if (input.length > 2) {
      // Get unique questions from history
      const historicalQuestions = queryHistory
        .map(item => item.question)
        .filter(q => q.toLowerCase().includes(input.toLowerCase()))
        .slice(0, 5);
      
      setSuggestions(historicalQuestions);
      setShowSuggestions(historicalQuestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [input, queryHistory]);

  useEffect(() => {
    // Listen for streaming answers
    websocketService.on('answer_stream_start', () => {
      setIsStreaming(true);
      setStreamingAnswer('');
    });
    
    websocketService.on('answer_stream_chunk', (data) => {
      setStreamingAnswer(data.content);
    });
    
    websocketService.on('answer_stream_end', (data) => {
      setIsStreaming(false);
      // Update the actual message in history
    });
    
    return () => {
      websocketService.off('answer_stream_start');
      websocketService.off('answer_stream_chunk');
      websocketService.off('answer_stream_end');
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    try {
      await sendMessage(userMessage, selectedDocumentIds);
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    }
  };

  // Suggested questions
  const suggestedQuestions = [
    { icon: BookOpen, text: "Summarize the main points from my documents", color: "from-blue-500 to-cyan-500" },
    { icon: Search, text: "What are the key findings mentioned?", color: "from-purple-500 to-pink-500" },
    { icon: Brain, text: "Explain the technical concepts in simple terms", color: "from-green-500 to-emerald-500" },
    { icon: TrendingUp, text: "What trends are highlighted in the data?", color: "from-orange-500 to-red-500" }
  ];

  // Typing animation component
  const TypingIndicator = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-2 text-gray-400"
    >
      <Bot className="w-5 h-5" />
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2,
            }}
            className="w-2 h-2 bg-primary-400 rounded-full"
          />
        ))}
      </div>
      <span className="text-sm">AI is thinking...</span>
    </motion.div>
  );

  // Streaming indicator component
  const StreamingIndicator = () => (
    <motion.div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg">
        <Bot className="w-5 h-5 text-white" />
      </div>
      
      <div className="flex-1">
        <motion.div className="inline-block max-w-3xl glass-card rounded-2xl p-4">
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>
              {streamingAnswer || '█'}
            </ReactMarkdown>
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block w-1 h-4 bg-primary-400 ml-1"
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  // Message component with animations
  const MessageComponent = ({ message, index }) => {
    const isUser = message.role === 'user';
    
    return (
      <motion.div
        initial={{ opacity: 0, x: isUser ? 20 : -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          className={`
            flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
            ${isUser 
              ? 'bg-gradient-to-r from-primary-500 to-purple-500' 
              : 'bg-gradient-to-r from-green-500 to-emerald-500'
            }
            shadow-lg
          `}
        >
          {isUser ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
        </motion.div>
        
        {/* Message Content */}
        <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
          <motion.div
            whileHover={{ scale: 1.01 }}
            className={`
              inline-block max-w-3xl glass-card rounded-2xl p-4
              ${isUser ? 'bg-primary-500/10 border-primary-500/20' : ''}
            `}
          >
            {isUser ? (
              <p className="text-white">{message.content}</p>
            ) : (
              <div className="space-y-4">
               <div className="prose prose-invert max-w-none">
                <ReactMarkdown 
                  
                  components={{
                    p: ({ children }) => <p className="mb-2 text-gray-200">{children}</p>,
                    h1: ({ children }) => <h1 className="text-2xl font-bold mb-3 gradient-text">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold mb-2 text-white">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold mb-2 text-white">{children}</h3>,
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-2">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-300">{children}</li>,
                    code: ({ inline, children }) => 
                      inline ? (
                        <code className="bg-white/10 px-1 py-0.5 rounded text-primary-300">{children}</code>
                      ) : (
                        <code className="block bg-black/30 p-3 rounded-lg overflow-x-auto text-gray-300">{children}</code>
                      ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-primary-400 pl-4 italic text-gray-400">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4 pt-4 border-t border-white/10"
                  >
                    <p className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Sources:
                    </p>
                    <div className="space-y-2">
                      {message.sources.map((source, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          whileHover={{ x: 5 }}
                          className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white">{source.document_name}</p>
                            <p className="text-xs text-gray-400">
                              Score: {(source.similarity_score * 100).toFixed(1)}% match
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
                
                {/* Metadata */}
                {message.metadata && (
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    {message.metadata.llm_used && (
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        {message.metadata.llm_used}
                      </span>
                    )}
                    {message.metadata.response_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {message.metadata.response_time.toFixed(2)}s
                      </span>
                    )}
                    {message.metadata.context_chunks_count && (
                      <span className="flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        {message.metadata.context_chunks_count} chunks
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
          
          {/* Timestamp */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-gray-500 mt-1 px-2"
          >
            {new Date(message.timestamp).toLocaleTimeString()}
          </motion.p>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-4 mb-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Brain className="w-8 h-8 text-primary-400" />
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="absolute inset-0 bg-primary-400/30 rounded-full blur-xl"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold">AI Assistant</h2>
              <p className="text-sm text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                {conversationContext.length > 0 
                  ? `Context: ${conversationContext.length} messages`
                  : 'Ready to help with your documents'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* New Conversation Button */}
            {conversationContext.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  clearConversation();
                  toast.success('Started new conversation', { icon: '🆕' });
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </motion.button>
            )}
            
            {/* Document selector */}
            {documents && documents.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Search in:</span>
                <select
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedDocumentIds(value === 'all' ? [] : [value]);
                  }}
                >
                  <option value="all">All documents</option>
                  {documents.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.filename}</option>
                  ))}
                </select>
              </div>
            )}

            {messages && messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear chat
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col items-center justify-center text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="mb-8"
            >
              <MessageSquare className="w-20 h-20 text-primary-400/50 mx-auto" />
            </motion.div>
            
            <h3 className="text-2xl font-bold gradient-text mb-4">
              Start a Conversation
            </h3>
            <p className="text-gray-400 mb-8 max-w-md">
              Ask questions about your documents and get intelligent answers powered by advanced RAG technology
            </p>
            
            {/* Suggested Questions */}
            <div className="grid grid-cols-2 gap-3 max-w-2xl">
              {suggestedQuestions.map((question, idx) => {
                const Icon = question.icon;
                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInput(question.text)}
                    className="glass-card rounded-xl p-4 text-left hover:bg-white/10 transition-all group"
                  >
                    <div className={`
                      w-10 h-10 rounded-lg bg-gradient-to-r ${question.color}
                      flex items-center justify-center mb-3 group-hover:scale-110 transition-transform
                    `}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm text-gray-300">{question.text}</p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageComponent key={message.id} message={message} index={index} />
            ))}
            
            <AnimatePresence>
              {isLoading && <TypingIndicator />}
              {isStreaming && <StreamingIndicator />}
            </AnimatePresence>
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Ask a question about your documents..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl 
                         text-white placeholder-gray-400 resize-none
                         focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                         transition-all duration-300"
                rows={1}
                style={{
                  minHeight: '48px',
                  maxHeight: '120px',
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              
              {/* Autocomplete Suggestions */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute bottom-full mb-2 left-0 right-0 bg-gray-900/95 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-xl"
                  >
                    <div className="p-2">
                      <p className="text-xs text-gray-400 px-3 py-1 flex items-center gap-1">
                        <History className="w-3 h-3" />
                        Recent questions
                      </p>
                      {suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setInput(suggestion);
                            setShowSuggestions(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Character count */}
              {input.length > 0 && (
                <span className="absolute bottom-2 right-2 text-xs text-gray-500">
                  {input.length} / 1000
                </span>
              )}
            </div>
            
            {/* Quick actions */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Press Enter to send</span>
              {documents.length === 0 && (
                <span className="text-xs text-yellow-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  No documents uploaded yet
                </span>
              )}
            </div>
          </div>
          
          <motion.button
            type="submit"
            disabled={!input.trim() || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              p-3 rounded-xl font-semibold text-white
              bg-gradient-to-r from-primary-500 to-purple-500
              hover:from-primary-600 hover:to-purple-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-300 
              shadow-lg hover:shadow-xl hover:shadow-primary-500/25
              flex items-center gap-2
            `}
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
};

export default ChatInterface;