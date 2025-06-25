"""
Week 3 Testing Script - Test RAG + LLM Integration
"""
import asyncio
import aiohttp
import json
import time
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_URL = "http://localhost:8000/api"

async def test_api_endpoints():
    """Test all Week 3 API endpoints."""
    async with aiohttp.ClientSession() as session:
        # Test 1: Health check
        logger.info("🏥 Testing health endpoint...")
        try:
            async with session.get(f"{BASE_URL}/query/health") as response:
                health_data = await response.json()
                logger.info(f"✅ Query health: {health_data}")
        except Exception as e:
            logger.error(f"❌ Query health failed: {e}")

        # Test 2: Service status
        logger.info("📊 Testing service status...")
        try:
            async with session.get(f"{BASE_URL}/query/status") as response:
                status_data = await response.json()
                logger.info(f"✅ Service status: {json.dumps(status_data, indent=2)}")
        except Exception as e:
            logger.error(f"❌ Service status failed: {e}")

        # Test 3: Ask a question (end-to-end test)
        logger.info("❓ Testing /ask endpoint with a sample query...")
        try:
            payload = {
                "question": "What is the capital of France?",
                "top_k": 3
            }
            headers = {'Content-Type': 'application/json'}
            async with session.post(f"{BASE_URL}/query/ask", data=json.dumps(payload), headers=headers) as response:
                answer_data = await response.json()
                logger.info(f"✅ Answer: {json.dumps(answer_data, indent=2)}")
        except Exception as e:
            logger.error(f"❌ /ask endpoint failed: {e}")

if __name__ == "__main__":
    logger.info("🚀 Running Week 3 Integration Tests...")
    asyncio.run(test_api_endpoints())
