from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import shutil
import httpx

from app.database.session import get_db
from app.models.document import Document
from app.models.subject import Subject
from app.models.user import User
from app.models.quiz import Quiz
from app.schemas.document import DocumentResponse
from app.api.deps import get_current_user
from app.services.document_service import process_document_background
from app.services.file_storage import (
    delete_file,
    file_exists,
    remote_storage_enabled,
    upload_fileobj,
)

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def _detach_document_quizzes(db: Session, document_id: str) -> None:
    """Keep saved quizzes when their source document is removed."""
    db.query(Quiz).filter(Quiz.document_id == document_id).update(
        {Quiz.document_id: None},
        synchronize_session=False,
    )


@router.get("/", response_model=List[DocumentResponse])
def get_documents(subject_id: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Document).filter(Document.user_id == current_user.id)
    if subject_id:
        query = query.filter(Document.subject_id == subject_id)
    return query.all()

# Changed from async def to def to run in threadpool and avoid blocking event loop
@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    subject_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    import asyncio

    extension = os.path.splitext(file.filename or "")[1].lower()
    if extension not in {".pdf", ".txt", ".docx"}:
        raise HTTPException(status_code=415, detail="Supported file types are PDF, TXT, and DOCX.")
    
    # Verify subject belongs to user
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    unique_filename = f"{uuid.uuid4()}{extension}"
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)

    if remote_storage_enabled():
        file_path = f"{current_user.id}/{unique_filename}"
        try:
            await asyncio.to_thread(
                upload_fileobj,
                file.file,
                file_path,
                file.content_type or "application/octet-stream",
            )
        except (httpx.HTTPError, RuntimeError) as exc:
            raise HTTPException(
                status_code=502,
                detail="Could not save the uploaded file to cloud storage.",
            ) from exc
    else:
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        def write_file():
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

        await asyncio.to_thread(write_file)

    db_document = Document(
        filename=file.filename,
        file_path=file_path,
        file_type=file.content_type or 'application/octet-stream',
        file_size=file_size,
        subject_id=subject_id,
        user_id=current_user.id,
        status="uploading"
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)

    print(f"Adding background task for {db_document.id}", flush=True)
    background_tasks.add_task(process_document_background, db_document.id)
    
    return db_document

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.post("/{document_id}/retry", response_model=DocumentResponse)
def retry_document_processing(
    document_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id,
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    if document.status == "processing":
        raise HTTPException(
            status_code=409,
            detail="This document is already being processed.",
        )
    try:
        file_available = file_exists(document.file_path)
    except (httpx.HTTPError, RuntimeError) as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not check whether the uploaded file is available.",
        ) from exc
    if not file_available:
        raise HTTPException(
            status_code=409,
            detail="The uploaded file is no longer available. Please upload it again.",
        )

    document.status = "uploading"
    db.commit()
    db.refresh(document)
    background_tasks.add_task(process_document_background, document.id)
    return document

@router.delete("/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Remove the local or cloud object before deleting its database record.
    try:
        delete_file(document.file_path)
    except (httpx.HTTPError, OSError, RuntimeError) as exc:
        raise HTTPException(
            status_code=502,
            detail="Could not delete the uploaded file from storage.",
        ) from exc

    # Keep saved quizzes useful after their source document is removed, and
    # release the foreign key before deleting the document row.
    _detach_document_quizzes(db, document.id)

    db.delete(document)
    db.commit()
    return {"message": "Document deleted successfully"}

@router.post("/{document_id}/summarize")
def summarize_document(document_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from app.models.document_chunk import DocumentChunk
    from app.ai.factory import get_ai_provider
    
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).limit(20).all()
    if not chunks:
        raise HTTPException(status_code=400, detail="No processed content found for this document.")
    
    context_str = "\n".join([c.text for c in chunks])
    
    ai_provider = get_ai_provider()
    prompt = "Summarize the following document content. Include Overview, Key Concepts, and Important Definitions. Return markdown format."
    
    try:
        summary = ai_provider.generate_answer(prompt, context_str)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
