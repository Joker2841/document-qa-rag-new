<<<<<<< HEAD
import io
import pytest
from app.config import API_PREFIX


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_upload_invalid_file_type(client):
    file_content = b"Invalid file content"
    response = client.post(
        f"{API_PREFIX}/documents/upload",
        files={"file": ("test.exe", io.BytesIO(file_content), "application/octet-stream")}
    )
    assert response.status_code == 400
    assert "File type not supported" in response.json()["detail"]


def test_upload_txt_file(client):
    file_content = b"This is a test document.\nIt has multiple lines."
    response = client.post(
        f"{API_PREFIX}/documents/upload",
        files={"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.txt"
    assert data["file_type"] == ".txt"
    assert data["status"] == "processed"
    assert data["char_count"] > 0


def test_list_documents(client):
    file_content = b"List test content."
    client.post(
        f"{API_PREFIX}/documents/upload",
        files={"file": ("sample.txt", io.BytesIO(file_content), "text/plain")}
    )
    response = client.get(f"{API_PREFIX}/documents/")
    assert response.status_code == 200
    data = response.json()
    assert "documents" in data
    assert "count" in data
    assert data["count"] > 0
    assert len(data["documents"]) > 0


def test_get_document(client):
    file_content = b"Get doc content."
    upload_response = client.post(
        f"{API_PREFIX}/documents/upload",
        files={"file": ("retrieve.txt", io.BytesIO(file_content), "text/plain")}
    )
    document_id = upload_response.json()["id"]
    response = client.get(f"{API_PREFIX}/documents/{document_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == document_id
    assert data["filename"] == "retrieve.txt"


def test_delete_document(client):
    file_content = b"Delete doc content."
    upload_response = client.post(
        f"{API_PREFIX}/documents/upload",
        files={"file": ("delete_me.txt", io.BytesIO(file_content), "text/plain")}
    )
    document_id = upload_response.json()["id"]
    response = client.delete(f"{API_PREFIX}/documents/{document_id}")
    assert response.status_code == 200
    assert "Document deleted successfully" in response.json()["message"]
    # Confirm it's gone
    response = client.get(f"{API_PREFIX}/documents/{document_id}")
    assert response.status_code == 404
=======
import io
import pytest
from app.config import API_PREFIX


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_upload_invalid_file_type(client):
    file_content = b"Invalid file content"
    response = client.post(
        f"{API_PREFIX}/documents/upload",
        files={"file": ("test.exe", io.BytesIO(file_content), "application/octet-stream")}
    )
    assert response.status_code == 400
    assert "File type not supported" in response.json()["detail"]


def test_upload_txt_file(client):
    file_content = b"This is a test document.\nIt has multiple lines."
    response = client.post(
        f"{API_PREFIX}/documents/upload",
        files={"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "test.txt"
    assert data["file_type"] == ".txt"
    assert data["status"] == "processed"
    assert data["char_count"] > 0


def test_list_documents(client):
    file_content = b"List test content."
    client.post(
        f"{API_PREFIX}/documents/upload",
        files={"file": ("sample.txt", io.BytesIO(file_content), "text/plain")}
    )
    response = client.get(f"{API_PREFIX}/documents/")
    assert response.status_code == 200
    data = response.json()
    assert "documents" in data
    assert "count" in data
    assert data["count"] > 0
    assert len(data["documents"]) > 0


def test_get_document(client):
    file_content = b"Get doc content."
    upload_response = client.post(
        f"{API_PREFIX}/documents/upload",
        files={"file": ("retrieve.txt", io.BytesIO(file_content), "text/plain")}
    )
    document_id = upload_response.json()["id"]
    response = client.get(f"{API_PREFIX}/documents/{document_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == document_id
    assert data["filename"] == "retrieve.txt"


def test_delete_document(client):
    file_content = b"Delete doc content."
    upload_response = client.post(
        f"{API_PREFIX}/documents/upload",
        files={"file": ("delete_me.txt", io.BytesIO(file_content), "text/plain")}
    )
    document_id = upload_response.json()["id"]
    response = client.delete(f"{API_PREFIX}/documents/{document_id}")
    assert response.status_code == 200
    assert "Document deleted successfully" in response.json()["message"]
    # Confirm it's gone
    response = client.get(f"{API_PREFIX}/documents/{document_id}")
    assert response.status_code == 404
>>>>>>> f91b3e2eda8f59064ec768f137e3b6d6957a1fac
