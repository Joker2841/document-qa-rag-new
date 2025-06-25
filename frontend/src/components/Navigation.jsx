import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Settings, 
  Menu,
  X,
  Zap,
  Brain,
  Database,
  ChevronRight,
  Sparkles,
  Activity,
  Clock,
  TrendingUp
} from 'lucide-react';

// Mock store for demonstration
const useAppStore = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [documents] = useState([
    { id: 1, name: 'Report.pdf', size: '2.4MB' },
    { id: 2, name: 'Analysis.docx', size: '1.8MB' },
    { id: 3, name: 'Data.xlsx', size: '3.2MB' }
  ]);
  const [queryHistory] = useState([
    { id: 1, query: 'What is the main conclusion?', timestamp: Date.now() },
    { id: 2, query: 'Summarize key findings', timestamp: Date.now() - 3600000 },
    { id: 3, query: 'Extract financial data', timestamp: Date.now() - 7200000 }
  ]);

  return {
    activeTab,
    setActiveTab,
    sidebarOpen,
    setSidebarOpen,
    documents,
    queryHistory
  };
};

const Navigation = () => {
  const { 
    activeTab, 
    setActiveTab, 
    sidebarOpen, 
    setSidebarOpen,
    documents,
    queryHistory
  } = useAppStore();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    {
      id: 'upload',
      label: 'Upload',
      icon: Upload,
      description: 'Add documents & files',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-blue-600',
      count: null,
      badge: null
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageSquare,
      description: 'AI-powered conversations',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-emerald-600',
      count: queryHistory.length > 0 ? queryHistory.length : null,
      badge: queryHistory.length > 5 ? 'hot' : null
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      description: 'Manage your library',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-purple-600',
      count: documents.length > 0 ? documents.length : null,
      badge: null
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Insights & reports',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      gradientFrom: 'from-orange-500',
      gradientTo: 'to-orange-600',
      count: null,
      badge: 'new'
    }
  ];

  const NavItem = ({ item, isActive, onClick }) => (
    <div className="group relative">
      <button
        onClick={onClick}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300
          transform hover:scale-[1.02] hover:shadow-lg
          ${isActive 
            ? `${item.bgColor} ${item.color} shadow-lg shadow-${item.color.split('-')[1]}-500/20 border border-${item.color.split('-')[1]}-200` 
            : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-md border border-transparent'
          }
        `}
      >
        <div className={`
          relative p-2.5 rounded-xl transition-all duration-300
          ${isActive 
            ? `bg-gradient-to-br ${item.gradientFrom} ${item.gradientTo} text-white shadow-md` 
            : 'text-gray-400 bg-gray-100 group-hover:bg-gray-200'
          }
        `}>
          <item.icon className="w-4 h-4" />
          {isActive && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            </div>
          )}
        </div>
        
        {sidebarOpen && (
          <div className="flex-1 text-left">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">
                {item.label}
              </span>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className={`
                    px-2 py-0.5 text-xs rounded-full font-medium uppercase tracking-wide
                    ${item.badge === 'new' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : ''}
                    ${item.badge === 'hot' ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white animate-pulse' : ''}
                  `}>
                    {item.badge}
                  </span>
                )}
                {item.count && (
                  <span className={`
                    px-2.5 py-1 text-xs rounded-full font-bold
                    ${isActive 
                      ? 'bg-white text-gray-700 shadow-sm' 
                      : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                    }
                  `}>
                    {item.count}
                  </span>
                )}
                {!isActive && (
                  <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                )}
              </div>
            </div>
            <p className="text-xs opacity-75 mt-1 leading-relaxed">
              {item.description}
            </p>
          </div>
        )}
      </button>
      
      {/* Tooltip for collapsed state */}
      {!sidebarOpen && (
        <div className="absolute left-full ml-4 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap">
          {item.label}
          <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-4 border-transparent border-r-gray-900" />
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-full bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 z-50
          flex flex-col shadow-2xl lg:shadow-xl transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-80' : 'w-20'}
        `}
      >
        {/* Header */}
        <div className="p-6 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            {sidebarOpen ? (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                    <Brain className="w-7 h-7 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="font-bold text-gray-900 text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    DocuMind
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">
                    AI Document Intelligence
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <Brain className="w-7 h-7 text-white" />
              </div>
            )}
            
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:scale-105 lg:hidden"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 1024) {
                  setSidebarOpen(false);
                }
              }}
            />
          ))}
        </div>

        {/* Status Section */}
        <div className="p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          {sidebarOpen ? (
            <div className="space-y-4">
              {/* Live Status */}
              <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <Activity className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    System Status
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <div className="text-blue-600 font-bold text-lg">{documents.length}</div>
                    <div className="text-blue-600 font-medium">Documents</div>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <div className="text-emerald-600 font-bold text-lg">{queryHistory.length}</div>
                    <div className="text-emerald-600 font-medium">Queries</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-full flex items-center justify-center gap-2 p-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-white rounded-xl transition-all duration-200"
                >
                  <Menu className="w-4 h-4" />
                  <span className="font-medium">Collapse Sidebar</span>
                </button>
                
                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-3 rounded-xl hover:bg-white hover:shadow-md transition-all duration-200 hover:scale-105 group"
                title="Expand sidebar"
              >
                <Menu className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
              </button>
              
              {/* Compact status indicators */}
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} title="System status" />
                  {isOnline && <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75" />}
                </div>
                {documents.length > 0 && (
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full" title={`${documents.length} documents`} />
                )}
                {queryHistory.length > 0 && (
                  <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full" title={`${queryHistory.length} queries`} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu button (when sidebar is closed) */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-6 left-6 z-40 p-4 bg-white rounded-2xl shadow-xl border border-gray-200 lg:hidden hover:scale-105 transition-transform duration-200"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
      )}
    </>
  );
};

export default Navigation;