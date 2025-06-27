import os
from typing import List, Optional
from pathlib import Path
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session
from app.services.rag_service import RAGService
from app.config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE
from app.models.document import DocumentCreate, DocumentList, DocumentResponse, DocumentDB
from app.services.document_processor import DocumentProcessor
from app.utils.file_utils import get_file_path, save_uploaded_file
from app.database import get_db
from datetime import datetime
from fastapi.responses import FileResponse, Response
import mimetypes

rag_service = RAGService()
router = APIRouter(
    prefix="/documents",
    tags=["documents"],
    responses={404: {"description": "Not found"}},
)


@router.post("/search")
async def search_documents(
    query: str = Form(...),
    top_k: int = Form(5),
    score_threshold: float = Form(0.3)
):
    """Search for relevant document chunks using semantic similarity."""
    try:
        if not query.strip():
            return {"success": False, "error": "Query cannot be empty"}
        
        results = rag_service.search_documents(
            query=query,
            top_k=min(top_k, 20),  # Limit to max 20 results
            score_threshold=max(0.0, min(1.0, score_threshold))  # Clamp between 0-1
        )
        
        return results
        
    except Exception as e:
        return {"success": False, "error": f"Search failed: {str(e)}"}

@router.get("/rag-stats")
async def get_rag_stats():
    """Get RAG service statistics."""
    try:
        return rag_service.get_stats()
    except Exception as e:
        return {"error": f"Could not get stats: {str(e)}"}

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a document file (PDF, DOCX, TXT, etc.) to the system.
    The file will be saved and processed for text extraction and indexed into the RAG pipeline.
    """
    # Validate file size
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File size exceeds the maximum allowed size ({MAX_FILE_SIZE/(1024*1024)}MB)"
        )
    
    # Validate file extension
    if not DocumentProcessor.is_valid_file(file.filename):
        allowed = ", ".join(ALLOWED_EXTENSIONS)
        raise HTTPException(
            status_code=400,
            detail=f"File type not supported. Allowed types: {allowed}"
        )
    
    try:
        # Save file and generate metadata
        file_id, file_path = save_uploaded_file(file)
        document_id = f"{file_id}_{file.filename}"
        metadata = {
            'original_filename': file.filename,
            'file_size': file.size,
            'upload_timestamp': datetime.utcnow().isoformat(),
            'file_hash': file_id
        }
        
        # Extract text from document
        text, char_count = DocumentProcessor.process_document(file_path)
        
        # Process through RAG pipeline
        rag_result = rag_service.process_and_store_document(
            file_path=str(file_path),
            document_id=document_id,
            metadata=metadata
        )
        
        if not rag_result['success']:
            raise HTTPException(
                status_code=500,
                detail=f"RAG processing failed: {rag_result.get('error', 'Unknown error')}"
            )

        # Create and save document entry in DB
        document = DocumentDB(
            id=file_id,
            filename=file.filename,
            file_path=str(file_path),
            file_type=os.path.splitext(file.filename)[1].lower(),
            processed_path=str(file_path.parent.parent / "processed" / f"{file_id}.txt"),
            status="processed",
            char_count=char_count,
            chunks_created=rag_result['chunks_created'],
            document_id=document_id
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        return document
        
    except Exception as e:
        # Clean up file if something went wrong
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while processing the document: {str(e)}"
        )



@router.get("/", response_model=DocumentList)
async def list_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    List all uploaded documents with pagination, sorted by latest.
    """
    try:
        documents = db.query(DocumentDB).order_by(DocumentDB.created_at.desc()).offset(skip).limit(limit).all()
        total_count = db.query(DocumentDB).count()
        
        return DocumentList(documents=documents, count=total_count)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str, db: Session = Depends(get_db)):
    """
    Get a specific document by ID.
    """
    document = db.query(DocumentDB).filter(DocumentDB.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document


@router.delete("/{document_id}", response_model=dict)
async def delete_document(document_id: str, db: Session = Depends(get_db)):
    """
    Delete a document by ID.
    """
    document = db.query(DocumentDB).filter(DocumentDB.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Delete file from storage
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
        
        # Delete processed file if exists
        if document.processed_path and os.path.exists(document.processed_path):
            os.remove(document.processed_path)
        
        # Delete from database
        db.delete(document)
        db.commit()
        
        return {"message": "Document deleted successfully"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while deleting the document: {str(e)}"
        )
    
@router.post("/reset-vector-store", response_model=dict)
async def reset_vector_store_and_rebuild(db: Session = Depends(get_db)):
    """
    Admin-only endpoint: Clears the vector store and reprocesses all documents.
    """
    try:
        rag_service.vector_store.clear()
        
        documents = db.query(DocumentDB).all()
        reprocessed = []
        for doc in documents:
            result = rag_service.process_and_store_document(
                file_path=doc.file_path,
                document_id=doc.document_id,
                metadata={
                    'original_filename': doc.filename,
                    'file_size': os.path.getsize(doc.file_path),
                    'upload_timestamp': doc.created_at.isoformat(),
                    'file_hash': doc.id
                }
            )
            if result['success']:
                reprocessed.append(doc.document_id)

        return {
            "success": True,
            "message": f"Vector store cleared and rebuilt for {len(reprocessed)} documents.",
            "documents_reprocessed": reprocessed
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")
    

@router.get("/{document_id}/content")
async def get_document_content(document_id: str, db: Session = Depends(get_db)):
    """
    Get the processed text content of a specific document.
    Returns the extracted text content from the document.
    """
    # Get document from database
    document = db.query(DocumentDB).filter(DocumentDB.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Try to read from processed file first
        if document.processed_path and os.path.exists(document.processed_path):
            with open(document.processed_path, 'r', encoding='utf-8') as f:
                content = f.read()
        elif os.path.exists(document.file_path):
            # If processed file doesn't exist, extract content on-the-fly
            content, _ = DocumentProcessor.process_document(document.file_path)
        else:
            raise HTTPException(status_code=404, detail="Document file not found on disk")
        
        return {
            "success": True,
            "document_id": document_id,
            "filename": document.filename,
            "content": content,
            "char_count": len(content),
            "file_type": document.file_type
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error reading document content: {str(e)}"
        )
    
@router.get("/{document_id}/preview")
async def preview_document(
    document_id: str,
    db: Session = Depends(get_db)
):
    """
    Preview a document in the browser.
    """
    document = db.query(DocumentDB).filter(DocumentDB.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = Path(document.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")
    
    # Determine content type
    content_type, _ = mimetypes.guess_type(str(file_path))
    if not content_type:
        content_type = "application/octet-stream"
    
    # For PDFs and images, browsers can display them inline
    if content_type in ["application/pdf", "image/jpeg", "image/png", "image/gif"]:
        return FileResponse(
            path=str(file_path),
            media_type=content_type,
            headers={
                "Content-Disposition": f"inline; filename={document.filename}"
            }
        )
    else:
        # For other files, return the content as text if possible
        try:
            if document.processed_path and Path(document.processed_path).exists():
                # Return processed text content
                with open(document.processed_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                return Response(
                    content=content,
                    media_type="text/plain",
                    headers={
                        "Content-Disposition": f"inline; filename={document.filename}.txt"
                    }
                )
            else:
                # Try to read original file as text
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                return Response(
                    content=content,
                    media_type="text/plain"
                )
        except:
            # If can't read as text, force download
            return FileResponse(
                path=str(file_path),
                media_type=content_type,
                filename=document.filename
            )

@router.get("/{document_id}/download")
async def download_document(
    document_id: str,
    db: Session = Depends(get_db)
):
    """
    Download a document.
    """
    document = db.query(DocumentDB).filter(DocumentDB.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = Path(document.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")
    
    # Force download with attachment disposition
    return FileResponse(
        path=str(file_path),
        media_type="application/octet-stream",
        filename=document.filename,
        headers={
            "Content-Disposition": f"attachment; filename={document.filename}"
        }
    )

@router.get("/{document_id}/content")
async def get_document_content(
    document_id: str,
    db: Session = Depends(get_db)
):
    """
    Get the extracted text content of a document.
    """
    document = db.query(DocumentDB).filter(DocumentDB.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Try to get processed content first
    if document.processed_path and Path(document.processed_path).exists():
        try:
            with open(document.processed_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return {
                "success": True,
                "document_id": document_id,
                "filename": document.filename,
                "content": content,
                "char_count": len(content)
            }
        except Exception as e:
            logger.error(f"Error reading processed content: {e}")
    
    # If no processed content, try to extract on the fly
    try:
        from app.services.document_processor import DocumentProcessor
        text, char_count = DocumentProcessor.process_document(document.file_path)
        return {
            "success": True,
            "document_id": document_id,
            "filename": document.filename,
            "content": text,
            "char_count": char_count
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Could not extract content: {str(e)}",
            "document_id": document_id,
            "filename": document.filename
        }

