import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { 
  Menu, 
  X, 
  Upload, 
  MessageSquare, 
  FileText, 
  BarChart3,
  Settings,
  Zap,
  Brain,
  Search
} from 'lucide-react';

import { useAppStore } from './store/store';
import DocumentUpload from './components/DocumentUpload';
import ChatInterface from './components/ChatInterface';
import DocumentList from './components/DocumentList';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import SettingsPanel from './components/SettingsPanel';
import LoadingScreen from './components/LoadingScreen';

console.log("App rendered")
const App = () => {
//   const [isInitialized, setIsInitialized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    activeTab,
    setActiveTab,
    sidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    initialize,
    documents,
    selectedDocuments,
    currentAnswer,
    isLoading,
    isInitialized
  } = useAppStore();

  // Initialize the app
  useEffect(() => {
  initialize();
}, [initialize]);


  // Close sidebar on mobile when tab changes
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [activeTab, setSidebarOpen]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  const navItems = [
    {
      id: 'upload',
      label: 'Upload',
      icon: Upload,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Add new documents'
    },
    {
      id: 'chat',
      label: 'Ask Questions',
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Chat with your documents',
      disabled: documents.length === 0
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Manage your files',
      badge: documents.length
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: 'Usage insights'
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
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Mobile overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            
            {/* Sidebar content */}
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed md:relative z-50 w-80 h-full bg-white shadow-xl flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">DocuMind</h1>
                      <p className="text-sm text-gray-500">AI Document Q&A</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
                    <div className="text-xs text-blue-600">Documents</div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{selectedDocuments.length}</div>
                    <div className="text-xs text-green-600">Selected</div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const isDisabled = item.disabled;

                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => !isDisabled && setActiveTab(item.id)}
                      disabled={isDisabled}
                      whileHover={!isDisabled ? { scale: 1.02 } : {}}
                      whileTap={!isDisabled ? { scale: 0.98 } : {}}
                      className={`
                        w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-200
                        ${isActive
                          ? `${item.bgColor} ${item.color} shadow-md`
                          : isDisabled
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs opacity-75">{item.description}</div>
                      </div>
                      {item.badge !== undefined && (
                        <span className={`
                          px-2 py-1 text-xs font-medium rounded-full
                          ${isActive 
                            ? 'bg-white bg-opacity-50' 
                            : 'bg-gray-200 text-gray-600'
                          }
                        `}>
                          {item.badge}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => setShowSettings(true)}
                  className="w-full flex items-center gap-3 p-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
                
                <div className="mt-3 p-3 bg-gradient-to-r from-primary-50 to-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 text-primary-700 text-sm font-medium">
                    <Zap className="w-4 h-4" />
                    <span>GPU Accelerated</span>
                  </div>
                  <div className="text-xs text-primary-600 mt-1">
                    RTX 4050 Ready
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="hidden sm:block">
              <h2 className="text-lg font-semibold text-gray-900">
                {navItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h2>
              <p className="text-sm text-gray-500">
                {navItems.find(item => item.id === activeTab)?.description}
              </p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-3">
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                Processing...
              </motion.div>
            )}
            
            {currentAnswer && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm"
              >
                <Search className="w-4 h-4" />
                Answer Ready
              </motion.div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
      
      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e5e7eb',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default App;