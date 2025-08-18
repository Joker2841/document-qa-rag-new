import React, { useState, useEffect } from 'react';
import { Cpu, Zap, TrendingUp, Award, Globe, Server } from 'lucide-react';
import { motion } from 'framer-motion';

const PerformanceShowcase = () => {
  const [systemInfo, setSystemInfo] = useState(null);
  
  useEffect(() => {
    // Fetch system capabilities
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/system/capabilities`)
      .then(res => res.json())
      .then(data => setSystemInfo(data))
      .catch(err => console.error(err));
  }, []);

  const metrics = {
    gpu: {
      embedding: "85ms",
      vectorSearch: "8ms", 
      totalQuery: "312ms",
      docsPerMin: "120",
      hardware: "NVIDIA RTX 4050 (6GB VRAM)",
      status: "Local Development"
    },
    cpu: {
      embedding: "2.1s",
      vectorSearch: "145ms",
      totalQuery: "3.8s",
      docsPerMin: "8-10",
      hardware: "Cloud CPU (Railway)",
      status: "Live Deployment"
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Award className="w-8 h-8 text-yellow-400" />
          <h2 className="text-2xl font-bold">System Performance</h2>
        </div>
        
        {systemInfo && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10">
            {systemInfo.gpu.cuda_available ? (
              <>
                <Zap className="w-4 h-4 text-green-400" />
                <span className="text-sm text-green-400">GPU Mode</span>
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400">Cloud Mode</span>
              </>
            )}
          </div>
        )}
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* GPU Performance Card */}
        <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">GPU-Accelerated Mode</h3>
              <p className="text-sm text-gray-400">{metrics.gpu.hardware}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Embedding Generation:</span>
              <span className="text-green-400 font-mono font-bold">{metrics.gpu.embedding}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Vector Search:</span>
              <span className="text-green-400 font-mono font-bold">{metrics.gpu.vectorSearch}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Query Time:</span>
              <span className="text-green-400 font-mono font-bold">{metrics.gpu.totalQuery}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Documents/min:</span>
              <span className="text-green-400 font-mono font-bold">{metrics.gpu.docsPerMin}</span>
            </div>
          </div>
          
          <div className="p-3 bg-green-500/10 rounded-lg">
            <p className="text-sm text-green-300">
              ⚡ 12-25x faster with CUDA 11.8 acceleration
            </p>
          </div>
        </div>

        {/* CPU Performance Card */}
        <div className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Globe className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Cloud CPU Mode</h3>
              <p className="text-sm text-gray-400">{metrics.cpu.hardware}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Embedding Generation:</span>
              <span className="text-blue-400 font-mono">{metrics.cpu.embedding}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Vector Search:</span>
              <span className="text-blue-400 font-mono">{metrics.cpu.vectorSearch}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Query Time:</span>
              <span className="text-blue-400 font-mono">{metrics.cpu.totalQuery}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Documents/min:</span>
              <span className="text-blue-400 font-mono">{metrics.cpu.docsPerMin}</span>
            </div>
          </div>
          
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <p className="text-sm text-blue-300">
              💰 Cost-optimized for free cloud deployment
            </p>
          </div>
        </div>
      </div>
      
      {systemInfo && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg">
          <h4 className="font-semibold mb-2">Current System Details:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Environment:</span>
              <span className="ml-2">{systemInfo.model.environment}</span>
            </div>
            <div>
              <span className="text-gray-400">Model:</span>
              <span className="ml-2">{systemInfo.model.embedding_model.split('/')[1]}</span>
            </div>
            {systemInfo.gpu.cuda_available && (
              <>
                <div>
                  <span className="text-gray-400">GPU:</span>
                  <span className="ml-2">{systemInfo.gpu.gpu_name}</span>
                </div>
                <div>
                  <span className="text-gray-400">CUDA:</span>
                  <span className="ml-2">{systemInfo.gpu.cuda_version}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      <div className="mt-4 flex gap-4">
        <a 
          href="https://github.com/Joker2841/document-qa-rag-new" 
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          <Server className="w-4 h-4" />
          View Source Code
        </a>
      </div>
    </motion.div>
  );
};

export default PerformanceShowcase;