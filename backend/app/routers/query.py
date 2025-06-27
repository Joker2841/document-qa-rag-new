from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime  
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor
import time
import hashlib

from app.services.rag_service import RAGService
from app.services.llm import LLMService
from app.database import get_db
from app.models.query import (
    QueryHistoryDB, AnalyticsStatsDB, 
    QueryHistoryResponse, QueryHistoryList,
    AnalyticsStats, PopularQuestion, PopularQuestionsResponse
)
from app.models.document import DocumentDB

logger = logging.getLogger(__name__)

# Initialize services (singleton pattern for better performance)
rag_service = RAGService()
llm_service = LLMService()

# Thread pool for CPU-intensive operations
executor = ThreadPoolExecutor(max_workers=2)

router = APIRouter(prefix="/query", tags=["query"])


# Pydantic models for request/response
class QueryRequest(BaseModel):
    """Request model for asking questions."""
    question: str = Field(..., min_length=3, max_length=1000, description="Question to ask")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of context chunks to retrieve")
    score_threshold: float = Field(default=0.3, ge=0.0, le=1.0, description="Minimum similarity score")
    max_tokens: int = Field(default=512, ge=50, le=2048, description="Maximum tokens in response")
    temperature: float = Field(default=0.3, ge=0.0, le=1.0, description="LLM temperature")


class SourceInfo(BaseModel):
    """Source information for citations."""
    document_name: str
    page: Optional[int] = None
    similarity_score: float
    content: str


class QueryResponse(BaseModel):
    """Response model for question answering."""
    success: bool
    answer: str
    sources: List[SourceInfo]
    llm_used: Optional[str] = None
    response_time: float
    context_chunks_count: int
    error: Optional[str] = None


class SearchRequest(BaseModel):
    """Request model for document search."""
    query: str = Field(..., min_length=3, max_length=500, description="Search query")
    top_k: int = Field(default=10, ge=1, le=50, description="Number of results to return")
    score_threshold: float = Field(default=0.2, ge=0.0, le=1.0, description="Minimum similarity score")


class SearchResponse(BaseModel):
    """Response model for document search."""
    success: bool
    query: str
    results_count: int
    results: List[Dict[str, Any]]
    error: Optional[str] = None


def normalize_question(question: str) -> str:
    """Normalize question for similarity comparison."""
    return question.lower().strip().replace('?', '').replace('.', '').replace(',', '')


def get_question_hash(question: str) -> str:
    """Generate hash for question similarity tracking."""
    normalized = normalize_question(question)
    return hashlib.md5(normalized.encode()).hexdigest()


def save_query_to_history(db: Session, question: str, response: QueryResponse):
    """Save query and response to history."""
    try:
        query_history = QueryHistoryDB(
            question=question,
            answer=response.answer if response.success else None,
            sources_count=len(response.sources),
            response_time=response.response_time,
            llm_used=response.llm_used,
            context_chunks_count=response.context_chunks_count,
            success="true" if response.success else "false",
            similarity_hash=get_question_hash(question)
        )
        db.add(query_history)
        
        # Update analytics stats
        stats = db.query(AnalyticsStatsDB).first()
        if stats:
            stats.total_queries += 1
            # Update avg response time with running average
            total_time = stats.avg_response_time * (stats.total_queries - 1) + response.response_time
            stats.avg_response_time = total_time / stats.total_queries
        
        db.commit()
    except Exception as e:
        logger.error(f"Error saving query to history: {e}")
        db.rollback()


def update_document_count(db: Session):
    """Update document count in analytics."""
    try:
        stats = db.query(AnalyticsStatsDB).first()
        if stats:
            doc_count = db.query(DocumentDB).count()
            stats.total_documents = doc_count
            db.commit()
    except Exception as e:
        logger.error(f"Error updating document count: {e}")


