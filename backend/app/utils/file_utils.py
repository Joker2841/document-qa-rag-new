import os
import uuid
from pathlib import Path
from typing import Optional, Tuple

from fastapi import UploadFile

from app.config import ALLOWED_EXTENSIONS, DOCUMENT_DIR


def is_valid_file(filename: str) -> bool:
    """Check if file has allowed extension."""
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS


def save_uploaded_file(file: UploadFile) -> Tuple[str, Path]:
    """
    Save uploaded file to disk and return file ID and path.
    
    Args:
        file: The uploaded file
    
    Returns:
        Tuple containing file_id and file_path
    """
    # Generate unique ID for the file
    file_id = str(uuid.uuid4())
    
    # Extract original extension
    original_extension = Path(file.filename).suffix.lower()
    
    # Create file path with original name and extension
    safe_filename = f"{file_id}{original_extension}"
    file_path = DOCUMENT_DIR / safe_filename
    
    # Write file to disk
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())
    
    return file_id, file_path


def get_file_path(file_id: str, extension: Optional[str] = None) -> Path:
    """Get file path from file ID."""
    if extension:
        return DOCUMENT_DIR / f"{file_id}{extension}"
    
    # If extension not provided, try to find the file
    for file in DOCUMENT_DIR.iterdir():
        if file.stem == file_id:
            return file
    
    raise FileNotFoundError(f"File with ID {file_id} not found")