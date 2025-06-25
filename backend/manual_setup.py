#!/usr/bin/env python3
"""
Quick setup test script for Week 1
"""
import requests
import io
import os

def test_api():
    base_url = "http://localhost:8000"
    
    # Test 1: Health check
    print("🔍 Testing health check...")
    response = requests.get(f"{base_url}/")
    if response.status_code == 200:
        print("✅ Health check passed")
        print(f"   Response: {response.json()}")
    else:
        print("❌ Health check failed")
        return False
    
    # Test 2: Upload a simple text file
    print("\n🔍 Testing file upload...")
    test_content = """This is a test document for the RAG system.
It contains multiple lines of text.
This will help us verify that document processing works correctly.
The system should be able to extract this text and store it properly."""
    
    files = {
        'file': ('test_document.txt', io.StringIO(test_content), 'text/plain')
    }
    
    response = requests.post(f"{base_url}/api/v1/documents/upload", files=files)
    if response.status_code == 200:
        print("✅ File upload passed")
        data = response.json()
        print(f"   Document ID: {data['id']}")
        print(f"   Filename: {data['filename']}")
        print(f"   Status: {data['status']}")
        print(f"   Character count: {data['char_count']}")
        document_id = data['id']
    else:
        print("❌ File upload failed")
        print(f"   Error: {response.json()}")
        return False
    
    # Test 3: List documents
    print("\n🔍 Testing document listing...")
    response = requests.get(f"{base_url}/api/v1/documents/")
    if response.status_code == 200:
        print("✅ Document listing passed")
        data = response.json()
        print(f"   Total documents: {data['count']}")
        print(f"   Documents in response: {len(data['documents'])}")
    else:
        print("❌ Document listing failed")
        return False
    
    # Test 4: Get specific document
    print("\n🔍 Testing specific document retrieval...")
    response = requests.get(f"{base_url}/api/v1/documents/{document_id}")
    if response.status_code == 200:
        print("✅ Document retrieval passed")
        data = response.json()
        print(f"   Retrieved document: {data['filename']}")
    else:
        print("❌ Document retrieval failed")
        return False
    
    print("\n🎉 All tests passed! Your Week 1 implementation is working correctly.")
    return True

if __name__ == "__main__":
    print("Starting API tests...")
    print("Make sure your API is running on http://localhost:8000")
    print("=" * 50)
    
    try:
        test_api()
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API. Make sure it's running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")