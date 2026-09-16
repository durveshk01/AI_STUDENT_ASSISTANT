from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import shutil

from app.database.session import get_db
from app.models.document import Document
from app.models.subject import Subject
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.api.deps import get_current_user
from app.services.document_service import process_document_background

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[DocumentResponse])
def get_documents(subject_id: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Document).filter(Document.user_id == current_user.id)
    if subject_id:
        query = query.filter(Document.subject_id == subject_id)
    return query.all()

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    subject_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Verify subject belongs to user
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_size = os.path.getsize(file_path)

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

    background_tasks.add_task(process_document_background, db, db_document.id)
    
    return db_document

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return document

@router.delete("/{document_id}")
def delete_document(document_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    document = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Delete physical file
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
        
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
    context_str = "\n".join([c.text for c in chunks])
    
    ai_provider = get_ai_provider()
    prompt = "Summarize the following document content. Include Overview, Key Concepts, and Important Definitions. Return markdown format."
    
    try:
        summary = ai_provider.generate_answer(prompt, context_str)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
