from typing import List, Dict, Any
from langchain.text_splitter import RecursiveCharacterTextSplitter
import re

class ChunkingService:
    """Service for intelligently splitting documents into chunks for RAG."""
    
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        """
        Initialize chunking service.
        
        Args:
            chunk_size: Target size of each chunk in characters
            chunk_overlap: Number of characters to overlap between chunks
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        
        # Initialize text splitter with smart separators
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=[
                "\n\n",      # Paragraph breaks
                "\n",        # Line breaks
                ". ",        # Sentence endings
                "! ",        # Exclamations
                "? ",        # Questions
                "; ",        # Semicolons
                ", ",        # Commas
                " ",         # Spaces
                ""           # Character-level fallback
            ],
            length_function=len,
            is_separator_regex=False,
        )
    
    def chunk_text(self, text: str, document_id: str, 
                   metadata: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Split text into chunks with metadata.
        
        Args:
            text: The text to chunk
            document_id: Unique identifier for the document
            metadata: Additional metadata to attach to each chunk
        
        Returns:
            List of dictionaries containing chunk text and metadata
        """
        if not text or not text.strip():
            return []
        
        # Clean and preprocess text
        cleaned_text = self._preprocess_text(text)
        
        # Split into chunks
        chunks = self.text_splitter.split_text(cleaned_text)
        
        # Create chunk objects with metadata
        chunk_objects = []
        for i, chunk in enumerate(chunks):
            chunk_obj = {
                'text': chunk,
                'chunk_id': f"{document_id}_chunk_{i}",
                'document_id': document_id,
                'chunk_index': i,
                'chunk_size': len(chunk),
                'metadata': metadata or {}
            }
            chunk_objects.append(chunk_obj)
        
        print(f"📝 Created {len(chunk_objects)} chunks from document {document_id}")
        return chunk_objects
    
    def _preprocess_text(self, text: str) -> str:
        """Clean and preprocess text before chunking."""
        # Remove excessive whitespace
        text = re.sub(r'\n\s*\n', '\n\n', text)  # Normalize paragraph breaks
        text = re.sub(r' +', ' ', text)          # Remove multiple spaces
        text = text.strip()
        
        return text
    
    def chunk_multiple_documents(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Chunk multiple documents at once.
        
        Args:
            documents: List of document dictionaries with 'text', 'id', and 'metadata'
        
        Returns:
            Flattened list of all chunks from all documents
        """
        all_chunks = []
        
        for doc in documents:
            doc_chunks = self.chunk_text(
                text=doc['text'],
                document_id=doc['id'],
                metadata=doc.get('metadata', {})
            )
            all_chunks.extend(doc_chunks)
        
        return all_chunks