"""
Data Models Package

Contains Pydantic models for API requests/responses and SQLAlchemy models for database.
"""

from .document import (
    DocumentBase,
    DocumentCreate,
    DocumentResponse,
    DocumentList,
    DocumentStatus,
    DocumentDB,
)

# Export all models for easy importing
__all__ = [
    "DocumentBase",
    "DocumentCreate", 
    "DocumentResponse",
    "DocumentList",
    "DocumentStatus",
    "DocumentDB",
]

# Future models will be added here
# from .query import QueryRequest, QueryResponse
# from .user import UserBase, UserCreate, UserResponse