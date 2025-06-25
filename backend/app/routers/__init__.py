# routers/__init__.py
"""
FastAPI routers package.

This package contains all the API route handlers for the application.
"""

from . import document, query, analytics

__all__ = ["document", "query", "analytics"]