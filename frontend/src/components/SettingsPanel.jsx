import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Sliders,
  Zap,
  Eye,
  Volume2,
  Moon,
  Sun,
  Info,
  X,
  Brain,
  Cpu,
  AlertCircle,
  CheckCircle2,
  Loader,
  ChevronRight,
  Database,
  Gauge,
  Sparkles,
  Key,
  ExternalLink
} from 'lucide-react';
import { useSettingsStore } from '../store/store';
import toast from 'react-hot-toast';
import { queryAPI } from '../services/api';

const SettingsPanel = ({ isOpen, onClose }) => {
  const {
    maxSources,
    temperature,
    chunkSize,
    scoreThreshold,
    showSources,
    autoScroll,
    soundEnabled,
    selectedLLM,
    gpuEnabled,
    updateSettings,
    resetSettings
  } = useSettingsStore();

  const [localSettings, setLocalSettings] = useState({
    maxSources,
    temperature,
    chunkSize,
    scoreThreshold,
    showSources,
    autoScroll,
    soundEnabled,
    selectedLLM,
    gpuEnabled
  });

  const [llmStatus, setLLMStatus] = useState({});
  const [checkingLLM, setCheckingLLM] = useState(false);

  // Available LLM models
  const llmModels = [
    { 
      id: 'local',
      name: 'Local LLM',
      description: 'GPU accelerated, private',
      icon: Cpu,
      color: 'from-blue-500 to-cyan-500',
      requiresKey: false
    },
    {
      id: 'openai',
      name: 'OpenAI GPT',
      description: 'Most capable, cloud-based',
      icon: Brain,
      color: 'from-green-500 to-emerald-500',
      requiresKey: true,
      keyName: 'OPENAI_API_KEY'
    },
    {
      id: 'groq',
      name: 'Groq',
      description: 'Fast inference, cloud-based',
      icon: Zap,
      color: 'from-orange-500 to-red-500',
      requiresKey: true,
      keyName: 'GROQ_API_KEY'
    }
  ];

  // Check LLM status on mount
  useEffect(() => {
    if (isOpen) {
      checkLLMStatus();
    }
  }, [isOpen]);

  const checkLLMStatus = async () => {
    setCheckingLLM(true);
    try {
      const response = await queryAPI.getServiceStatus();
      if (response?.llm_service) {
        const status = {};
        
        // Check each LLM availability
        if (response.llm_service.local_llm?.available) {
          status.local = { available: true, model: response.llm_service.local_llm.model };
        }
        if (response.llm_service.openai_llm?.available) {
          status.openai = { available: true, model: response.llm_service.openai_llm.model };
        }
        if (response.llm_service.groq_llm?.available) {
          status.groq = { available: true, model: response.llm_service.groq_llm.model };
        }
        
        setLLMStatus(status);
        
        // Update selected LLM if current one is not available
        if (!status[localSettings.selectedLLM]?.available) {
          const firstAvailable = Object.keys(status).find(key => status[key]?.available);
          if (firstAvailable) {
            updateLocalSetting('selectedLLM', firstAvailable);
            toast.error(`${localSettings.selectedLLM} not available, switched to ${firstAvailable}`);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to check LLM status');
    } finally {
      setCheckingLLM(false);
    }
  };

  const updateLocalSetting = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    updateSettings(localSettings);
    
    // Save to localStorage
    localStorage.setItem('documind-settings', JSON.stringify(localSettings));
    
    toast.success('Settings saved successfully!', {
      icon: '✨',
      style: {
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        color: '#fff',
      }
    });
    
    onClose();
  };

  const handleReset = () => {
    const defaultSettings = {
      maxSources: 5,
      temperature: 0.3,
      chunkSize: 1000,
      scoreThreshold: 0.3,
      showSources: true,
      autoScroll: true,
      soundEnabled: false,
      selectedLLM: 'local',
      gpuEnabled: true
    };
    
    resetSettings();
    setLocalSettings(defaultSettings);
    localStorage.removeItem('documind-settings');
    toast.success('Settings reset to defaults');
  };

  // Custom slider component with visual feedback
  const CustomSlider = ({ label, value, onChange, min, max, step, icon: Icon, color, description }) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${color}`}>
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-200">{label}</label>
            {description && (
              <p className="text-xs text-gray-400">{description}</p>
            )}
          </div>
        </div>
        <span className={`text-sm font-bold px-3 py-1 rounded-lg bg-gradient-to-r ${color} bg-opacity-20`}>
          {value}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, var(--tw-gradient-from) 0%, var(--tw-gradient-from) ${((value - min) / (max - min)) * 100}%, rgba(255, 255, 255, 0.1) ${((value - min) / (max - min)) * 100}%, rgba(255, 255, 255, 0.1) 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Settings Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md glass-morphism border-l border-white/10 z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 glass-morphism border-b border-white/10 p-6 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 180 }}
                    transition={{ duration: 0.5 }}
                    className="relative"
                  >
                    <SettingsIcon className="w-8 h-8 text-primary-400" />
                    <div className="absolute inset-0 blur-md bg-primary-400/50"></div>
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-bold gradient-text">Settings</h2>
                    <p className="text-xs text-gray-400">Customize your experience</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* LLM Selection */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold">Language Model</h3>
                  {checkingLLM && <Loader className="w-4 h-4 animate-spin text-gray-400" />}
                </div>
                
                <div className="space-y-3">
                  {llmModels.map((model) => {
                    const Icon = model.icon;
                    const isAvailable = llmStatus[model.id]?.available;
                    const isSelected = localSettings.selectedLLM === model.id;
                    
                    return (
                      <motion.button
                        key={model.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (isAvailable) {
                            updateLocalSetting('selectedLLM', model.id);
                          } else {
                            toast.error(`${model.name} is not available. ${model.requiresKey ? 'API key required.' : 'Check backend configuration.'}`);
                          }
                        }}
                        className={`
                          w-full p-4 rounded-xl border transition-all
                          ${isSelected 
                            ? 'glass-morphism border-primary-400/50' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }
                          ${!isAvailable ? 'opacity-50' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${model.color}`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium flex items-center gap-2">
                                {model.name}
                                {isSelected && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                              </p>
                              <p className="text-xs text-gray-400">{model.description}</p>
                              {isAvailable && llmStatus[model.id]?.model && (
                                <p className="text-xs text-primary-400 mt-1">
                                  Model: {llmStatus[model.id].model}
                                </p>
                              )}
                            </div>
                          </div>
                          {!isAvailable && (
                            <AlertCircle className="w-5 h-5 text-yellow-400" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
                
                <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-xs text-yellow-400 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    API keys should be configured in backend environment
                  </p>
                </div>
              </motion.div>

              {/* Query Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sliders className="w-5 h-5 text-orange-400" />
                  <h3 className="text-lg font-semibold">Query Settings</h3>
                </div>
                
                <div className="space-y-6">
                  <CustomSlider
                    label="Maximum Sources"
                    value={localSettings.maxSources}
                    onChange={(value) => updateLocalSetting('maxSources', Math.round(value))}
                    min={1}
                    max={10}
                    step={1}
                    icon={Database}
                    color="from-blue-500 to-cyan-500"
                    description="Number of document chunks to include"
                  />
                  
                  <CustomSlider
                    label="Temperature"
                    value={localSettings.temperature}
                    onChange={(value) => updateLocalSetting('temperature', value)}
                    min={0}
                    max={1}
                    step={0.1}
                    icon={Gauge}
                    color="from-orange-500 to-red-500"
                    description="0 = Focused, 1 = Creative"
                  />
                  
                  <CustomSlider
                    label="Similarity Threshold"
                    value={localSettings.scoreThreshold}
                    onChange={(value) => updateLocalSetting('scoreThreshold', value)}
                    min={0}
                    max={1}
                    step={0.1}
                    icon={Sparkles}
                    color="from-purple-500 to-pink-500"
                    description="Minimum relevance score"
                  />
                </div>
              </motion.div>

              {/* Advanced Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold">Performance</h3>
                </div>
                
                <div className="space-y-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-4 glass-morphism rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <div>
                        <p className="text-sm font-medium">GPU Acceleration</p>
                        <p className="text-xs text-gray-400">Use NVIDIA GPU for faster processing</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.gpuEnabled}
                        onChange={(e) => updateLocalSetting('gpuEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-green-500 peer-checked:to-emerald-500"></div>
                    </label>
                  </motion.div>
                </div>
              </motion.div>

              {/* UI Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold">Interface</h3>
                </div>
                
                <div className="space-y-4">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-4 glass-morphism rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Info className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-sm font-medium">Show Sources</p>
                        <p className="text-xs text-gray-400">Display source references in answers</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.showSources}
                        onChange={(e) => updateLocalSetting('showSources', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-500 peer-checked:to-cyan-500"></div>
                    </label>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-4 glass-morphism rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <Volume2 className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-sm font-medium">Sound Effects</p>
                        <p className="text-xs text-gray-400">Play sounds for notifications</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.soundEnabled}
                        onChange={(e) => updateLocalSetting('soundEnabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500"></div>
                    </label>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 glass-morphism border-t border-white/10 p-6">
              <div className="flex items-center justify-between gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </motion.button>
                
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-500/25 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    Save Settings
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;