import os
import torch
import numpy as np
from typing import List, Tuple, Optional
from sentence_transformers import SentenceTransformer
from pathlib import Path
import pickle
import hashlib
from app.config import DATA_DIR

class EmbeddingService:
    """Service for generating and managing document embeddings using GPU acceleration."""
    
    def __init__(self, model_name: str = "intfloat/e5-large-v2"):
        """
        Initialize embedding service with GPU support.
        
        Args:
            model_name: HuggingFace model name for embeddings
        """
        self.model_name = model_name
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🚀 Initializing EmbeddingService on device: {self.device}")
        
        # Load model with GPU support
        self.model = SentenceTransformer(model_name, device=self.device)
        
        # Cache directory for embeddings
        self.embeddings_dir = DATA_DIR / "embeddings"
        self.embeddings_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"✅ EmbeddingService initialized with {model_name}")
    
    def generate_embeddings(self, texts: List[str], batch_size: int = 32) -> np.ndarray:
        """
        Generate embeddings for a list of texts using GPU acceleration.
        
        Args:
            texts: List of text chunks to embed
            batch_size: Batch size for processing (adjust based on GPU memory)
        
        Returns:
            numpy array of embeddings
        """
        if not texts:
            return np.array([])
        
        print(f"🔄 Generating embeddings for {len(texts)} texts using {self.device}")
        
        try:
            # Generate embeddings in batches
            embeddings = self.model.encode(
                texts,
                batch_size=batch_size,
                show_progress_bar=True,
                convert_to_numpy=True,
                device=self.device
            )
            
            print(f"✅ Generated embeddings shape: {embeddings.shape}")
            return embeddings
            
        except Exception as e:
            print(f"❌ Error generating embeddings: {e}")
            raise
    
    def save_embeddings(self, embeddings: np.ndarray, texts: List[str], 
                       document_id: str) -> str:
        """
        Save embeddings and associated metadata to disk.
        
        Args:
            embeddings: Numpy array of embeddings
            texts: Original text chunks
            document_id: Unique identifier for the document
        
        Returns:
            Path to saved embedding file
        """
        embedding_data = {
            'embeddings': embeddings,
            'texts': texts,
            'document_id': document_id,
            'model_name': self.model_name,
            'embedding_dim': embeddings.shape[1] if len(embeddings) > 0 else 0
        }
        
        file_path = self.embeddings_dir / f"{document_id}_embeddings.pkl"
        
        with open(file_path, 'wb') as f:
            pickle.dump(embedding_data, f)
        
        print(f"💾 Saved embeddings to: {file_path}")
        return str(file_path)
    
    def load_embeddings(self, document_id: str) -> Optional[dict]:
        """Load embeddings for a specific document."""
        file_path = self.embeddings_dir / f"{document_id}_embeddings.pkl"
        
        if not file_path.exists():
            return None
        
        try:
            with open(file_path, 'rb') as f:
                return pickle.load(f)
        except Exception as e:
            print(f"❌ Error loading embeddings: {e}")
            return None
    
    def get_text_hash(self, text: str) -> str:
        """Generate a hash for text to use as document ID."""
        return hashlib.md5(text.encode()).hexdigest()[:16]
    
    def get_embedding_dim(self) -> int:
        """Get the embedding dimension of the current model."""
        sample_embedding = self.model.encode(["sample text"])
        return sample_embedding.shape[1]