@router.post("/ask", response_model=QueryResponse)
async def ask_question(
    request: QueryRequest,
    db: Session = Depends(get_db)
):
    """
    Ask a question and get an AI-generated answer with proper sources.
    """
    start_time = time.time()
    logger.info(f"🤔 Processing question: '{request.question[:50]}...'")
    
    try:
        # Step 1: Use RAG service for search (your excellent search)
        search_results = rag_service.search_documents(
            query=request.question,
            top_k=request.top_k,
            score_threshold=request.score_threshold
        )
        
        if not search_results.get('success') or not search_results.get('results'):
            logger.warning("No relevant documents found")
            return QueryResponse(
                success=False,
                answer="I couldn't find any relevant information in the documents to answer your question.",
                sources=[],
                response_time=time.time() - start_time,
                context_chunks_count=0,
                error="No relevant documents found"
            )
        
        # Step 2: Get document information for proper source attribution
        chunks = search_results['results'][:request.top_k]
        
        # Enhance chunks with document information
        enhanced_chunks = []
        for chunk in chunks:
            doc_id = chunk.get('document_id')
            if doc_id:
                # Get document info from database
                document = db.query(DocumentDB).filter(DocumentDB.document_id == doc_id).first()
                if document:
                    chunk['document_name'] = document.filename
                    chunk['document_type'] = document.file_type
                else:
                    chunk['document_name'] = f"Document {doc_id}"
            
            enhanced_chunks.append(chunk)
        
        logger.info(f"🧠 Generating answer with {len(enhanced_chunks)} context chunks")
        
        # Step 3: Generate answer using LLM with enhanced chunks
        llm_result = await asyncio.get_event_loop().run_in_executor(
            executor,
            llm_service.generate_answer,
            enhanced_chunks,
            request.question,
            request.max_tokens,
            request.temperature
            
        )
        
        # Step 4: Format sources properly
        sources = []
        seen_documents = set()
        
        for chunk in enhanced_chunks[:3]:  # Top 3 sources
            doc_name = chunk.get('document_name', 'Unknown')
            
            # Avoid duplicate documents
            if doc_name in seen_documents:
                continue
            seen_documents.add(doc_name)
            
            source_info = SourceInfo(
                document_name=doc_name,
                page=chunk.get('page'),
                similarity_score=round(chunk.get('similarity_score', 0.0), 3),
                content=chunk.get('text', '')[:200] + "..." if chunk.get('text') else "No content available"
            )
            sources.append(source_info)
        
        # Step 5: Create response
        response = QueryResponse(
            success=True,
            answer=llm_result['answer'],
            sources=sources,
            llm_used=llm_result.get('llm_used'),
            response_time=time.time() - start_time,
            context_chunks_count=len(enhanced_chunks)
        )
        
        # Step 6: Save to history
        save_query_to_history(db, request.question, response)
        
        logger.info(f"✅ Question answered in {response.response_time:.2f}s using {response.llm_used}")
        
        return response
        
    except Exception as e:
        logger.error(f"❌ Error processing question: {e}")
        return QueryResponse(
            success=False,
            answer="I apologize, but I encountered an error while processing your question.",
            sources=[],
            response_time=time.time() - start_time,
            context_chunks_count=0,
            error=str(e)
        )


