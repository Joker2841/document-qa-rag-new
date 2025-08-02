import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Menu, 
  X, 
  Brain,
  Sparkles,
  Zap,
  Database,
  Cpu
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import DocumentUpload from './components/DocumentUpload';
import ChatInterface from './components/ChatInterface';
import DocumentList from './components/DocumentList';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { useAppStore } from './store/store';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { documents } = useAppStore();

  // Animated background elements
  const BackgroundElements = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000"></div>
    </div>
  );

  const navItems = [
    {
      id: 'upload',
      label: 'Upload',
      icon: Upload,
      color: 'from-blue-500 to-cyan-500',
      description: 'Add new documents',
      glow: 'hover:shadow-blue-500/25'
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageSquare,
      color: 'from-green-500 to-emerald-500',
      description: 'Ask questions',
      disabled: documents.length === 0,
      glow: 'hover:shadow-green-500/25'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      color: 'from-purple-500 to-pink-500',
      description: 'Manage files',
      badge: documents.length,
      glow: 'hover:shadow-purple-500/25'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      color: 'from-orange-500 to-red-500',
      description: 'View insights',
      glow: 'hover:shadow-orange-500/25'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <DocumentUpload />;
      case 'chat':
        return <ChatInterface />;
      case 'documents':
        return <DocumentList />;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return <DocumentUpload />;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text overflow-hidden">
      <BackgroundElements />
      
      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              {/* Mobile overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              
              {/* Sidebar content */}
              <motion.div
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed md:relative z-50 w-80 h-full glass-morphism border-r border-white/10 flex flex-col"
              >
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="relative"
                      >
                        <Brain className="w-10 h-10 text-primary-400" />
                        <div className="absolute inset-0 blur-md bg-primary-400/50"></div>
                      </motion.div>
                      <div>
                        <h1 className="text-2xl font-bold font-display gradient-text">
                          DocuMind AI
                        </h1>
                        <p className="text-xs text-gray-400">Intelligent Document Assistant</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="md:hidden p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* System Status */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="glass-morphism rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                        <Zap className="w-3 h-3" />
                        <span className="text-xs font-medium">GPU Active</span>
                      </div>
                      <p className="text-xs text-gray-400">RTX 4050</p>
                    </div>
                    <div className="glass-morphism rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                        <Database className="w-3 h-3" />
                        <span className="text-xs font-medium">Vector DB</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {documents.reduce((acc, doc) => acc + (doc.chunks_created || 0), 0)} chunks
                      </p>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                  <ul className="space-y-2">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      const isDisabled = item.disabled;
                      
                      return (
                        <motion.li key={item.id}>
                          <button
                            onClick={() => !isDisabled && setActiveTab(item.id)}
                            disabled={isDisabled}
                            className={`
                              w-full group relative overflow-hidden rounded-xl p-4 
                              transition-all duration-300 text-left
                              ${isActive 
                                ? 'glass-morphism border border-white/20' 
                                : 'hover:bg-white/5'
                              }
                              ${isDisabled 
                                ? 'opacity-50 cursor-not-allowed' 
                                : `cursor-pointer ${item.glow} hover:shadow-lg`
                              }
                            `}
                          >
                            {/* Gradient background on active */}
                            {isActive && (
                              <motion.div
                                layoutId="activeTab"
                                className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-10`}
                                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                              />
                            )}
                            
                            <div className="relative z-10 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`
                                  p-2 rounded-lg bg-gradient-to-r ${item.color}
                                  ${isActive ? 'shadow-lg' : 'group-hover:shadow-lg'}
                                  transition-shadow duration-300
                                `}>
                                  <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <h3 className={`font-semibold ${isActive ? 'text-white' : 'text-gray-300'}`}>
                                    {item.label}
                                  </h3>
                                  <p className="text-xs text-gray-500">{item.description}</p>
                                </div>
                              </div>
                              {item.badge !== undefined && (
                                <span className="px-2 py-1 text-xs font-bold bg-white/10 rounded-full">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                          </button>
                        </motion.li>
                      );
                    })}
                  </ul>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-white/10">
                  <div className="glass-morphism rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium">Pro Tip</span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Upload multiple documents to build a comprehensive knowledge base
                    </p>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="glass-morphism border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-semibold font-display">
                  {navItems.find(item => item.id === activeTab)?.label}
                </h2>
              </div>
              
              {/* Performance Metrics Preview */}
              <div className="hidden md:flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Cpu className="w-4 h-4 text-green-400" />
                  <span className="text-gray-400">GPU: Active</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-400">Speed: 0.3s avg</span>
                </div>
              </div>
            </div>
          </header>

          {/* Content Area */}
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      {/* Toast Container */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'glass-morphism',
          style: {
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#e2e8f0',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#e2e8f0',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#e2e8f0',
            },
          },
        }}
      />
    </div>
  );
}

export default App;