from typing import List, Dict, Any, Optional
from app.services.embedding import EmbeddingService
from app.services.chunking import ChunkingService
from app.services.vector_store import VectorStore
from app.services.document_processor import DocumentProcessor
from pathlib import Path

class RAGService:
    """Main service that orchestrates the RAG pipeline."""
    
    def __init__(self):
        """Initialize RAG service with all components."""
        print("🔧 Initializing RAG Service...")
        
        # Initialize components
        self.embedding_service = EmbeddingService()
        self.chunking_service = ChunkingService(chunk_size=1000, chunk_overlap=200)
        self.vector_store = VectorStore(self.embedding_service)
        
        print("✅ RAG Service initialized successfully")
    
    def process_and_store_document(self, file_path: str, document_id: str, 
                                 metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Complete pipeline: extract text, chunk, embed, and store.
        
        Args:
            file_path: Path to the document file
            document_id: Unique identifier for the document
            metadata: Additional metadata for the document
        
        Returns:
            Processing results and statistics
        """
        print(f"📄 Processing document: {document_id}")
        
        try:
            # Step 1: Extract text from document
            text, char_count = DocumentProcessor.process_document(file_path)
            
            if not text.strip():
                return {
                    'success': False,
                    'error': 'No text could be extracted from document',
                    'document_id': document_id
                }
            
            # Step 2: Chunk the text
            doc_metadata = metadata or {}
            doc_metadata.update({
                'file_path': str(file_path),
                'char_count': char_count,
                'filename': Path(file_path).name
            })
            
            chunks = self.chunking_service.chunk_text(
                text=text,
                document_id=document_id,
                metadata=doc_metadata
            )
            
            # Step 3: Add chunks to vector store
            chunks_added = self.vector_store.add_chunks(chunks)
            
            result = {
                'success': True,
                'document_id': document_id,
                'char_count': char_count,
                'chunks_created': len(chunks),
                'chunks_added': chunks_added,
                'metadata': doc_metadata
            }
            
            print(f"✅ Successfully processed document {document_id}")
            return result
            
        except Exception as e:
            error_result = {
                'success': False,
                'error': str(e),
                'document_id': document_id
            }
            print(f"❌ Error processing document {document_id}: {e}")
            return error_result
    
    def search_documents(self, query: str, top_k: int = 5, 
                        score_threshold: float = 0.3,
                        document_ids: List[str] = None) -> Dict[str, Any]:
        """
        Search for relevant document chunks.
        
        Args:
            query: Search query
            top_k: Number of top results to return
            score_threshold: Minimum similarity score
            document_ids: Optional list of document IDs to filter by
        
        Returns:
            Search results with metadata
        """
        print(f"🔍 Searching for: '{query}'")
        if document_ids:
            print(f"📌 Filtering to {len(document_ids)} selected documents")
        
        try:
            results = self.vector_store.search(
                query=query,
                top_k=top_k,
                score_threshold=score_threshold,
                document_ids=document_ids
            )
            
            return {
                'success': True,
                'query': query,
                'results_count': len(results),
                'results': results,
                'filtered_by_documents': document_ids is not None,
                'vector_store_stats': self.vector_store.get_stats()
            }
            
        except Exception as e:
            print(f"❌ Search error: {e}")
            return {
                'success': False,
                'error': str(e),
                'query': query,
                'results': []
            }
    
    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive RAG service statistics."""
        return {
            'vector_store_stats': self.vector_store.get_stats(),
            'embedding_model': self.embedding_service.model_name,
            'chunk_size': self.chunking_service.chunk_size,
            'chunk_overlap': self.chunking_service.chunk_overlap
        }