import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/store';

// Hook for managing local storage
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

// Hook for debounced values
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook for managing async operations
export const useAsync = (asyncFunction, immediate = true) => {
  const [status, setStatus] = useState('idle');
  const [value, setValue] = useState(null);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setStatus('pending');
      setValue(null);
      setError(null);

      try {
        const response = await asyncFunction(...args);
        setValue(response);
        setStatus('success');
        return response;
      } catch (error) {
        setError(error);
        setStatus('error');
        throw error;
      }
    },
    [asyncFunction]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    execute,
    status,
    value,
    error,
    isPending: status === 'pending',
    isSuccess: status === 'success',
    isError: status === 'error',
  };
};

// Hook for intersection observer (scroll animations)
export const useIntersectionObserver = (
  elementRef,
  { threshold = 0, root = null, rootMargin = '0%' } = {}
) => {
  const [entry, setEntry] = useState();

  const updateEntry = ([entry]) => {
    setEntry(entry);
  };

  useEffect(() => {
    const node = elementRef?.current;
    const hasIOSupport = !!window.IntersectionObserver;

    if (!hasIOSupport || !node) return;

    const observerParams = { threshold, root, rootMargin };
    const observer = new IntersectionObserver(updateEntry, observerParams);

    observer.observe(node);

    return () => observer.disconnect();
  }, [elementRef, threshold, root, rootMargin]);

  return entry;
};

// Hook for managing previous value
export const usePrevious = (value) => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

// Hook for window size
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

// Hook for detecting clicks outside element
export const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};

// Hook for keyboard shortcuts
export const useKeyboard = (targetKey, handler, deps = []) => {
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === targetKey) {
        handler(event);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, deps);
};

// Hook for managing focus
export const useFocus = () => {
  const htmlElRef = useRef(null);
  
  const setFocus = () => {
    htmlElRef.current && htmlElRef.current.focus();
  };

  return [htmlElRef, setFocus];
};

// Hook for auto-save functionality
export const useAutoSave = (data, saveFunction, delay = 2000) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const timeoutRef = useRef();

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      if (data && Object.keys(data).length > 0) {
        setIsSaving(true);
        try {
          await saveFunction(data);
          setLastSaved(new Date());
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, saveFunction, delay]);

  return { isSaving, lastSaved };
};

// Hook for managing document title
export const useDocumentTitle = (title) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
};

// Hook for copy to clipboard
export const useClipboard = (resetInterval = null) => {
  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback(async (text) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      return true;
    } catch (error) {
      console.warn('Copy failed', error);
      setIsCopied(false);
      return false;
    }
  }, []);

  useEffect(() => {
    let timeoutId;

    if (isCopied && resetInterval) {
      timeoutId = setTimeout(() => setIsCopied(false), resetInterval);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isCopied, resetInterval]);

  return { isCopied, copy };
};

// Hook for managing online/offline status
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Hook for managing search functionality
export const useSearch = (items, searchKey) => {
  const [query, setQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState(items);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery) {
      setFilteredItems(items);
      return;
    }

    const filtered = items.filter(item => {
      const searchText = searchKey ? item[searchKey] : item;
      return searchText.toLowerCase().includes(debouncedQuery.toLowerCase());
    });

    setFilteredItems(filtered);
  }, [items, debouncedQuery, searchKey]);

  return {
    query,
    setQuery,
    filteredItems,
    hasResults: filteredItems.length > 0,
    isEmpty: filteredItems.length === 0 && query.length > 0
  };
};

// Hook for managing chat interface
export const useChat = () => {
  const { 
    currentQuestion, 
    setCurrentQuestion, 
    askQuestion, 
    isLoading, 
    currentAnswer,
    queryHistory 
  } = useAppStore();

  const [suggestions, setSuggestions] = useState([]);

  const handleAskQuestion = useCallback(async (question, options) => {
    if (!question.trim()) return;
    
    try {
      await askQuestion(question, options);
      setCurrentQuestion('');
    } catch (error) {
      console.error('Failed to ask question:', error);
    }
  }, [askQuestion, setCurrentQuestion]);

  const generateSuggestions = useCallback((query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    // Generate suggestions based on query history
    const historySuggestions = queryHistory
      .filter(item => 
        item.question.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 3)
      .map(item => item.question);

    // Add some common question starters
    const commonStarters = [
      `What is ${query}?`,
      `How does ${query} work?`,
      `Tell me about ${query}`,
      `Explain ${query}`,
      `What are the benefits of ${query}?`
    ].filter(starter => 
      starter.toLowerCase().includes(query.toLowerCase())
    );

    const allSuggestions = [...new Set([...historySuggestions, ...commonStarters])];
    setSuggestions(allSuggestions.slice(0, 5));
  }, [queryHistory]);

  return {
    currentQuestion,
    setCurrentQuestion,
    askQuestion: handleAskQuestion,
    isLoading,
    currentAnswer,
    queryHistory,
    suggestions,
    generateSuggestions
  };
};