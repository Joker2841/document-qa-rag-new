import React, { useState, useEffect, lazy, Suspense } from 'react';
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
  Cpu,
  Settings,
  Loader
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAppStore, useSettingsStore } from './store/store';
import OfflineIndicator from './components/OfflineIndicator';
import { useRegisterSW } from 'virtual:pwa-register/react';

// Eager load critical components
import DocumentUpload from './components/DocumentUpload';
import ChatInterface from './components/ChatInterface';

// Lazy load non-critical components
const DocumentList = lazy(() => 
  import('./components/DocumentList' /* webpackChunkName: "documents" */)
);
const AnalyticsDashboard = lazy(() => 
  import('./components/AnalyticsDashboard' /* webpackChunkName: "analytics" */)
);
const SettingsPanel = lazy(() => 
  import('./components/SettingsPanel' /* webpackChunkName: "settings" */)
);

// Loading component with glass morphism
const ComponentLoader = ({ name }) => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-2xl p-8 text-center"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-16 h-16 mx-auto mb-4"
      >
        <Loader className="w-full h-full text-primary-400" />
      </motion.div>
      <p className="text-gray-400">Loading {name}...</p>
    </motion.div>
  </div>
);

// Preload components on hover for better UX
const preloadComponent = (componentName) => {
  switch(componentName) {
    case 'documents':
      import('./components/DocumentList' /* webpackChunkName: "documents" */);
      break;
    case 'analytics':
      import('./components/AnalyticsDashboard' /* webpackChunkName: "analytics" */);
      break;
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false); // Add this state
  const { documents, initialize } = useAppStore();
  const { loadSettings } = useSettingsStore();

  // Initialize app
  useEffect(() => {
    loadSettings();
    initialize();
    
    // Measure performance
    if ('performance' in window) {
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0];
        console.log('App Performance:', {
          domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
          loadComplete: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
          totalTime: Math.round(perfData.loadEventEnd - perfData.fetchStart)
        });
      });
    }
  }, []);

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
      glow: 'hover:shadow-purple-500/25',
      onHover: () => preloadComponent('documents') // Preload on hover
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      color: 'from-orange-500 to-red-500',
      description: 'View insights',
      glow: 'hover:shadow-orange-500/25',
      onHover: () => preloadComponent('analytics') // Preload on hover
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <DocumentUpload />;
      case 'chat':
        return <ChatInterface />;
      case 'documents':
        return (
          <Suspense fallback={<ComponentLoader name="Documents" />}>
            <DocumentList />
          </Suspense>
        );
      case 'analytics':
        return (
          <Suspense fallback={<ComponentLoader name="Analytics" />}>
            <AnalyticsDashboard />
          </Suspense>
        );
      default:
        return <DocumentUpload />;
    }
  };

  // PWA update prompt
const {
  needRefresh: [needRefresh, setNeedRefresh],
  updateServiceWorker,
} = useRegisterSW({
  onRegistered(r) {
    console.log('Service Worker registered:', r);
  },
  onRegisterError(error) {
    console.error('Service Worker registration error:', error);
  },
});

// Install prompt
const [installPrompt, setInstallPrompt] = useState(null);
const [showInstallBanner, setShowInstallBanner] = useState(false);

useEffect(() => {
  const handleBeforeInstallPrompt = (e) => {
    e.preventDefault();
    setInstallPrompt(e);
    // Show banner after 30 seconds
    setTimeout(() => setShowInstallBanner(true), 30000);
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  
  return () => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  };
}, []);

const handleInstall = async () => {
  if (!installPrompt) return;
  
  installPrompt.prompt();
  const { outcome } = await installPrompt.userChoice;
  
  if (outcome === 'accepted') {
    toast.success('App installed successfully!', { icon: '🚀' });
  }
  
  setInstallPrompt(null);
  setShowInstallBanner(false);
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
                            onMouseEnter={item.onHover} // Trigger preload
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
          {/* Top Bar - UPDATE THIS SECTION */}
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
              
              {/* Right side of header */}
              <div className="flex items-center gap-4">
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
                
                {/* Settings Button - ADD THIS */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSettingsOpen(true)}
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all relative group"
                >
                  <Settings className="w-5 h-5" />
                  <span className="absolute -bottom-8 right-0 text-xs bg-gray-900 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Settings
                  </span>
                </motion.button>
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

      {/* Settings Panel - Lazy loaded */}
      <Suspense fallback={null}>
        <SettingsPanel 
          isOpen={settingsOpen} 
          onClose={() => setSettingsOpen(false)} 
        />
      </Suspense>

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

      <OfflineIndicator />

      {/* PWA Update Banner */}
      {needRefresh && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 glass-morphism rounded-xl p-4 z-50 border border-white/20"
        >
          <p className="text-sm mb-3">New version available! 🎉</p>
          <div className="flex gap-3">
            <button
              onClick={() => updateServiceWorker(true)}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              Update Now
            </button>
            <button
              onClick={() => setNeedRefresh(false)}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Later
            </button>
          </div>
        </motion.div>
      )}

      {/* Install Banner */}
      {showInstallBanner && installPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 glass-morphism rounded-xl p-4 z-50 border border-white/20"
        >
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-1">Install DocuMind AI</h3>
              <p className="text-sm text-gray-400 mb-3">
                Install the app for faster access and offline support
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleInstall}
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                >
                  Install App
                </button>
                <button
                  onClick={() => setShowInstallBanner(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
     
    
  );
}

export default App;