@router.get("/history", response_model=QueryHistoryList)
async def get_query_history(
    limit: int = Query(50, ge=1, le=500, description="Maximum number of queries to return"),
    skip: int = Query(0, ge=0, description="Number of queries to skip for pagination"),
    db: Session = Depends(get_db)
):
    """
    Get query history with pagination.
    Returns recent queries ordered by creation time (newest first).
    """
    try:
        # Get total count
        total_count = db.query(QueryHistoryDB).count()
        
        # Get queries with pagination
        queries = (
            db.query(QueryHistoryDB)
            .order_by(desc(QueryHistoryDB.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )
        
        return QueryHistoryList(
            queries=queries,
            count=total_count,
            page=skip // limit + 1,
            limit=limit
        )
        
    except Exception as e:
        logger.error(f"Error fetching query history: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching query history: {str(e)}")


@router.post("/search", response_model=SearchResponse)
async def search_documents(request: SearchRequest):
    """
    Search through uploaded documents for relevant chunks.
    
    Now uses the same high-performance RAG service as /documents/search
    for consistent, excellent search results.
    """
    try:
        logger.info(f"🔍 Searching with RAG service: '{request.query[:50]}...'")
        
        # Use the same RAG service that powers /documents/search
        rag_results = rag_service.search_documents(
            query=request.query,
            top_k=min(request.top_k, 50),  # Reasonable limit
            score_threshold=max(0.0, min(1.0, request.score_threshold))
        )
        
        # Check if RAG service returned results
        if not rag_results.get('success', False):
            return SearchResponse(
                success=False,
                query=request.query,
                results_count=0,
                results=[],
                error=rag_results.get('error', 'Search failed')
            )
        
        # Format results to match SearchResponse schema
        formatted_results = []
        for result in rag_results.get('results', []):
            formatted_result = {
                'text': result.get('text', ''),
                'similarity_score': float(result.get('similarity_score', 0.0)),
                'document_id': result.get('document_id', ''),
                'document_name': result.get('source', result.get('document_name', 'Unknown')),
                'chunk_index': result.get('chunk_index', 0),
                'rank': result.get('rank', len(formatted_results) + 1),
                'metadata': {
                    'page': result.get('page'),
                    'source': result.get('source'),
                    'chunk_id': result.get('chunk_id'),
                    **result.get('metadata', {})
                }
            }
            formatted_results.append(formatted_result)
        
        logger.info(f"✅ RAG search returned {len(formatted_results)} results")
        
        return SearchResponse(
            success=True,
            query=request.query,
            results_count=len(formatted_results),
            results=formatted_results
        )
        
    except Exception as e:
        logger.error(f"❌ Search error: {e}")
        return SearchResponse(
            success=False,
            query=request.query,
            results_count=0,
            results=[],
            error=str(e)
        )


@router.get("/status")
async def get_service_status():
    """
    Get the status of all RAG and LLM services.
    
    Returns information about:
    - Vector store statistics
    - LLM availability
    - GPU status
    - Service health
    """
    try:
        # Get RAG service stats
        rag_stats = rag_service.get_stats()
        
        # Get LLM service status
        llm_status = llm_service.get_service_status()
        
        return {
            "success": True,
            "rag_service": rag_stats,
            "llm_service": llm_status,
            "services_healthy": True
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting service status: {e}")
        return {
            "success": False,
            "error": str(e),
            "services_healthy": False
        }


@router.get("/health")
async def health_check():
    """Simple health check for the query service."""
    try:
        # Test if services are responsive
        test_result = rag_service.get_stats()
        llm_healthy = llm_service.primary_llm is not None
        
        return {
            "status": "healthy",
            "rag_service": "operational",
            "llm_service": "operational" if llm_healthy else "degraded",
            "vector_store_documents": test_result.get('vector_store_stats', {}).get('total_chunks', 0)
        }
        
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        raise HTTPException(status_code=503, detail="Service unhealthy")


# Helper endpoint for testing prompts (development only)
@router.post("/test-prompt")
async def test_prompt(question: str, context: str = "Test context"):
    """
    Test endpoint for prompt engineering.
    Only use this for development and testing.
    """
    try:
        # Create a mock context chunk
        mock_chunks = [{
            'text': context,
            'source': 'test-document',
            'page': 1,
            'similarity_score': 0.9
        }]
        
        # Generate answer
        result = await asyncio.get_event_loop().run_in_executor(
            executor,
            llm_service.generate_answer,
            mock_chunks,
            question
        )
        
        return {
            "success": True,
            "test_question": question,
            "test_context": context,
            "generated_answer": result.get('answer', 'No answer generated'),
            "llm_used": result.get('llm_used', 'unknown')
        }
        
    except Exception as e:
        logger.error(f"❌ Prompt test error: {e}")
        return {
            "success": False,
            "error": str(e)
        }