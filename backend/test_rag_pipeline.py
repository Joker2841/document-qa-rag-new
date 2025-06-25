import sys
sys.path.append('.')

from app.services.rag_service import RAGService
from pathlib import Path
import tempfile

def test_rag_pipeline():
    print("🧪 Testing Full RAG Pipeline...")
    
    # Create a test document
    test_content = """
    Artificial Intelligence (AI) is a branch of computer science that aims to create 
    intelligent machines. Machine Learning is a subset of AI that focuses on the 
    development of algorithms that can learn and make decisions from data.
    
    Deep Learning is a subset of machine learning that uses neural networks with 
    multiple layers. It has been particularly successful in image recognition, 
    natural language processing, and speech recognition.
    
    Large Language Models (LLMs) like GPT are examples of deep learning models 
    that can understand and generate human-like text.
    """
    
    # Save to temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write(test_content)
        temp_file = f.name
    
    try:
        # Initialize RAG service
        rag_service = RAGService()
        
        # Test document processing
        print("\n📄 Testing document processing...")
        result = rag_service.process_and_store_document(
            file_path=temp_file,
            document_id="test_ai_doc",
            metadata={'test': True}
        )
        
        print(f"Processing result: {result}")
        
        # Test search
        print("\n🔍 Testing search...")
        test_queries = [
            "What is machine learning?",
            "Tell me about deep learning",
            "What are neural networks?",
            "How does AI work?"
        ]
        
        for query in test_queries:
            print(f"\nQuery: {query}")
            search_result = rag_service.search_documents(
                query=query,
                top_k=3,
                score_threshold=0.2
            )
            
            print(f"Found {search_result['results_count']} results")
            for i, result in enumerate(search_result['results'][:2]):
                print(f"  Result {i+1} (score: {result['similarity_score']:.3f}):")
                print(f"    {result['text'][:100]}...")
        
        # Print stats
        print("\n📊 RAG Service Stats:")
        stats = rag_service.get_stats()
        print(stats)
        
        print("\n✅ RAG pipeline test completed successfully!")
        
    finally:
        # Clean up
        Path(temp_file).unlink(missing_ok=True)

if __name__ == "__main__":
    test_rag_pipeline()