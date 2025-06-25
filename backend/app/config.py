import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parents[1] / ".env.example"
load_dotenv(dotenv_path=env_path)

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DOCUMENT_DIR = DATA_DIR / "documents"
PROCESSED_DIR = DATA_DIR / "processed"

POPPLER_PATH = os.getenv("POPPLER_PATH", "/usr/bin")

# Create directories if they don't exist
DOCUMENT_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

# Database settings - SQLite by default
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/document_qa.db")

# File settings
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".html"}

# API settings
API_PREFIX = "/api/v1"

# Environment settings
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
DEBUG = ENVIRONMENT == "development"