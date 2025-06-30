import faiss
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
import pickle
import json
from pathlib import Path
from app.config import DATA_DIR
from app.services.embedding import EmbeddingService

class VectorStore:
    """FAISS-based vector store with GPU acceleration for semantic search."""
    
    def __init__(self, embedding_service: EmbeddingService):
        """
        Initialize vector store.
        
        Args:
            embedding_service: Service for generating embeddings
        """
        self.embedding_service = embedding_service
        self.embedding_dim = embedding_service.get_embedding_dim()
        
        # FAISS index with GPU support if available
        self.index = None
        self.chunks = []  # Store chunk metadata
        self.is_gpu_enabled = faiss.get_num_gpus() > 0
        
        # Storage paths
        self.vector_store_dir = DATA_DIR / "vector_store"
        self.vector_store_dir.mkdir(parents=True, exist_ok=True)
        self.index_path = self.vector_store_dir / "faiss_index"
        self.chunks_path = self.vector_store_dir / "chunks.json"
        
        # Initialize or load existing index
        self._initialize_index()
        
        print(f"🗂️ VectorStore initialized (GPU: {self.is_gpu_enabled}, Dim: {self.embedding_dim})")
    
    def _initialize_index(self):
        """Initialize FAISS index with GPU support if available."""
        if self.index_path.exists():
            print("📂 Loading existing FAISS index...")
            self._load_index()
        else:
            print("🆕 Creating new FAISS index...")
            self._create_new_index()
            print(f"FAISS index dimension: {self.index.d}")

    def _create_new_index(self):
        """Create a new FAISS index."""
        # Use IndexFlatIP for cosine similarity (after normalization)
        cpu_index = faiss.IndexFlatIP(self.embedding_dim)
        
        if self.is_gpu_enabled:
            print("🚀 Enabling GPU acceleration for FAISS")
            res = faiss.StandardGpuResources()
            self.index = faiss.index_cpu_to_gpu(res, 0, cpu_index)
        else:
            print("💻 Using CPU for FAISS")
            self.index = cpu_index
    
    def add_chunks(self, chunks: List[Dict[str, Any]]) -> int:
        """
        Add chunks to the vector store.
        
        Args:
            chunks: List of chunk dictionaries with 'text' and metadata
        
        Returns:
            Number of chunks added
        """
        if not chunks:
            return 0
        
        print(f"➕ Adding {len(chunks)} chunks to vector store...")
        
        # Extract texts for embedding
        texts = [chunk['text'] for chunk in chunks]
        
        # Generate embeddings
        embeddings = self.embedding_service.generate_embeddings(texts)
        
        # Normalize embeddings for cosine similarity
        embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)
        
        # Add to FAISS index
        self.index.add(embeddings.astype(np.float32))
        
        # Store chunk metadata
        start_idx = len(self.chunks)
        for i, chunk in enumerate(chunks):
            chunk['vector_index'] = start_idx + i
            self.chunks.append(chunk)
        
        print(f"✅ Added {len(chunks)} chunks. Total chunks: {len(self.chunks)}")
        
        # Save updated index and metadata
        self._save_index()
        
        return len(chunks)
    
    def search(self, query: str, top_k: int = 5, 
               score_threshold: float = 0.3, 
               document_ids: List[str] = None) -> List[Dict[str, Any]]:
        """
        Search for similar chunks using semantic similarity.
        
        Args:
            query: Search query
            top_k: Number of top results to return
            score_threshold: Minimum similarity score (0-1)
            document_ids: Optional list of document IDs to filter by
        
        Returns:
            List of similar chunks with scores
        """
        if not self.chunks or self.index.ntotal == 0:
            print("⚠️ Vector store is empty")
            return []
        
        print(f"🔍 Searching for: '{query[:50]}...' (top_k={top_k}, filter_docs={len(document_ids) if document_ids else 'None'})")
        
        # Generate query embedding
        query_embedding = self.embedding_service.generate_embeddings([f"query: {query}"])
        query_embedding = query_embedding / np.linalg.norm(query_embedding, axis=1, keepdims=True)
        
        if document_ids:
            # Option B: Filter during search - Create subset index
            print(f"🎯 Filtering search to {len(document_ids)} selected documents")
            
            # Get indices of chunks belonging to selected documents
            valid_indices = []
            for i, chunk in enumerate(self.chunks):
                if chunk.get('document_id') in document_ids:
                    valid_indices.append(i)
            
            if not valid_indices:
                print("⚠️ No chunks found for selected documents")
                return []
            
            print(f"📊 Found {len(valid_indices)} chunks from selected documents")
            
            # Create temporary index with only selected document chunks
            subset_embeddings = []
            for idx in valid_indices:
                # Extract embedding from main index
                embedding = np.zeros((1, self.embedding_dim), dtype=np.float32)
                self.index.reconstruct(idx, embedding[0])
                subset_embeddings.append(embedding[0])
            
            subset_embeddings = np.array(subset_embeddings).astype(np.float32)
            
            # Create temporary FAISS index
            subset_index = faiss.IndexFlatIP(self.embedding_dim)
            subset_index.add(subset_embeddings)
            
            # Search in subset
            scores, subset_indices = subset_index.search(
                query_embedding.astype(np.float32), 
                min(top_k, len(valid_indices))
            )
            
            # Map back to original chunks
            results = []
            for score, subset_idx in zip(scores[0], subset_indices[0]):
                if subset_idx >= 0 and score >= score_threshold:
                    original_idx = valid_indices[subset_idx]
                    chunk = self.chunks[original_idx].copy()
                    chunk['similarity_score'] = float(score)
                    results.append(chunk)
            
            print(f"✅ Returning {len(results)} results from selected documents")
            
        else:
            # Search in entire index (original behavior)
            scores, indices = self.index.search(
                query_embedding.astype(np.float32), 
                min(top_k, len(self.chunks))
            )
            
            # Format results
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx >= 0 and score >= score_threshold:
                    chunk = self.chunks[idx].copy()
                    chunk['similarity_score'] = float(score)
                    results.append(chunk)
            
            print(f"📊 Found {len(results)} results above threshold {score_threshold}")
        
        return results
    
    def _save_index(self):
        """Save FAISS index and chunk metadata to disk."""
        try:
            # Save FAISS index
            if self.is_gpu_enabled:
                # Move to CPU before saving
                cpu_index = faiss.index_gpu_to_cpu(self.index)
                faiss.write_index(cpu_index, str(self.index_path))
            else:
                faiss.write_index(self.index, str(self.index_path))
            
            # Save chunk metadata
            with open(self.chunks_path, 'w') as f:
                json.dump(self.chunks, f, indent=2)
            
            print(f"💾 Saved vector store with {len(self.chunks)} chunks")
            
        except Exception as e:
            print(f"❌ Error saving vector store: {e}")
    
    def _load_index(self):
        """Load FAISS index and chunk metadata from disk."""
        try:
            # Load FAISS index
            cpu_index = faiss.read_index(str(self.index_path))
            
            if self.is_gpu_enabled and faiss.get_num_gpus() > 0:
                res = faiss.StandardGpuResources()
                self.index = faiss.index_cpu_to_gpu(res, 0, cpu_index)
            else:
                self.index = cpu_index
            
            # Load chunk metadata
            if self.chunks_path.exists():
                with open(self.chunks_path, 'r') as f:
                    self.chunks = json.load(f)
            
            print(f"📂 Loaded vector store with {len(self.chunks)} chunks")
            
        except Exception as e:
            print(f"❌ Error loading vector store: {e}")
            self._create_new_index()
    
    def get_stats(self) -> Dict[str, Any]:
        """Get vector store statistics."""
        return {
            'total_chunks': len(self.chunks),
            'embedding_dimension': self.embedding_dim,
            'gpu_enabled': self.is_gpu_enabled,
            'index_size': self.index.ntotal if self.index else 0,
            'model_name': self.embedding_service.model_name
        }
    
    def clear(self):
        """Clear all data from the vector store."""
        self._create_new_index()
        self.chunks = []
        print("🗑️ Vector store cleared")