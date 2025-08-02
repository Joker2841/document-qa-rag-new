import React, { useCallback, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  File, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Sparkles,
  Zap,
  Cloud,
  HardDrive,
  FileCode,
  Loader,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/store';
import { utils } from '../services/api';

const DocumentUpload = () => {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  
  const { 
    uploadDocuments, 
    isUploading, 
    uploadProgress,
    documents 
  } = useAppStore();

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    rejectedFiles.forEach((fileRejection) => {
      const { file, errors } = fileRejection;
      errors.forEach((error) => {
        if (error.code === 'file-too-large') {
          toast.error(`File "${file.name}" is too large. Maximum size is 50MB.`);
        } else if (error.code === 'file-invalid-type') {
          toast.error(`File "${file.name}" has unsupported format.`);
        }
      });
    });

    // Validate and add accepted files
    const validFiles = [];
    acceptedFiles.forEach((file) => {
      try {
        utils.validateFile(file);
        validFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
          status: 'pending',
          progress: 0
        });
      } catch (error) {
        toast.error(error.message);
      }
    });

    setFiles(prev => [...prev, ...validFiles]);
    
    // Auto-upload if enabled
    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} file${validFiles.length > 1 ? 's' : ''} ready to upload`, {
        icon: '📁',
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
      'text/html': ['.html'],
      'text/markdown': ['.md']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    toast.success('File removed', { icon: '🗑️' });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading('Initializing upload...');

    try {
      // Update file statuses to uploading
      setFiles(prev => prev.map(f => ({ ...f, status: 'uploading', progress: 0 })));

      const filesToUpload = files.map(f => f.file);
      await uploadDocuments(filesToUpload);
      
      // Update file statuses to completed
      setFiles(prev => prev.map(f => ({ ...f, status: 'completed', progress: 100 })));
      
      toast.success(`Successfully uploaded ${files.length} document${files.length > 1 ? 's' : ''}!`, {
        id: toastId,
        icon: '🚀',
      });
      
      // Clear files after delay
      setTimeout(() => {
        setFiles([]);
        setIsProcessing(false);
      }, 2000);
      
    } catch (error) {
      toast.error('Upload failed. Please try again.', { id: toastId });
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
      setIsProcessing(false);
    }
  };

  const getFileIcon = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    const iconProps = { className: "w-5 h-5" };
    
    switch (extension) {
      case 'pdf':
        return <FileText {...iconProps} className="w-5 h-5 text-red-400" />;
      case 'doc':
      case 'docx':
        return <FileText {...iconProps} className="w-5 h-5 text-blue-400" />;
      case 'txt':
        return <File {...iconProps} className="w-5 h-5 text-gray-400" />;
      case 'md':
        return <FileCode {...iconProps} className="w-5 h-5 text-purple-400" />;
      case 'html':
        return <FileCode {...iconProps} className="w-5 h-5 text-orange-400" />;
      default:
        return <File {...iconProps} className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-4xl font-bold font-display gradient-text mb-4">
          Upload Your Documents
        </h2>
        <p className="text-gray-400 text-lg">
          Transform your documents into an intelligent knowledge base
        </p>
      </motion.div>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-8"
      >
        <div className="glass-card text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <HardDrive className="w-5 h-5 text-blue-400" />
            <span className="text-2xl font-bold">{documents.length}</span>
          </div>
          <p className="text-sm text-gray-400">Documents Stored</p>
        </div>
        <div className="glass-card text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-2xl font-bold">
              {documents.reduce((acc, doc) => acc + (doc.chunks_created || 0), 0)}
            </span>
          </div>
          <p className="text-sm text-gray-400">Vector Chunks</p>
        </div>
        <div className="glass-card text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Cloud className="w-5 h-5 text-green-400" />
            <span className="text-2xl font-bold">
              {formatFileSize(documents.reduce((acc, doc) => acc + (doc.char_count || 0), 0))}
            </span>
          </div>
          <p className="text-sm text-gray-400">Data Processed</p>
        </div>
      </motion.div>

      {/* Main Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div
          {...getRootProps()}
          className={`
            relative overflow-hidden rounded-2xl border-2 border-dashed 
            transition-all duration-300 cursor-pointer
            ${isDragActive 
              ? 'border-primary-400 bg-primary-400/10 scale-105' 
              : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
            }
            ${isDragReject ? 'border-red-400 bg-red-400/10' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-400/20 via-transparent to-purple-400/20"></div>
            <motion.div
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
              className="absolute inset-0"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                backgroundSize: '60px 60px',
              }}
            />
          </div>
          
          <div className="relative z-10 p-12 text-center">
            <motion.div
              animate={{
                y: isDragActive ? -10 : 0,
                scale: isDragActive ? 1.1 : 1,
              }}
              transition={{ type: "spring", stiffness: 300 }}
              className="mb-6"
            >
              <div className="relative inline-block">
                <Upload className="w-16 h-16 text-primary-400 mx-auto" />
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
            </motion.div>
            
            <h3 className="text-xl font-semibold mb-2">
              {isDragActive ? 'Drop your files here' : 'Drag & drop your documents'}
            </h3>
            <p className="text-gray-400 mb-4">
              or <button 
                className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                browse files
              </button>
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF, Word, TXT, HTML, and Markdown files up to 50MB
            </p>
          </div>
        </div>
      </motion.div>

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-3"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Ready to Upload ({files.length} file{files.length > 1 ? 's' : ''})
              </h3>
              <button
                onClick={() => setFiles([])}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear all
              </button>
            </div>
            
            {files.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                      {getFileIcon(file.file)}
                      {file.status === 'uploading' && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0"
                        >
                          <Loader className="w-5 h-5 text-primary-400" />
                        </motion.div>
                      )}
                      {file.status === 'completed' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5"
                        >
                          <CheckCircle className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                      {file.status === 'error' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5"
                        >
                          <AlertCircle className="w-3 h-3 text-white" />
                        </motion.div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.file.name}</p>
                      <p className="text-sm text-gray-400">
                        {formatFileSize(file.file.size)}
                        {file.status === 'uploading' && ` • ${file.progress}%`}
                        {file.status === 'completed' && ' • Uploaded'}
                        {file.status === 'error' && ' • Failed'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    disabled={file.status === 'uploading'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Progress Bar */}
                {file.status === 'uploading' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3"
                  >
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${file.progress}%` }}
                        className="h-full bg-gradient-to-r from-primary-400 to-purple-400"
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
            
            {/* Upload Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpload}
              disabled={isProcessing || files.length === 0}
              className={`
                w-full py-4 rounded-xl font-semibold text-white
                bg-gradient-to-r from-primary-500 to-purple-500
                hover:from-primary-600 hover:to-purple-600
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-300 flex items-center justify-center gap-3
                shadow-lg hover:shadow-xl hover:shadow-primary-500/25
              `}
            >
              {isProcessing ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Processing Documents...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Upload & Process Documents
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="glass-card rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h4 className="font-semibold mb-2">GPU Accelerated</h4>
          <p className="text-sm text-gray-400">
            Lightning-fast processing with RTX 4050 GPU acceleration
          </p>
        </div>
        
        <div className="glass-card rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h4 className="font-semibold mb-2">Smart Chunking</h4>
          <p className="text-sm text-gray-400">
            Intelligent document splitting for optimal retrieval
          </p>
        </div>
        
        <div className="glass-card rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <h4 className="font-semibold mb-2">Multiple Formats</h4>
          <p className="text-sm text-gray-400">
            Support for PDF, Word, Text, HTML, and Markdown files
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default DocumentUpload;