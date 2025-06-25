import os
import tempfile
import pytest
from pathlib import Path

from app.services.document_processor import DocumentProcessor
from app.utils.file_utils import is_valid_file

# File validation test
def test_is_valid_file():
    """Test if file extensions are correctly validated."""
    valid_files = ["test.pdf", "test.docx", "test.txt", "test.md", "test.html"]
    invalid_files = ["test.exe", "test.jpg"]

    for file in valid_files:
        assert is_valid_file(file) is True

    for file in invalid_files:
        assert is_valid_file(file) is False

# Text extraction tests
def test_extract_text_from_txt():
    """Test extracting text from a TXT file."""
    content = "This is a test document.\nIt has multiple lines.\nTesting text extraction functionality."
    
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False, mode="w", encoding="utf-8") as tmp:
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        text = DocumentProcessor.extract_text_from_txt(tmp_path)
        assert all(line in text for line in content.split("\n"))
    finally:
        tmp_path.unlink()

def test_extract_text_from_html():
    """Test extracting text from an HTML file."""
    html_content = """
    <html><body>
        <h1>Main Title</h1>
        <p>This is a paragraph with <b>bold text</b>.</p>
        <div>Another section with content.</div>
    </body></html>
    """

    with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as tmp:
        tmp.write(html_content)
        tmp_path = Path(tmp.name)

    try:
        text = DocumentProcessor.extract_text_from_html(tmp_path)
        assert "Main Title" in text
        assert "This is a paragraph with bold text" in text
        assert "Another section with content" in text
    finally:
        tmp_path.unlink()

def test_extract_text_from_markdown():
    """Test extracting text from a Markdown file."""
    md_content = """
    # Main Title
    This is **bold** text and *italic*.
    - List item 1
    - List item 2
    [Link text](https://example.com)
    """

    with tempfile.NamedTemporaryFile(suffix=".md", delete=False, mode="w", encoding="utf-8") as tmp:
        tmp.write(md_content)
        tmp_path = Path(tmp.name)

    try:
        text = DocumentProcessor.extract_text_from_markdown(tmp_path)
        assert "Main Title" in text
        assert "bold" in text
        assert "italic" in text
    finally:
        tmp_path.unlink()

# Document processing tests
def test_process_document_txt():
    """Test processing a TXT document."""
    content = "This is a comprehensive test document.\nIt contains multiple lines of text.\n" * 5

    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False, mode="w", encoding="utf-8") as tmp:
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        text, char_count = DocumentProcessor.process_document(tmp_path)
        assert "This is a comprehensive test document" in text
        assert char_count > 100
    finally:
        tmp_path.unlink()

def test_process_document_html():
    """Test processing an HTML document."""
    html_content = """
    <html><body>
        <h1>Test Document</h1>
        <p>This is test content for HTML processing.</p>
        <ul>
            <li>Item 1</li>
            <li>Item 2</li>
        </ul>
    </body></html>
    """

    with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w", encoding="utf-8") as tmp:
        tmp.write(html_content)
        tmp_path = Path(tmp.name)

    try:
        text, char_count = DocumentProcessor.process_document(tmp_path)
        assert "Test Document" in text
        assert "Item 1" in text
        assert "Item 2" in text
    finally:
        tmp_path.unlink()

def test_process_document_unsupported():
    """Test processing an unsupported document type."""
    with tempfile.NamedTemporaryFile(suffix=".xyz", delete=False, mode="w", encoding="utf-8") as tmp:
        tmp.write("Some content")
        tmp_path = Path(tmp.name)

    try:
        with pytest.raises(ValueError) as excinfo:
            DocumentProcessor.process_document(tmp_path)
        assert "Unsupported file format" in str(excinfo.value)
    finally:
        tmp_path.unlink()

def test_process_empty_document():
    """Test processing an empty document."""
    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False, mode="w", encoding="utf-8") as tmp:
        tmp.write("")  # Empty file
        tmp_path = Path(tmp.name)

    try:
        text, char_count = DocumentProcessor.process_document(tmp_path)
        assert text == "[Text file is empty]"
        assert char_count == 20 
    finally:
        tmp_path.unlink()

def test_process_large_document():
    """Test processing a large document."""
    content = "\n".join([f"This is line {i} of a large test document." for i in range(1000)])

    with tempfile.NamedTemporaryFile(suffix=".txt", delete=False, mode="w", encoding="utf-8") as tmp:
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        text, char_count = DocumentProcessor.process_document(tmp_path)
        assert "This is line 1 of a large test document" in text
        assert "This is line 999 of a large test document" in text
        assert char_count > 10000
    finally:
        tmp_path.unlink()
