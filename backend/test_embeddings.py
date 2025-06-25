import sys
sys.path.append('.')

from app.services.embedding import EmbeddingService
import torch

def test_embeddings():
    print("🧪 Testing Embedding Service...")
    
    # Check GPU availability
    print(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")
    
    # Initialize service
    embedding_service = EmbeddingService()
    
    # Test embedding generation
    test_texts = [
        "This is a test document about machine learning.",
        "Python is a programming language used for AI.",
        "The weather today is sunny and warm."
    ]
    
    embeddings = embedding_service.generate_embeddings(test_texts)
    
    print(f"Generated embeddings shape: {embeddings.shape}")
    print(f"Embedding dimension: {embeddings.shape[1]}")
    
    # Test similarity (should be highest for similar texts)
    from sklearn.metrics.pairwise import cosine_similarity
    similarities = cosine_similarity(embeddings)
    print("Similarity matrix:")
    print(similarities)
    
    print("✅ Embedding test completed!")

if __name__ == "__main__":
    test_embeddings()