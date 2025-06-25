import React, { useState } from 'react';
import { motion } from 'framer-motion';
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
  Info
} from 'lucide-react';
import { useSettingsStore } from '../store/store';
import toast from 'react-hot-toast';

const Settings = ({ isOpen, onClose }) => {
  const {
    maxSources,
    temperature,
    chunkSize,
    theme,
    showSources,
    autoScroll,
    soundEnabled,
    updateSettings,
    resetSettings
  } = useSettingsStore();

  const [localSettings, setLocalSettings] = useState({
    maxSources,
    temperature,
    chunkSize,
    theme,
    showSources,
    autoScroll,
    soundEnabled
  });

  const handleSave = () => {
    updateSettings(localSettings);
    toast.success('Settings saved successfully!');
    onClose();
  };

  const handleReset = () => {
    resetSettings();
    setLocalSettings({
      maxSources: 3,
      temperature: 0.7,
      chunkSize: 1000,
      theme: 'light',
      showSources: true,
      autoScroll: true,
      soundEnabled: false
    });
    toast.success('Settings reset to defaults');
  };

  const updateLocalSetting = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
              <p className="text-sm text-gray-500">Customize your RAG experience</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <SettingsIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Query Settings */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900">Query Settings</h3>
            </div>
            
            <div className="space-y-6">
              {/* Max Sources */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Maximum Sources
                  </label>
                  <span className="text-sm text-primary-600 font-medium">
                    {localSettings.maxSources}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={localSettings.maxSources}
                  onChange={(e) => updateLocalSetting('maxSources', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>10</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Number of source chunks to include in responses
                </p>
              </div>

              {/* Temperature */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Temperature
                  </label>
                  <span className="text-sm text-primary-600 font-medium">
                    {localSettings.temperature}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localSettings.temperature}
                  onChange={(e) => updateLocalSetting('temperature', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.0 (Focused)</span>
                  <span>1.0 (Creative)</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Controls randomness in responses. Lower = more focused, Higher = more creative
                </p>
              </div>

              {/* Chunk Size */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Chunk Size
                  </label>
                  <span className="text-sm text-primary-600 font-medium">
                    {localSettings.chunkSize}
                  </span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="2000"
                  step="100"
                  value={localSettings.chunkSize}
                  onChange={(e) => updateLocalSetting('chunkSize', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>500</span>
                  <span>2000</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Size of text chunks for processing (requires re-upload)
                </p>
              </div>
            </div>
          </div>

          {/* UI Settings */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">Interface</h3>
            </div>
            
            <div className="space-y-4">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {localSettings.theme === 'light' ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-blue-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">Theme</p>
                    <p className="text-xs text-gray-500">Choose your preferred appearance</p>
                  </div>
                </div>
                <select
                  value={localSettings.theme}
                  onChange={(e) => updateLocalSetting('theme', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>

              {/* Show Sources */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Show Sources</p>
                    <p className="text-xs text-gray-500">Display source references in answers</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.showSources}
                    onChange={(e) => updateLocalSetting('showSources', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {/* Auto Scroll */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sliders className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Auto Scroll</p>
                    <p className="text-xs text-gray-500">Automatically scroll to new responses</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.autoScroll}
                    onChange={(e) => updateLocalSetting('autoScroll', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              {/* Sound */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Sound Effects</p>
                    <p className="text-xs text-gray-500">Play sounds for notifications</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.soundEnabled}
                    onChange={(e) => updateLocalSetting('soundEnabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Settings
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Settings;