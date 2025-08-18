import os
from pathlib import Path
from dotenv import load_dotenv

# Environment
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
IS_PRODUCTION = ENVIRONMENT == "production"

# Load env file
if IS_PRODUCTION:
    load_dotenv(".env.production")
else:
    load_dotenv(".env")

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = Path("/tmp/documind") if IS_PRODUCTION else BASE_DIR / "data"
DOCUMENT_DIR = DATA_DIR / "documents"
PROCESSED_DIR = DATA_DIR / "processed"

# Create directories
DOCUMENT_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

POPPLER_PATH = os.getenv("POPPLER_PATH", "/usr/bin")

# Database - Railway provides DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Local development
    POSTGRES_USER = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "nani:bakka9")
    POSTGRES_SERVER = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB = os.getenv("POSTGRES_DB", "document_qa")
    DATABASE_URL = f"postgresql+psycopg2://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_SERVER}:{POSTGRES_PORT}/{POSTGRES_DB}"

# Force CPU in production
USE_GPU = False if IS_PRODUCTION else (os.getenv("USE_GPU", "true").lower() == "true")
DEVICE = "cuda" if USE_GPU and not IS_PRODUCTION else "cpu"

# Model - use smaller in production
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2" if IS_PRODUCTION else "intfloat/e5-large-v2"

# API
API_PREFIX = "/api/v1"
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".html"}

# CORS
CORS_ORIGINS = ["*"]  # Update after deployment