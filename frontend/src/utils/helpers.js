// Text processing utilities
export const textUtils = {
  // Truncate text with ellipsis
  truncate: (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substr(0, maxLength).trim() + '...';
  },

  // Extract key phrases from text
  extractKeyPhrases: (text, maxPhrases = 5) => {
    if (!text) return [];
    
    // Simple keyword extraction - split by common delimiters
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'have', 'will', 'been', 'from', 'they', 'were', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other'].includes(word));
    
    // Count word frequency
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Get top phrases
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxPhrases)
      .map(([word]) => word);
  },

  // Highlight search terms in text
  highlightSearch: (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded font-medium">$1</mark>');
  },

  // Calculate reading time
  calculateReadingTime: (text, wordsPerMinute = 200) => {
    if (!text) return 0;
    const wordCount = text.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  },

  // Clean HTML from text
  stripHtml: (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }
};

// Date and time utilities
export const dateUtils = {
  // Format relative time (e.g., "2 hours ago")
  timeAgo: (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (weeks < 4) return `${weeks}w ago`;
    if (months < 12) return `${months}mo ago`;
    return `${Math.floor(months / 12)}y ago`;
  },

  // Format date for display
  formatDate: (date, options = {}) => {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };
    
    return new Date(date).toLocaleDateString('en-US', defaultOptions);
  },

  // Format date with time
  formatDateTime: (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
};

// Animation utilities
export const animationUtils = {
  // Stagger animation delays
  staggerDelay: (index, baseDelay = 0.1) => ({
    delay: index * baseDelay
  }),

  // Fade in variants for Framer Motion
  fadeInVariants: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  },

  // Slide in variants
  slideInVariants: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  },

  // Scale variants
  scaleVariants: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 }
  },

  // Container variants for staggered children
  containerVariants: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }
};

// File utilities
export const fileUtils = {
  // Get file extension
  getExtension: (filename) => {
    return filename.split('.').pop().toLowerCase();
  },

  // Get file icon color based on type
  getFileColor: (filename) => {
    const ext = fileUtils.getExtension(filename);
    const colorMap = {
      pdf: 'text-red-500',
      doc: 'text-blue-500',
      docx: 'text-blue-500',
      txt: 'text-gray-500',
      html: 'text-orange-500',
      md: 'text-purple-500',
      default: 'text-gray-400'
    };
    return colorMap[ext] || colorMap.default;
  },

  // Format file size
  formatSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Validate file type
  isValidFileType: (file) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/html',
      'text/markdown',
    ];
    return validTypes.includes(file.type);
  }
};

// UI utilities
export const uiUtils = {
  // Generate random colors for avatars/placeholders
  getRandomColor: () => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  // Generate initials from name
  getInitials: (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  // Copy text to clipboard
  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  },

  // Scroll to element smoothly
  scrollToElement: (elementId, offset = 0) => {
    const element = document.getElementById(elementId);
    if (element) {
      const top = element.offsetTop - offset;
      window.scrollTo({
        top,
        behavior: 'smooth'
      });
    }
  },

  // Debounce function
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function
  throttle: (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// Validation utilities
export const validationUtils = {
  // Email validation
  isValidEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  // URL validation
  isValidUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Password strength
  getPasswordStrength: (password) => {
    if (!password) return 0;
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    return score;
  },

  // Required field validation
  isRequired: (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  }
};

// Search utilities
export const searchUtils = {
  // Fuzzy search
  fuzzyMatch: (pattern, str) => {
    pattern = pattern.toLowerCase();
    str = str.toLowerCase();
    
    let patternIdx = 0;
    let strIdx = 0;
    const patternLength = pattern.length;
    const strLength = str.length;
    
    while (patternIdx !== patternLength && strIdx !== strLength) {
      if (pattern[patternIdx] === str[strIdx]) {
        ++patternIdx;
      }
      ++strIdx;
    }
    
    return patternLength !== 0 && strLength !== 0 && patternIdx === patternLength;
  },

  // Highlight matches
  highlightMatches: (text, query) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<span class="bg-yellow-200 font-medium px-1 rounded">$1</span>');
  },

  // Extract search suggestions
  generateSuggestions: (items, query, key = 'title') => {
    if (!query) return [];
    
    return items
      .filter(item => {
        const text = typeof item === 'string' ? item : item[key];
        return text.toLowerCase().includes(query.toLowerCase());
      })
      .slice(0, 5);
  }
};

// Export all utilities
export default {
  text: textUtils,
  date: dateUtils,
  animation: animationUtils,
  file: fileUtils,
  ui: uiUtils,
  validation: validationUtils,
  search: searchUtils
};