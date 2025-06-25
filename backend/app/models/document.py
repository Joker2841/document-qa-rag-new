from datetime import datetime
from typing import List

from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import Column, DateTime, Integer, String
# from sqlalchemy.orm import declarative_base  # Fixed deprecated import
# Base = declarative_base()
from app.database import Base

# SQLAlchemy model for the database
class DocumentDB(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    processed_path = Column(String, nullable=True)
    status = Column(String, default="uploaded")  # Options: uploaded, processed, indexed
    char_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    chunks_created = Column(Integer, default=0)
    document_id = Column(String, nullable=True)
# Pydantic models for API

class DocumentBase(BaseModel):
    """Base document model with common attributes."""
    filename: str
    file_type: str


class DocumentCreate(DocumentBase):
    """Document creation model."""
    pass


class DocumentResponse(DocumentBase):
    """Document response model with all fields."""
    id: str
    status: str
    char_count: int
    created_at: datetime

    # Updated for Pydantic V2 instead of using Config.orm_mode = True
    model_config = ConfigDict(from_attributes=True)


class DocumentList(BaseModel):
    """List of documents response."""
    documents: List[DocumentResponse]
    count: int

    model_config = ConfigDict(from_attributes=True)


class DocumentStatus(BaseModel):
    """Document status update."""
    status: str = Field(..., description="Status of the document processing")