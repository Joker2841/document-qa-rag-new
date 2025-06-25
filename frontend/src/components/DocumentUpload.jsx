import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  File, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Download,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/store';
import { utils } from '../services/api';

const DocumentUpload = () => {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  
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
          preview: URL.createObjectURL(file),
          status: 'pending'
        });
      } catch (error) {
        toast.error(error.message);
      }
    });

    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
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
    multiple: true,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    try {
      const filesToUpload = files.map(f => f.file);
      await uploadDocuments(filesToUpload);
      
      // Mark files as uploaded
      setFiles(prev => prev.map(f => ({ ...f, status: 'uploaded' })));
      
      toast.success(`Successfully uploaded ${files.length} document(s)!`);
      
      // Clear files after successful upload
      setTimeout(() => {
        setFiles([]);
      }, 2000);
      
    } catch (error) {
      toast.error('Upload failed. Please try again.');
      setFiles(prev => prev.map(f => ({ ...f, status: 'error' })));
    }
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      case 'docx':
      case 'doc':
        return <File className="w-8 h-8 text-blue-500" />;
      case 'txt':
        return <FileText className="w-8 h-8 text-gray-500" />;
      case 'html':
        return <FileText className="w-8 h-8 text-orange-500" />;
      case 'md':
        return <FileText className="w-8 h-8 text-purple-500" />;
      default:
        return <File className="w-8 h-8 text-gray-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 mb-4"
        >
          <Zap className="w-8 h-8 text-primary-500" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            Document Upload
          </h1>
        </motion.div>
        <p className="text-gray-600 text-lg">
          Upload your documents to start asking questions with AI-powered search
        </p>
      </div>

      {/* Stats */}
      {documents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 mb-6 border border-green-200"
        >
          <div className="flex items-center justify-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">
              {documents.length} document{documents.length !== 1 ? 's' : ''} ready for questions
            </span>
          </div>
        </motion.div>
      )}

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div
          {...getRootProps()}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-300 ease-in-out
            ${isDragActive || dragActive
              ? 'border-primary-400 bg-primary-50 shadow-glow'
              : 'border-gray-300 hover:border-primary-300 hover:bg-gray-50'
            }
            ${isUploading ? 'pointer-events-none opacity-75' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <motion.div
            animate={{
              scale: isDragActive ? 1.05 : 1,
              rotate: isDragActive ? 2 : 0
            }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-4"
          >
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center
              ${isDragActive 
                ? 'bg-primary-100 text-primary-600' 
                : 'bg-gray-100 text-gray-400'
              }
            `}>
              <Upload className="w-8 h-8" />
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-2">
                {isDragActive ? 'Drop files here' : 'Upload Documents'}
              </h3>
              <p className="text-gray-600 mb-2">
                Drag & drop files here, or <span className="text-primary-600 font-medium">browse</span>
              </p>
              <p className="text-sm text-gray-500">
                Supports: PDF, Word (.docx, .doc), Text (.txt), HTML, Markdown • Max 50MB per file
              </p>
            </div>
          </motion.div>

          {/* Upload Progress */}
          {isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-white bg-opacity-90 flex flex-col items-center justify-center rounded-xl"
            >
              <div className="w-32 h-32 relative mb-4">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={351.86}
                    strokeDashoffset={351.86 - (351.86 * uploadProgress) / 100}
                    className="text-primary-500 transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-600">
                    {uploadProgress}%
                  </span>
                </div>
              </div>
              <p className="text-lg font-medium text-gray-700">
                Processing documents...
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Selected Files */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <File className="w-5 h-5" />
              Selected Files ({files.length})
            </h3>
            
            <div className="space-y-3">
              {files.map((fileObj) => (
                <motion.div
                  key={fileObj.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`
                    flex items-center gap-4 p-4 rounded-lg border
                    ${fileObj.status === 'uploaded' 
                      ? 'bg-green-50 border-green-200' 
                      : fileObj.status === 'error'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white border-gray-200'
                    }
                    transition-colors duration-200
                  `}
                >
                  {getFileIcon(fileObj.file.name)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {fileObj.file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {utils.formatFileSize(fileObj.file.size)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {fileObj.status === 'uploaded' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {fileObj.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    {fileObj.status === 'pending' && !isUploading && (
                      <button
                        onClick={() => removeFile(fileObj.id)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Button */}
      {files.length > 0 && !isUploading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <button
            onClick={handleUpload}
            disabled={files.length === 0}
            className="
              px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 
              text-white font-semibold rounded-lg shadow-lg hover:shadow-xl
              transform hover:scale-105 transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              flex items-center gap-2
            "
          >
            <Upload className="w-5 h-5" />
            Upload {files.length} Document{files.length !== 1 ? 's' : ''}
          </button>
        </motion.div>
      )}

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 bg-gray-50 rounded-lg p-6"
      >
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Quick Tips
        </h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-primary-400 rounded-full mt-2 flex-shrink-0"></span>
            Upload multiple documents at once for comprehensive knowledge base
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-primary-400 rounded-full mt-2 flex-shrink-0"></span>
            Larger documents will be automatically chunked for optimal search
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-primary-400 rounded-full mt-2 flex-shrink-0"></span>
            Processing time depends on document size and complexity
          </li>
          <li className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 bg-primary-400 rounded-full mt-2 flex-shrink-0"></span>
            All documents are securely processed and stored
          </li>
        </ul>
      </motion.div>
    </div>
  );
};

export default DocumentUpload;