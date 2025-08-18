from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from typing import Dict, Any
import json
import asyncio
import logging
from datetime import datetime
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.llm import LLMService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["websocket"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client {client_id} connected")
    
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            logger.info(f"Client {client_id} disconnected")
    
    async def send_json(self, client_id: str, data: dict):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(data)
    
    async def broadcast(self, data: dict):
        for connection in self.active_connections.values():
            await connection.send_json(data)

manager = ConnectionManager()

@router.websocket("/client/{client_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    client_id: str,
    db: Session = Depends(get_db)
):
    await manager.connect(websocket, client_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "ping":
                # Keep alive
                await manager.send_json(client_id, {"type": "pong"})
            
            elif message_type == "processing_status":
                # Document processing updates will be sent via document_processor
                pass
            
            elif message_type == "stream_answer":
                # Stream answer generation
                await stream_answer_generation(
                    client_id=client_id,
                    question=data.get("question"),
                    context_chunks=data.get("context_chunks", []),
                    conversation_context=data.get("conversation_context", [])
                )
            
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(client_id)

async def stream_answer_generation(
    client_id: str, 
    question: str, 
    context_chunks: list,
    conversation_context: list
):
    """Stream answer generation token by token"""
    try:
        # Send start signal
        await manager.send_json(client_id, {
            "type": "answer_stream_start",
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Build context-aware prompt
        context_prompt = ""
        if conversation_context:
            context_prompt = "Previous conversation:\n"
            for i, qa in enumerate(conversation_context[-3:]):
                context_prompt += f"Q{i+1}: {qa['question']}\n"
                context_prompt += f"A{i+1}: {qa['answer']}\n\n"
            context_prompt += "Current question:\n"
        
        enhanced_question = f"{context_prompt}{question}" if context_prompt else question
        
        # Simulate streaming (in real implementation, modify LLM service to support streaming)
        # For now, we'll simulate by sending words progressively
        llm_service = LLMService()
        
        # Get full answer first (in production, use actual streaming API)
        result = llm_service.generate_answer(
            context_chunks,
            enhanced_question,
            max_tokens=512,
            temperature=0.3
        )
        
        full_answer = result.get('answer', '')
        words = full_answer.split()
        
        # Stream words with natural pacing
        current_text = ""
        for i, word in enumerate(words):
            current_text += word + " "
            
            await manager.send_json(client_id, {
                "type": "answer_stream_chunk",
                "content": current_text,
                "is_complete": False
            })
            
            # Natural typing delay
            await asyncio.sleep(0.05)  # 50ms between words
        
        # Send completion signal
        await manager.send_json(client_id, {
            "type": "answer_stream_end",
            "content": current_text.strip(),
            "is_complete": True,
            "llm_used": result.get('llm_used'),
            "timestamp": datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error streaming answer: {e}")
        await manager.send_json(client_id, {
            "type": "answer_stream_error",
            "error": str(e)
        })

# Export for use in other modules
websocket_manager = manager