import re
from typing import List


def clean_text(text: str) -> str:
    """Clean extracted text by removing extra whitespaces, etc."""
    # Replace multiple newlines with a single one
    text = re.sub(r'\n+', '\n', text)
    
    # Replace multiple spaces with a single one
    text = re.sub(r' +', ' ', text)
    
    # Remove leading/trailing whitespace
    text = text.strip()
    
    return text


def is_meaningful_text(text: str, min_length: int = 10) -> bool:
    """Check if text contains meaningful content."""
    # Remove whitespace and check if remaining content meets minimum length
    cleaned = re.sub(r'\s', '', text)
    return len(cleaned) >= min_length


def extract_filename_from_path(file_path: str) -> str:
    """Extract original filename from a path."""
    return file_path.split('/')[-1]