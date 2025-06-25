import os
import tempfile
import pytest

from app.services.document_processor import DocumentProcessor
from app.utils.file_utils import is_valid_file


def test_is_valid_file():
    """Test file extension validation."""
    assert is_valid_file("test.pdf") is True
    assert is_valid_file("test.docx") is True
    assert is_valid_file("test.txt") is True
    assert is_valid_file("test.md") is True
    assert is_valid_file("test.html") is True
    assert is_valid_file("test.exe") is False
    assert is_valid_file("test.jpg") is False


def test_extract_text_from_txt():
    """Test extracting text from a TXT file."""
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as tmp:
        tmp.write(b"This is a test document.\nIt has multiple lines.")
        tmp_path = tmp.name
    
    try:
        text = DocumentProcessor.extract_text_from_txt(tmp_path)
        assert "This is a test document" in text
        assert "It has multiple lines" in text
    finally:
        os.unlink(tmp_path)


def test_process_document_txt():
    """Test processing a TXT document."""
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as tmp:
        content = "This is a test document.\nIt has multiple lines.\n" * 5
        tmp.write(content.encode())
        tmp_path = tmp.name
    
    try:
        text, char_count = DocumentProcessor.process_document(tmp_path)
        assert "This is a test document" in text
        assert char_count > 0
        assert char_count == len(text)
    finally:
        os.unlink(tmp_path)


def test_process_document_unsupported():
    """Test processing an unsupported document type."""
    with tempfile.NamedTemporaryFile(suffix=".xyz", delete=False) as tmp:
        tmp.write(b"Some content")
        tmp_path = tmp.name
    
    try:
        with pytest.raises(ValueError) as excinfo:
            DocumentProcessor.process_document(tmp_path)
        assert "Unsupported file format" in str(excinfo.value)
    finally:
        os.unlink(tmp_path)