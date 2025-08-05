import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {(!isOnline || showReconnected) && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={`
            fixed top-0 left-0 right-0 z-50 py-3 px-4
            ${isOnline 
              ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-b border-green-500/30' 
              : 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-red-500/30'
            }
            backdrop-blur-md
          `}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
            <motion.div
              animate={{ rotate: isOnline ? 0 : 360 }}
              transition={{ duration: 1, repeat: isOnline ? 0 : Infinity, ease: "linear" }}
            >
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-400" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-400" />
              )}
            </motion.div>
            
            <span className={`text-sm font-medium ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
              {isOnline ? 'Back online!' : 'You\'re offline - Some features may be limited'}
            </span>
            
            {!isOnline && (
              <button
                onClick={() => window.location.reload()}
                className="ml-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;