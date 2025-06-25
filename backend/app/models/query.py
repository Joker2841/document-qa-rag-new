from datetime import datetime
from typing import List, Optional, Dict, Any

from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import Column, DateTime, Integer, String, Text, Float
from app.database import Base

# SQLAlchemy model for storing query history
class QueryHistoryDB(Base):
    __tablename__ = "query_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=True)
    sources_count = Column(Integer, default=0)
    response_time = Column(Float, default=0.0)
    llm_used = Column(String, nullable=True)
    context_chunks_count = Column(Integer, default=0)
    success = Column(String, default="true")  # Using string for SQLite compatibility
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # For analytics - track popular questions
    similarity_hash = Column(String, nullable=True)  # Hash of normalized question for similarity matching

# SQLAlchemy model for analytics/stats
class AnalyticsStatsDB(Base):
    __tablename__ = "analytics_stats"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    total_queries = Column(Integer, default=0)
    total_documents = Column(Integer, default=0)
    avg_response_time = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Pydantic models for API responses

class QueryHistoryResponse(BaseModel):
    """Query history response model."""
    id: int
    question: str
    answer: Optional[str] = None
    sources_count: int
    response_time: float
    llm_used: Optional[str] = None
    context_chunks_count: int
    success: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class QueryHistoryList(BaseModel):
    """List of query history response."""
    queries: List[QueryHistoryResponse]
    count: int
    page: int
    limit: int

class AnalyticsStats(BaseModel):
    """Analytics statistics response."""
    total_queries: int
    total_documents: int
    avg_response_time: float
    successful_queries: int
    failed_queries: int
    last_updated: datetime
    top_llm_used: Optional[str] = None

class PopularQuestion(BaseModel):
    """Popular question response."""
    question: str
    frequency: int
    avg_response_time: float
    success_rate: float
    last_asked: datetime

class PopularQuestionsResponse(BaseModel):
    """List of popular questions."""
    questions: List[PopularQuestion]
    total_unique_questions: int