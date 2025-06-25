#!/usr/bin/env python3
"""
Week 2 RAG Implementation Troubleshooting Script
Run this to verify all components are working correctly
"""

import sys
import os
sys.path.append('.')

def check_gpu_setup():
    """Check if GPU is properly configured"""
    print("🔍 Checking GPU Setup...")
    
    try:
        import torch
        print(f"  ✅ PyTorch installed: {torch.__version__}")
        print(f"  ✅ CUDA available: {torch.cuda.is_available()}")
        
        if torch.cuda.is_available():
            print(f"  ✅ GPU: {torch.cuda.get_device_name(0)}")
            print(f"  ✅ GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
        else:
            print("  ⚠️  CUDA not available - will use CPU")
        
        return True
    except ImportError as e:
        print(f"  ❌ PyTorch not installed: {e}")
        return False

def check_dependencies():
    """Check if all required packages are installed"""
    print("\n📦 Checking Dependencies...")
    
    required_packages = [
        'sentence_transformers',
        'faiss',
        'langchain',
        'langchain_community',
        'numpy',
        'sklearn'
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package)
            print(f"  ✅ {package} installed")
        except ImportError:
            print(f"  ❌ {package} missing")
            missing.append(package)
    
    if missing:
        print(f"\n  Install missing packages:")
        print(f"  pip install {' '.join(missing)}")
        return False
    
    return True

def test_embedding_service():
    """Test the embedding service"""
    print("\n🤖 Testing Embedding Service...")
    
    try:
        from app.services.embedding import EmbeddingService
        
        # Initialize service
        service = EmbeddingService()
        print(f"  ✅ Service initialized on {service.device}")
        
        # Test embedding generation
        test_texts = ["Hello world", "Test document"]
        embeddings = service.generate_embeddings(test_texts, batch_size=2)
        
        print(f"  ✅ Generated embeddings: {embeddings.shape}")
        print(f"  ✅ Embedding dimension: {service.get_embedding_dim()}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Embedding service failed: {e}")
        return False

def test_chunking_service():
    """Test the chunking service"""
    print("\n📄 Testing Chunking Service...")
    
    try:
        from app.services.chunking import ChunkingService
        
        service = ChunkingService()
        
        test_text = """
        This is a test document with multiple paragraphs.
        
        The second paragraph contains different information.
        It should be split appropriately by the chunking service.
        
        This is the third paragraph with more content to test
        the chunking algorithm and ensure it works correctly.
        """
        
        chunks = service.chunk_text(test_text, "test_doc")
        
        print(f"  ✅ Created {len(chunks)} chunks")
        for i, chunk in enumerate(chunks[:2]):
            print(f"  ✅ Chunk {i+1}: {len(chunk['text'])} chars")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Chunking service failed: {e}")
        return False

def test_vector_store():
    """Test the vector store"""
    print("\n🗂️  Testing Vector Store...")
    
    try:
        from app.services.embedding import EmbeddingService
        from app.services.vector_store import VectorStore
        
        embedding_service = EmbeddingService()
        vector_store = VectorStore(embedding_service)
        
        # Test adding chunks
        test_chunks = [
            {
                'text': 'Python is a programming language',
                'chunk_id': 'test_1',
                'document_id': 'test_doc',
                'chunk_index': 0
            },
            {
                'text': 'Machine learning uses algorithms',
                'chunk_id': 'test_2', 
                'document_id': 'test_doc',
                'chunk_index': 1
            }
        ]
        
        added = vector_store.add_chunks(test_chunks)
        print(f"  ✅ Added {added} chunks to vector store")
        
        # Test search
        results = vector_store.search("programming language", top_k=2)
        print(f"  ✅ Search returned {len(results)} results")
        
        if results:
            print(f"  ✅ Top result score: {results[0]['similarity_score']:.3f}")
        
        # Print stats
        stats = vector_store.get_stats()
        print(f"  ✅ Vector store stats: {stats}")
        
        return True
        
    except Exception as e:
        print(f"  ❌ Vector store failed: {e}")
        return False

def test_rag_service():
    """Test the complete RAG service"""
    print("\n🔧 Testing RAG Service...")
    
    try:
        from app.services.rag_service import RAGService
        import tempfile
        
        # Create test document
        test_content = """
        Artificial Intelligence is transforming industries worldwide.
        Machine learning algorithms can identify patterns in data.
        Deep learning uses neural networks for complex tasks.
        """
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(test_content)
            temp_file = f.name
        
        try:
            rag_service = RAGService()
            print("  ✅ RAG service initialized")
            
            # Test document processing
            result = rag_service.process_and_store_document(
                file_path=temp_file,
                document_id="test_ai",
                metadata={'test': True}
            )
            
            if result['success']:
                print(f"  ✅ Document processed: {result['chunks_created']} chunks")
            else:
                print(f"  ❌ Document processing failed: {result['error']}")
                return False
            
            # Test search
            search_result = rag_service.search_documents("machine learning", top_k=2)
            
            if search_result['success']:
                print(f"  ✅ Search successful: {search_result['results_count']} results")
                if search_result['results']:
                    print(f"  ✅ Top result score: {search_result['results'][0]['similarity_score']:.3f}")
            else:
                print(f"  ❌ Search failed: {search_result['error']}")
                return False
            
            return True
            
        finally:
            os.unlink(temp_file)
            
    except Exception as e:
        print(f"  ❌ RAG service failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Week 2 RAG Implementation Verification")
    print("=" * 50)
    
    tests = [
        ("GPU Setup", check_gpu_setup),
        ("Dependencies", check_dependencies), 
        ("Embedding Service", test_embedding_service),
        ("Chunking Service", test_chunking_service),
        ("Vector Store", test_vector_store),
        ("RAG Service", test_rag_service)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"  ❌ {test_name} crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    
    passed = 0
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"  {status} {test_name}")
        if success:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("🎉 All tests passed! Your Week 2 implementation is ready!")
        print("\nNext steps:")
        print("1. Start your FastAPI server: uvicorn app.main:app --reload")
        print("2. Test the API endpoints with sample documents")
        print("3. Monitor GPU usage during embedding generation")
    else:
        print("⚠️  Some tests failed. Please check the errors above.")
        print("Common fixes:")
        print("- Install missing dependencies")
        print("- Check CUDA installation for GPU support")
        print("- Verify file paths and permissions")

if __name__ == "__main__":
    main()