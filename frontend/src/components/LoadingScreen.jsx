import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, FileText, MessageSquare } from 'lucide-react';

const LoadingScreen = () => {
  const floatingIcons = [
    { icon: Brain, delay: 0, color: 'text-primary-500' },
    { icon: FileText, delay: 0.2, color: 'text-purple-500' },
    { icon: MessageSquare, delay: 0.4, color: 'text-green-500' },
    { icon: Zap, delay: 0.6, color: 'text-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        {/* Main Logo Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20,
            duration: 1.2 
          }}
          className="relative mb-8"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <Brain className="w-12 h-12 text-white" />
          </div>
          
          {/* Floating Icons */}
          <div className="absolute inset-0 w-48 h-48 -m-12">
            {floatingIcons.map((item, index) => {
              const Icon = item.icon;
              const angle = (index * 90) * (Math.PI / 180);
              const radius = 60;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <motion.div
                  key={index}
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    x: 0,
                    y: 0
                  }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    x: x,
                    y: y
                  }}
                  transition={{ 
                    delay: item.delay,
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                  }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <motion.div
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className={`w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center ${item.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Title Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent mb-2">
            DocuMind
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-Powered Document Intelligence
          </p>
        </motion.div>

        {/* Loading Progress */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="w-64 mx-auto"
        >
          {/* Progress Bar */}
          <div className="bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ 
                delay: 1.5,
                duration: 2,
                ease: "easeInOut"
              }}
              className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"
            />
          </div>

          {/* Loading Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="text-sm text-gray-500"
          >
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              Initializing AI systems...
            </motion.span>
           </motion.div>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.8 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto"
        >
          {[
            {
              icon: FileText,
              title: "Smart Upload",
              desc: "Multiple formats supported"
            },
            {
              icon: Brain,
              title: "AI Analysis",
              desc: "GPU-accelerated processing"
            },
            {
              icon: MessageSquare,
              title: "Natural Chat",
              desc: "Ask questions in plain English"
            }
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 2.2 + index * 0.1 }}
                className="text-center p-4"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-gray-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Version Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          className="mt-8 text-xs text-gray-400"
        >
          v1.0.0 • RTX 4050 Optimized
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingScreen;