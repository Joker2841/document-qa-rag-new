import requests
import json
from pathlib import Path
import tempfile

def test_search_endpoint():
    """Test the search API endpoint."""
    BASE_URL = "http://127.0.0.1:8000/api/v1/documents"
    
    print("🧪 Testing Search API Endpoint...")
    
    # First, upload a test document
    test_content = """
    Python is a high-level programming language known for its simplicity and readability.
    It is widely used in web development, data science, artificial intelligence, and automation.
    
    Key features of Python include:
    - Easy to learn and use
    - Extensive standard library
    - Large community and ecosystem
    - Cross-platform compatibility
    """
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write(test_content)
        temp_file = f.name
    
    try:
        # Upload document
        print("📤 Uploading test document...")
        with open(temp_file, 'rb') as f:
            files = {'file': f}
            response = requests.post(f"{BASE_URL}/upload", files=files)
        
        if response.status_code == 200:
            print("✅ Document uploaded successfully")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"❌ Upload failed: {response.status_code}")
            print(f"🔍 Server response: {response.text}")
            return
        
        # Test search
        print("\n🔍 Testing search...")
        search_data = {
            'query': 'What is Python used for?',
            'top_k': 3,
            'score_threshold': 0.2
        }
        
        response = requests.post(f"{BASE_URL}/search", data=search_data)
        
        if response.status_code == 200:
            print("✅ Search successful")
            result = response.json()
            print(f"Found {result.get('results_count', 0)} results")
            
            for i, chunk in enumerate(result.get('results', [])[:2]):
                print(f"\nResult {i+1}:")
                print(f"  Score: {chunk['similarity_score']:.3f}")
                print(f"  Text: {chunk['text'][:150]}...")
        else:
            print(f"❌ Search failed: {response.status_code}")
            print(response.text)
        
        # Test RAG stats
        print("\n📊 Testing RAG stats...")
        response = requests.get(f"{BASE_URL}/rag-stats")
        if response.status_code == 200:
            print("✅ Stats retrieved successfully")
            print(json.dumps(response.json(), indent=2))
        
    finally:
        Path(temp_file).unlink(missing_ok=True)

if __name__ == "__main__":
    test_search_endpoint()