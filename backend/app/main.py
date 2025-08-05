import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import torch

from app.config import API_PREFIX
from app.routers import document, query, analytics, websocket  # Added analytics router
from app.database import init_db
from app.models.document import DocumentDB
import os

print("SYSTEM PATH:", os.environ["PATH"])

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Document Q&A with RAG",
    description="API for document upload and question answering using RAG",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database and services on startup."""
    try:
        # Initialize database
        init_db()
        
        # Log GPU status
        if torch.cuda.is_available():
            gpu_name = torch.cuda.get_device_name(0)
            gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
            logger.info(f"🚀 GPU Available: {gpu_name} ({gpu_memory:.1f}GB)")
        else:
            logger.info("💻 Running on CPU")
        
        logger.info("✅ Application startup completed successfully")
        
    except Exception as e:
        logger.error(f"❌ Error during startup: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("🔄 Application shutting down...")


# Include routers
app.include_router(document.router, prefix=API_PREFIX)
app.include_router(query.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)  # Added analytics router
app.include_router(websocket.router)


@app.get("/")
async def root():
    """API health check endpoint."""
    return {
        "status": "ok", 
        "message": "Document Q&A API is running",
        "gpu_available": torch.cuda.is_available(),
        "version": "0.1.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check endpoint."""
    gpu_info = {}
    if torch.cuda.is_available():
        gpu_info = {
            "gpu_available": True,
            "gpu_name": torch.cuda.get_device_name(0),
            "gpu_memory_gb": round(torch.cuda.get_device_properties(0).total_memory / 1024**3, 1)
        }
    else:
        gpu_info = {"gpu_available": False}
    
    return {
        "status": "healthy",
        "version": "0.1.0",
        "api_prefix": API_PREFIX,
        "database": "connected",
        **gpu_info
    }