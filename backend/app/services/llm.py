import os
import torch
import logging
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod
import time
import requests
import gc

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Try importing local LLM libraries
try:
    # Attempt to import for BitsAndBytes (for transformers models)
    from transformers import (
        AutoTokenizer,
        AutoModelForCausalLM,
        pipeline,
        BitsAndBytesConfig
    )
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    logger.info("Transformers library not found. Local LLM will only use llama-cpp-python if available.")

try:
    # Attempt to import for llama-cpp-python
    from llama_cpp import Llama
    LLAMA_CPP_AVAILABLE = True
except ImportError:
    LLAMA_CPP_AVAILABLE = False
    logger.info("llama-cpp-python not found. Install with: pip install llama-cpp-python[cuda] for GPU.")


# Try importing OpenAI
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.info("OpenAI library not found. OpenAI API will not be available.")

class BaseLLM(ABC):
    """Abstract base class for LLM implementations."""

    @abstractmethod
    def generate_response(self, prompt: str, max_tokens: int = 512, temperature: float = 0.7) -> str:
        """Generate response from the LLM."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if the LLM is available and working."""
        pass


class LocalLLM(BaseLLM):
    """Local LLM using llama-cpp-python (preferred) or Transformers (fallback) with GPU acceleration."""

    def __init__(self, model_path: str = None, use_4bit_quantization: bool = True, n_gpu_layers: int = -1):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = None
        self.tokenizer = None # Only used if falling back to transformers pipeline
        self.pipeline = None  # Only used if falling back to transformers pipeline
        self._available = False
        self.model_name = None # For display name
        self.model_path = model_path # Path to .gguf model or transformers model ID
        self.use_4bit_quantization = use_4bit_quantization and torch.cuda.is_available()
        self.n_gpu_layers = n_gpu_layers # Number of layers to offload to GPU (-1 for all)

        # Pre-defined order of preference for local model loading
        # Prioritize GGUF models for low VRAM
        self.model_candidates = [
            # 1. GGUF Models (Highly Recommended for RTX 4050)
            # You will need to download these files manually and place them in `backend/models/`
            # The 'model_path' in init will take precedence if provided and exists.
            "phi-2.Q4_K_M.gguf",# Smaller, very capable
            "Meta-Llama-3-8B-Instruct-Q4_K_M.gguf",# Llama 3 is strong, Q4_K_M might fit with offloading
            "mistral-7b-instruct-v0.2.Q4_K_M.gguf",  # Excellent performance for its size, Q4_K_M is good balance
                   
                                 
            "tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf",  # Smallest, fast, but less powerful
            "llama-2-7b-chat.Q4_K_M.gguf",           # Another good 7B option

            # 2. HuggingFace Transformers Models (less VRAM efficient than GGUF, but broader support)
            "mistralai/Mistral-7B-Instruct-v0.2",
            "microsoft/Orca-2-7b",
            "microsoft/DialoGPT-medium",
            "distilgpt2",
        ]

        self._initialize_model()

    def _get_quantization_config(self):
        """Get 4-bit quantization config for memory efficiency (for transformers models)."""
        if not self.use_4bit_quantization:
            return None

        try:
            return BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_compute_dtype=torch.bfloat16 # or torch.float16 if bfloat16 not supported
            )
        except Exception as e:
            logger.warning(f"Could not create BitsAndBytesConfig: {e}. Ensure bitsandbytes is installed and compatible with your CUDA version.")
            return None

    def _initialize_model(self):
        """Initialize the best available model, prioritizing GGUF via llama-cpp-python."""
        logger.info(f"🤖 Loading best local LLM on {self.device}")

        # Prioritize specified model_path if provided and exists
        if self.model_path:
            model_candidate_paths = [self.model_path] + [os.path.join( "models", mc) for mc in self.model_candidates if mc.endswith(".gguf")]
        else:
            model_candidate_paths = [os.path.join("models", mc) for mc in self.model_candidates if mc.endswith(".gguf")]

        # Add HuggingFace models as lower priority
        model_candidate_paths.extend([mc for mc in self.model_candidates if not mc.endswith(".gguf")])

        for candidate in model_candidate_paths:
            try:
                logger.info(f"Attempting to load {candidate}...")
                
                if candidate.endswith(".gguf") and LLAMA_CPP_AVAILABLE:
                    # --- Try to load GGUF model with llama-cpp-python ---
                    full_model_path = candidate if os.path.exists(candidate) else os.path.join("backend", "models", os.path.basename(candidate))
                    if not os.path.exists(full_model_path):
                        logger.warning(f"GGUF model not found at {full_model_path}. Skipping.")
                        continue

                    logger.info(f"Loading GGUF model: {full_model_path} with llama-cpp-python.")
                    try:
                        self.model = Llama(
                            model_path=full_model_path,
                            n_gpu_layers=self.n_gpu_layers if self.device == "cuda" else 0, # Offload layers to GPU
                            n_ctx=4096, # Context window size, adjust as needed
                            n_batch=512, # Batch size for prompt processing
                            verbose=False # Suppress llama-cpp-python's internal logging
                        )
                        self.model_name = os.path.basename(full_model_path)
                        logger.info(f"✅ Successfully loaded {self.model_name} with llama-cpp-python.")
                        self._available = True
                        break # Successfully loaded a model
                    except Exception as e:
                        logger.warning(f"Failed to load GGUF model {full_model_path} with llama-cpp-python: {e}. Trying next option.")
                        self._cleanup_model()
                        continue

                elif TRANSFORMERS_AVAILABLE:
                    # --- Fallback to HuggingFace Transformers models ---
                    logger.info(f"Loading HuggingFace Transformers model: {candidate}.")
                    self.tokenizer = AutoTokenizer.from_pretrained(
                        candidate,
                        trust_remote_code=True,
                        padding_side="left"
                    )
                    if self.tokenizer.pad_token is None:
                        self.tokenizer.pad_token = self.tokenizer.eos_token

                    model_kwargs = {
                        "trust_remote_code": True,
                        "low_cpu_mem_usage": True,
                        "use_cache": True
                    }

                    if self.device == "cuda":
                        quantization_config = self._get_quantization_config()
                        if quantization_config and self.use_4bit_quantization:
                            model_kwargs["quantization_config"] = quantization_config
                            model_kwargs["device_map"] = "auto"
                            logger.info(f"Using 4-bit quantization for {candidate} with device_map='auto'")
                        else:
                            logger.warning(f"Quantization not used or failed for {candidate}. Attempting fp16/bf16 on GPU with device_map='auto'.")
                            model_kwargs["torch_dtype"] = torch.bfloat16 if torch.cuda.is_available() and torch.cuda.is_bf16_supported() else torch.float16
                            model_kwargs["device_map"] = "auto"
                    else: # CPU
                        logger.info(f"Loading {candidate} on CPU.")
                        # No specific device_map or torch_dtype needed for CPU load generally.

                    self.model = AutoModelForCausalLM.from_pretrained(candidate, **model_kwargs)
                    self.model.eval()

                    pipeline_kwargs = {
                        "model": self.model,
                        "tokenizer": self.tokenizer,
                        "task": "text-generation",
                        "return_full_text": False,
                        "batch_size": 1
                    }
                    if self.device == "cuda" and "device_map" not in model_kwargs: # Only set device if model was not loaded with device_map
                        pipeline_kwargs["device"] = 0 # Model was manually moved to cuda:0 (or should have been)
                        if "quantization_config" not in model_kwargs:
                            pipeline_kwargs["torch_dtype"] = model_kwargs.get("torch_dtype", torch.float16)
                    elif self.device == "cpu":
                        pipeline_kwargs["device"] = -1 # Model is on CPU

                    self.pipeline = pipeline(**pipeline_kwargs)
                    self.model_name = candidate # For display name
                    logger.info(f"✅ Successfully loaded {candidate} with Transformers pipeline.")
                    self._available = True
                    break # Successfully loaded a model

                else:
                    logger.warning(f"No suitable library (llama-cpp-python or Transformers) for {candidate}.")
                    continue

            except Exception as e:
                logger.warning(f"Failed to load or initialize {candidate}: {e}. Cleaning up and trying next model.")
                self._cleanup_model()
                continue
        
        if not self._available:
            raise Exception("Failed to load any suitable local model from the candidate list.")

        # Final setup after successful model load
        vram_info = ""
        if self.device == "cuda" and torch.cuda.is_available():
            try:
                # Note: llama-cpp-python doesn't directly report VRAM usage via torch.
                # This will show total VRAM, not specific usage by the model.
                vram_info = f", Total VRAM: {torch.cuda.get_device_properties(0).total_memory // 1024**3}GB"
            except Exception as e:
                logger.warning(f"Could not get VRAM info: {e}")
        logger.info(f"🚀 Local LLM initialized: {self.model_name} on {self.device}{vram_info}")

    def _test_generation(self) -> str:
        """Test model generation capability."""
        try:
            test_prompt = "Question: What is the capital of France? Answer:"
            if isinstance(self.model, Llama): # llama-cpp-python model
                response_obj = self.model.create_completion(
                    prompt=test_prompt,
                    max_tokens=10,
                    temperature=0.1,
                    stop=["\n"] # Stop at first newline for concise test
                )
                generated_text = response_obj['choices'][0]['text'].strip()
            elif self.pipeline: # Transformers pipeline
                response = self.pipeline(
                    test_prompt,
                    max_new_tokens=10,
                    temperature=0.1,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
                generated_text = response[0]['generated_text'].strip()
            else:
                return None # No model loaded
            
            if generated_text:
                return generated_text
            return None
        except Exception as e:
            logger.warning(f"Model test failed: {e}")
            return None

    def _cleanup_model(self):
        """Clean up model resources."""
        # For transformers pipeline
        if hasattr(self, 'pipeline') and self.pipeline:
            del self.pipeline
            self.pipeline = None
        if hasattr(self, 'tokenizer') and self.tokenizer:
            del self.tokenizer
            self.tokenizer = None
        
        # For llama-cpp-python model
        if hasattr(self, 'model') and self.model:
            # llama-cpp-python's Llama object might not need explicit deletion beyond Python's GC
            # However, setting to None and explicit GC helps
            del self.model
            self.model = None
        
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.synchronize()

    def generate_response(self, prompt: str, max_tokens: int = 256, temperature: float = 0.7) -> str:
        """Generate response using local LLM with optimized settings for QA."""
        if not self._available:
            raise Exception("Local LLM not available")
        
        try:
            # Optimize parameters for QA tasks
            max_tokens = min(max_tokens, 512) # Increased for better answers
            temperature = max(0.0, min(temperature, 1.0)) # Ensure temp is between 0 and 1
            
            if isinstance(self.model, Llama): # Using llama-cpp-python
                logger.debug(f"Generating response with llama-cpp-python for prompt: {prompt[:100]}...")
                response_obj = self.model.create_completion(
                    prompt=prompt,
                    max_tokens=max_tokens,
                    temperature=temperature,
                    top_p=0.95,
                    repeat_penalty=1.1,
                    stop=["\n###", "\n##", "\n\n", "Question:", "User:", "###", "##"] # Common stop sequences
                )
                generated_text = response_obj['choices'][0]['text'].strip()
            elif self.pipeline: # Using Transformers pipeline
                logger.debug(f"Generating response with Transformers pipeline for prompt: {prompt[:100]}...")
                generation_kwargs = {
                    "max_new_tokens": max_tokens,
                    "temperature": temperature,
                    "do_sample": True if temperature > 0.0 else False,
                    "pad_token_id": self.tokenizer.eos_token_id,
                    "eos_token_id": self.tokenizer.eos_token_id,
                    "repetition_penalty": 1.1,
                    # "length_penalty": 1.0, # Not always compatible with all models or sampling strategies
                    "early_stopping": True,
                    "num_beams": 1, # Keep at 1 for speed on consumer hardware
                }
                
                if generation_kwargs["do_sample"]:
                    generation_kwargs.update({
                        "top_k": 50,
                        "top_p": 0.95,
                    })
                
                with torch.no_grad(): # Save memory
                    response = self.pipeline(prompt, **generation_kwargs)
                
                if not response or not response[0] or 'generated_text' not in response[0]:
                    logger.warning("Empty response from pipeline")
                    return "I couldn't generate a proper response based on the provided context."
                    
                generated_text = response[0]['generated_text'].strip()
            else:
                raise Exception("No active local model to generate response.")

            processed_text = self._post_process_qa_response(generated_text, prompt)
            
            if not processed_text or len(processed_text) < 5:
                logger.warning(f"Invalid response: {processed_text}")
                return "I couldn't generate a proper response based on the provided context."
            
            return processed_text
            
        except Exception as e:
            logger.error(f"Error generating response with local LLM: {e}")
            return "I encountered an error while generating a response."
    
    def _post_process_qa_response(self, text: str, original_prompt: str) -> str:
        """Enhanced post-processing specifically for QA responses."""
        if not text:
            return text
        
        # Remove the original prompt if it was repeated
        if original_prompt.lower() in text.lower():
            text = text.replace(original_prompt, "").strip()
        
        # Clean up common artifacts
        text = text.strip()
        
        # Remove incomplete sentences at the end
        sentences = text.split('.')
        if len(sentences) > 1 and sentences[-1].strip() and not sentences[-1].strip().endswith(('!', '?')):
            # Check if last sentence seems incomplete
            last_sentence = sentences[-1].strip()
            if len(last_sentence) < 10 or not last_sentence[0].isupper():
                text = '.'.join(sentences[:-1]) + '.'
        
        # Remove excessive repetition (simple version)
        words = text.split()
        if len(words) > 5:
            cleaned_words = []
            word_history = {} # Use a dict to count occurrences in a small window
            for i, word in enumerate(words):
                if i > 5: # Only check last 5 words for repetition
                    oldest_word = words[i-6]
                    word_history[oldest_word] = word_history.get(oldest_word, 0) - 1
                    if word_history[oldest_word] == 0:
                        del word_history[oldest_word]

                word_history[word] = word_history.get(word, 0) + 1
                if word_history[word] > 2: # If a word appears more than twice in the window of 5
                    continue
                cleaned_words.append(word)
            text = ' '.join(cleaned_words)
        
        # Ensure answer starts appropriately
        text = text.strip()
        if text and not text[0].isupper() and len(text) > 1: # Only if not single char
            text = text[0].upper() + text[1:]
        
        return text
    
    def is_available(self) -> bool:
        """Check if local LLM is available."""
        return self._available


class OpenAILLM(BaseLLM):
    """OpenAI API-based LLM - optimized for QA tasks."""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-3.5-turbo-0125"):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.model = model
        self._available = False
        self.client = None
        
        if not OPENAI_AVAILABLE:
            logger.warning("OpenAI library not available. Install with: pip install openai")
            return
            
        if not self.api_key:
            logger.warning("OpenAI API key not provided. Set OPENAI_API_KEY environment variable.")
            return
            
        try:
            self.client = OpenAI(api_key=self.api_key)
            self._test_connection()
            self._available = True
            logger.info(f"✅ OpenAI LLM initialized with model: {self.model}")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {e}")
    
    def _test_connection(self):
        """Test OpenAI API connection."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=5,
                temperature=0.1
            )
            # Check if response indicates success, e.g., by having choices
            if not response.choices:
                raise ValueError("No choices in OpenAI test response.")
            logger.info("OpenAI connection test successful")
        except Exception as e:
            logger.error(f"OpenAI connection test failed: {e}")
            raise
    
    def generate_response(self, prompt: str, max_tokens: int = 512, temperature: float = 0.7) -> str:
        """Generate response using OpenAI API optimized for QA."""
        if not self._available or not self.client:
            raise Exception("OpenAI LLM not available")
        
        try:
            # Create messages for chat completion
            messages = [
                {
                    "role": "system", 
                    "content": "You are a helpful assistant that answers questions accurately based on provided context. If you don't know the answer, say so clearly."
                },
                {"role": "user", "content": prompt}
            ]
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=0.95,
                frequency_penalty=0.1,
                presence_penalty=0.1
            )
            
            if not response.choices or not response.choices[0].message.content:
                raise Exception("Empty response from OpenAI API")
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            logger.error(f"Error generating response with OpenAI: {e}")
            return "I encountered an error while generating a response."
    
    def is_available(self) -> bool:
        """Check if OpenAI LLM is available."""
        return self._available


class GroqLLM(BaseLLM):
    """Groq-hosted LLM via OpenAI-compatible API - optimized for fast inference."""
    
    def __init__(self, api_key: str = None, model: str = "llama3-8b-8192"):
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        # Updated model options for better QA performance (Groq models change)
        self.model = model
        self._available = False
        
        if not self.api_key:
            logger.warning("GROQ API key not found. Set GROQ_API_KEY environment variable.")
            return
        
        # Groq's API is OpenAI-compatible but uses its own base URL
        self.endpoint = "https://api.groq.com/openai/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Test connection at initialization
        try:
            self._test_connection()
            self._available = True
            logger.info(f"✅ Groq LLM initialized with model: {self.model}")
        except Exception as e:
            logger.error(f"Failed to initialize Groq LLM: {e}")
    
    def _test_connection(self):
        """Test Groq API connection."""
        data = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello"}
            ],
            "max_tokens": 5,
            "temperature": 0.1
        }
        try:
            response = requests.post(
                self.endpoint, 
                headers=self.headers, 
                json=data, 
                timeout=10
            )
            response.raise_for_status() # Raises HTTPError for bad responses (4xx or 5xx)
            response_json = response.json()
            if not response_json.get("choices"):
                raise ValueError("Groq test response has no choices.")
            logger.info("Groq connection test successful")
        except Exception as e:
            logger.error(f"Groq connection test failed: {e}")
            raise
    
    def generate_response(self, prompt: str, max_tokens: int = 512, temperature: float = 0.7) -> str:
        """Generate response using Groq API optimized for QA."""
        if not self._available:
            raise Exception("Groq LLM not available")
        
        # Create optimized messages for QA
        messages = [
            {
                "role": "system",
                "content": "You are an expert assistant that provides accurate, concise answers based on given context. If the context doesn't contain enough information to answer the question, clearly state that you don't know."
            },
            {"role": "user", "content": prompt}
        ]
        
        data = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": 0.95,
            "frequency_penalty": 0.1,
            "presence_penalty": 0.1,
            "stop": None # Let the model decide or use specific tokens if needed
        }
        
        try:
            response = requests.post(
                self.endpoint, 
                headers=self.headers, 
                json=data, 
                timeout=60  # Increased timeout for complex queries
            )
            response.raise_for_status()
            response_data = response.json()
            
            if not response_data.get("choices") or not response_data["choices"][0].get("message", {}).get("content"):
                raise Exception("Empty response from Groq API")
                
            return response_data["choices"][0]["message"]["content"].strip()
            
        except requests.exceptions.Timeout:
            logger.error("Groq API request timed out")
            return "The request timed out. Please try again."
        except Exception as e:
            logger.error(f"Groq API error: {e}")
            return "I encountered an error while generating a response."
    
    def is_available(self) -> bool:
        """Check if Groq LLM is available."""
        return self._available


class LLMService:
    """Enhanced LLM service with intelligent fallback and optimization for RAG QA."""
    
    def __init__(self, prefer_local: bool = False, local_model_path: Optional[str] = None, n_gpu_layers: int = -1):
        self.local_llm = None
        self.openai_llm = None
        self.groq_llm = None
        self.primary_llm = None
        self.fallback_llm = None
        self.prefer_local = prefer_local
        self.local_model_path = local_model_path
        self.n_gpu_layers = n_gpu_layers
        
        self._initialize_llms()
        self._set_priority()
    
    def _initialize_llms(self):
        """Initialize all available LLMs."""
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key:
            try:
                logger.info("🚀 Initializing Groq LLM...")
                self.groq_llm = GroqLLM(api_key=groq_key, model="llama3-8b-8192") 
            except Exception as e:
                logger.error(f"❌ Failed to initialize Groq LLM: {e}")
                self.groq_llm = None

        openai_key = os.getenv("OPENAI_API_KEY")
        if OPENAI_AVAILABLE and openai_key:
            try:
                logger.info("🚀 Initializing OpenAI LLM...")
                # Consider making the model configurable e.g. from settings
                self.openai_llm = OpenAILLM(api_key=openai_key, model="gpt-3.5-turbo-0125") # Or your preferred OpenAI model from Week 3 plan
            except Exception as e:
                logger.error(f"❌ Failed to initialize OpenAI LLM: {e}")
                self.openai_llm = None

        if LLAMA_CPP_AVAILABLE or TRANSFORMERS_AVAILABLE:
            try:
                logger.info("🚀 Initializing Local LLM...")
                self.local_llm = LocalLLM(
                    model_path=self.local_model_path,
                    use_4bit_quantization=True, 
                    n_gpu_layers=self.n_gpu_layers
                )
            except Exception as e:
                logger.error(f"❌ Failed to initialize local LLM: {e}")
                self.local_llm = None
    
    def _set_priority(self):
        """Set LLM priority based on availability and preferences."""
        available_llm_entries = []
        # if self.groq_llm and self.groq_llm.is_available():
        #     available_llm_entries.append(("groq", self.groq_llm))
        if self.openai_llm and self.openai_llm.is_available():
            available_llm_entries.append(("openai", self.openai_llm))
        if self.local_llm and self.local_llm.is_available():
            available_llm_entries.append(("local", self.local_llm))

        if not available_llm_entries:
            logger.error("❌ No LLM available!")
            self.primary_llm = None
            self.fallback_llm = None
            return
        
        def sort_key(llm_entry):
            llm_type, _ = llm_entry
            if llm_type == "local":
                return -1 if self.prefer_local else 2
            elif llm_type == "groq": # Prioritize Groq if not preferring local
                return 0 if not self.prefer_local else 1
            elif llm_type == "openai":
                return 1 if not self.prefer_local else (0 if self.prefer_local and llm_type != "groq" else 2)
            return 99 

        available_llm_entries.sort(key=sort_key)

        self.primary_llm = available_llm_entries[0][1]
        self.fallback_llm = available_llm_entries[1][1] if len(available_llm_entries) > 1 else None
        
        logger.info(f"🎯 Primary LLM: {self._get_llm_type(self.primary_llm).upper()} (Model: {getattr(self.primary_llm, 'model_name', getattr(self.primary_llm, 'model', 'N/A'))})")
        if self.fallback_llm:
            fallback_name = self._get_llm_type(self.fallback_llm)
            logger.info(f"🔄 Fallback LLM: {fallback_name.upper()} (Model: {getattr(self.fallback_llm, 'model_name', getattr(self.fallback_llm, 'model', 'N/A'))})")
        else:
            logger.info("ℹ️ No fallback LLM available.")

    # ***** MODIFIED METHOD *****
    def generate_answer(self, context_chunks: List[Dict[str, Any]], question: str, 
                        max_tokens: int = 512, temperature: float = 0.3) -> Dict[str, Any]: # Added max_tokens, temperature
        """Generate answer using RAG with enhanced context processing."""
        start_time = time.time()
        
        if not context_chunks:
            return {
                "success": False, "answer": "No relevant context found to answer the question.",
                "sources": [], "response_time": time.time() - start_time,
                "error": "No context provided", "llm_used": "N/A"
            }
        
        if not question.strip():
            return {
                "success": False, "answer": "No question provided.",
                "sources": [], "response_time": time.time() - start_time,
                "error": "Empty question", "llm_used": "N/A"
            }
        
        try:
            # Assuming _build_context, _create_enhanced_rag_prompt, _format_sources are defined correctly below
            context_text = self._build_context(context_chunks, max_length=3500) # Increased max_length slightly
            prompt = self._create_enhanced_rag_prompt(context_text, question)
            
            # ***** MODIFIED CALL *****
            answer, llm_used = self._generate_with_fallback(prompt, max_tokens=max_tokens, temperature=temperature)
            
            sources = self._format_sources(context_chunks) # This should format sources based on the provided context_chunks
            
            return {
                "success": True, "answer": answer, "sources": sources, "llm_used": llm_used,
                "response_time": time.time() - start_time,
                "context_chunks_count": len(context_chunks), "context_length": len(context_text)
            }
            
        except Exception as e:
            logger.error(f"Error in generate_answer: {e}", exc_info=True)
            return {
                "success": False, "answer": "I encountered an error while processing your question.",
                "sources": [], "response_time": time.time() - start_time,
                "error": str(e), "llm_used": "Error"
            }

    # ***** MODIFIED METHOD *****
    def _generate_with_fallback(self, prompt: str, max_tokens: int, temperature: float) -> tuple[str, str]: # Added max_tokens, temperature
        """Generate response with intelligent fallback."""
        active_llm = None
        llm_type_str = "N/A"

        if self.primary_llm and self.primary_llm.is_available():
            active_llm = self.primary_llm
            llm_type_str = self._get_llm_type(active_llm)
            logger.info(f"🎯 Using primary LLM: {llm_type_str.upper()} (Model: {getattr(active_llm, 'model_name', getattr(active_llm, 'model', 'N/A'))})")
            try:
                answer = active_llm.generate_response(
                    prompt, 
                    max_tokens=max_tokens,    # Use passed argument
                    temperature=temperature # Use passed argument
                )
                if answer and "encountered an error" not in answer.lower() and "couldn't generate" not in answer.lower(): # Basic check for valid answer
                    return answer, llm_type_str
                logger.warning(f"Primary LLM ({llm_type_str}) returned a non-committal or error-like answer: '{answer[:100]}...'")
            except Exception as e:
                logger.error(f"Primary LLM ({llm_type_str}) failed: {e}")
        
        if self.fallback_llm and self.fallback_llm.is_available():
            active_llm = self.fallback_llm
            llm_type_str = self._get_llm_type(active_llm)
            logger.info(f"🔄 Using fallback LLM: {llm_type_str.upper()} (Model: {getattr(active_llm, 'model_name', getattr(active_llm, 'model', 'N/A'))})")
            try:
                answer = active_llm.generate_response(
                    prompt,
                    max_tokens=max_tokens,    # Use passed argument
                    temperature=temperature # Use passed argument
                )
                if answer and "encountered an error" not in answer.lower() and "couldn't generate" not in answer.lower():
                     return answer, llm_type_str
                logger.warning(f"Fallback LLM ({llm_type_str}) also returned a non-committal or error-like answer: '{answer[:100]}...'")
                # If fallback also fails with an error-like message, raise it to indicate generation problem
                raise Exception(f"Fallback LLM ({llm_type_str}) generated a problematic response: {answer}")
            except Exception as e:
                logger.error(f"Fallback LLM ({llm_type_str}) also failed: {e}")
        
        raise Exception("No LLM available or all LLMs failed to generate a valid response.")
    
    def _get_llm_type(self, llm_instance) -> str:
        """Get LLM type string from instance."""
        if isinstance(llm_instance, GroqLLM): return "groq"
        if isinstance(llm_instance, OpenAILLM): return "openai"
        if isinstance(llm_instance, LocalLLM): return "local"
        return "unknown"
    
    def _build_context(self, chunks: List[Dict[str, Any]], max_length: int = 3000) -> str:
        """Build optimized context from chunks."""
        context_parts = []
        current_length = 0
        
        # Sort chunks by similarity score in descending order
        sorted_chunks = sorted(
            chunks, 
            key=lambda x: x.get('similarity_score', 0.0), 
            reverse=True
        )
        
        for i, chunk in enumerate(sorted_chunks):
            chunk_text = chunk.get('text', '').strip()
            if not chunk_text:
                continue
                
            # Add source information for better context
            source_info = f"[Source {i+1}: {chunk.get('source', 'Unknown')}]"
            full_chunk = f"{source_info}\n{chunk_text}"
            
            # Ensure we don't exceed max_length
            if current_length + len(full_chunk) + len("\n\n") > max_length:
                # If adding this chunk and separator would exceed, break
                break
                
            context_parts.append(full_chunk)
            current_length += len(full_chunk) + len("\n\n") # Account for separator length
        
        return "\n\n".join(context_parts)
    
    def _create_enhanced_rag_prompt(self, context: str, question: str) -> str:
        """Create an enhanced RAG prompt optimized for QA."""
        return f"""Based on the following context information, please provide a comprehensive and accurate answer to the question. If the context doesn't contain sufficient information to answer the question completely, please state what you can determine from the context and clearly indicate what information is missing.

CONTEXT:
{context}

QUESTION: {question}

INSTRUCTIONS:
- Provide a clear, direct answer based only on the information in the context
- If you cannot find the answer in the context, say "I don't have enough information in the provided context to answer this question"
- Be specific and cite relevant details from the context when possible (e.g., [Source X: Document Name])
- Keep your answer focused and concise

ANSWER:"""
    
    def _format_sources(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Format source information with enhanced details."""
        sources = []
        seen_source_pages = set() # Use set to track unique source-page combinations
        
        # Sort by similarity, then by page number for consistent order
        sorted_chunks = sorted(
            chunks, 
            key=lambda x: (x.get('similarity_score', 0.0), x.get('page', 0)), 
            reverse=True # High similarity first
        )
        
        for chunk in sorted_chunks:
            source_name = chunk.get('source', 'Unknown')
            page_number = chunk.get('page', None)
            
            source_key = f"{source_name}_{page_number}"
            if source_key in seen_source_pages:
                continue # Skip if this source+page combo already added
            
            source_info = {
                "source": source_name,
                "page": page_number,
                "similarity_score": round(chunk.get('similarity_score', 0.0), 3),
                "text_preview": (
                    chunk.get('text', '')[:300].replace("\n", " ") + "..." 
                    if len(chunk.get('text', '')) > 300 
                    else chunk.get('text', '').replace("\n", " ")
                )
            }
            sources.append(source_info)
            seen_source_pages.add(source_key)
        
        return sources[:5] # Limit to top 5 unique source+page combinations
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get comprehensive service status."""
        gpu_info = {}
        if torch.cuda.is_available():
            gpu_info = {
                "available": True,
                "device_count": torch.cuda.device_count(),
                "current_device": torch.cuda.current_device(),
                "device_name": torch.cuda.get_device_name(),
                "memory_allocated": f"{torch.cuda.memory_allocated() / 1024**3:.2f}GB",
                "memory_cached": f"{torch.cuda.memory_reserved() / 1024**3:.2f}GB",
                "memory_total": f"{torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f}GB"
            }
        else:
            gpu_info = {"available": False}
        
        return {
            "local_llm": {
                "available": self.local_llm.is_available() if self.local_llm else False,
                "model": getattr(self.local_llm, 'model_name', None) if self.local_llm else None,
                "using_llama_cpp": isinstance(getattr(self.local_llm, 'model', None), Llama),
                "quantization_info": (getattr(self.local_llm, 'use_4bit_quantization', None) if isinstance(getattr(self.local_llm, 'model', None), AutoModelForCausalLM) else None)
            },
            "openai_llm": {
                "available": self.openai_llm.is_available() if self.openai_llm else False,
                "model": getattr(self.openai_llm, 'model', None) if self.openai_llm else None
            },
            "groq_llm": {
                "available": self.groq_llm.is_available() if self.groq_llm else False,
                "model": getattr(self.groq_llm, 'model', None) if self.groq_llm else None
            },
            "primary_llm": self._get_llm_type(self.primary_llm) if self.primary_llm else None,
            "fallback_llm": self._get_llm_type(self.fallback_llm) if self.fallback_llm else None,
            "gpu": gpu_info,
            "libraries": {
                "transformers": TRANSFORMERS_AVAILABLE,
                "llama_cpp_python": LLAMA_CPP_AVAILABLE,
                "openai": OPENAI_AVAILABLE,
                "torch_version": torch.__version__ if torch else None
            }
        }

    def test_generation(self, test_prompt: str = "Question: What is artificial intelligence? Answer:") -> Dict[str, Any]:
        """Test generation with both primary and fallback LLMs."""
        results = {
            "primary": None,
            "fallback": None
        }
        
        # Test primary LLM
        if self.primary_llm and self.primary_llm.is_available():
            try:
                start_time = time.time()
                response = self.primary_llm.generate_response(
                    test_prompt, 
                    max_tokens=100, 
                    temperature=0.3
                )
                response_time = time.time() - start_time
                
                results["primary"] = {
                    "success": True,
                    "response": response,
                    "response_time": response_time,
                    "llm_type": self._get_llm_type(self.primary_llm)
                }
            except Exception as e:
                results["primary"] = {
                    "success": False,
                    "error": str(e),
                    "llm_type": self._get_llm_type(self.primary_llm)
                }
        
        # Test fallback LLM
        if self.fallback_llm and self.fallback_llm.is_available():
            try:
                start_time = time.time()
                response = self.fallback_llm.generate_response(
                    test_prompt, 
                    max_tokens=100, 
                    temperature=0.3
                )
                response_time = time.time() - start_time
                
                results["fallback"] = {
                    "success": True,
                    "response": response,
                    "response_time": response_time,
                    "llm_type": self._get_llm_type(self.fallback_llm)
                }
            except Exception as e:
                results["fallback"] = {
                    "success": False,
                    "error": str(e),
                    "llm_type": self._get_llm_type(self.fallback_llm)
                }
        
        return results

    def cleanup(self):
        """Clean up all LLM resources."""
        logger.info("🧹 Cleaning up LLM resources...")
        
        if self.local_llm:
            self.local_llm._cleanup_model()
        
        # Clear references
        self.local_llm = None
        self.openai_llm = None
        self.groq_llm = None
        self.primary_llm = None
        self.fallback_llm = None
        
        # Force cleanup
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            torch.cuda.synchronize()
        
        logger.info("✅ LLM cleanup completed")

    def switch_primary_llm(self, llm_type: str) -> bool:
        """Switch primary LLM to specified type."""
        available_llms = {
            "groq": self.groq_llm,
            "openai": self.openai_llm,
            "local": self.local_llm
        }
        
        if llm_type not in available_llms:
            logger.error(f"Invalid LLM type: {llm_type}")
            return False
        
        target_llm = available_llms[llm_type]
        if not target_llm or not target_llm.is_available():
            logger.error(f"LLM {llm_type} is not available")
            return False
        
        # Set new primary and adjust fallback
        old_primary = self.primary_llm
        self.primary_llm = target_llm
        
        # Set fallback to old primary if different
        if old_primary != target_llm:
            self.fallback_llm = old_primary
        
        logger.info(f"✅ Switched primary LLM to: {llm_type.upper()}")
        return True


# Utility functions for easy setup
def create_llm_service(prefer_local: bool = False, local_model_path: Optional[str] = None, n_gpu_layers: int = -1) -> LLMService:
    """Create and return configured LLM service."""
    return LLMService(prefer_local=prefer_local, local_model_path=local_model_path, n_gpu_layers=n_gpu_layers)


def get_installation_requirements() -> Dict[str, List[str]]:
    """Get installation requirements for different LLM types."""
    return {
        "basic": [
            "requests>=2.25.0"
        ],
        "local_gpu_transformers": [
            "torch>=1.12.0",
            "transformers>=4.21.0", 
            "accelerate>=0.20.0",
            "bitsandbytes>=0.39.0",  # For quantization
        ],
        "local_gpu_llama_cpp": [
            "llama-cpp-python[cuda]>=0.2.0" # Specific for CUDA
        ],
        "openai": [
            "openai>=1.0.0"
        ],
        "groq": [
            # requests is already in basic
        ],
        "all": [
            "torch>=1.12.0",
            "transformers>=4.21.0",
            "accelerate>=0.20.0", 
            "bitsandbytes>=0.39.0",
            "llama-cpp-python[cuda]>=0.2.0",
            "openai>=1.0.0",
            "requests>=2.25.0"
        ]
    }