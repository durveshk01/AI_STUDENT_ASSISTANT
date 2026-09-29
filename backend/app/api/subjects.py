from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import httpx

from app.database.session import get_db
from app.models.subject import Subject
from app.models.document import Document
from app.models.user import User
from app.models.quiz import Quiz
from app.models.flashcard import FlashcardDeck
from app.models.chat import Conversation
from app.schemas.subject import SubjectCreate, SubjectResponse, SubjectUpdate
from app.api.deps import get_current_user
from app.services.file_storage import delete_file

router = APIRouter()

@router.get("/", response_model=List[SubjectResponse])
def get_subjects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    subjects = db.query(Subject).filter(Subject.user_id == current_user.id).all()
    return subjects

@router.post("/", response_model=SubjectResponse)
def create_subject(subject: SubjectCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_subject = Subject(**subject.model_dump(), user_id=current_user.id)
    db.add(db_subject)
    db.commit()
    db.refresh(db_subject)
    return db_subject

@router.get("/{subject_id}", response_model=SubjectResponse)
def get_subject(subject_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject

@router.delete("/{subject_id}")
def delete_subject(subject_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Remove stored files and release document references before deleting rows.
    docs = db.query(Document).filter(Document.subject_id == subject_id).all()
    for doc in docs:
        try:
            delete_file(doc.file_path)
        except (httpx.HTTPError, OSError, RuntimeError) as exc:
            raise HTTPException(
                status_code=502,
                detail="Could not delete an uploaded file from storage.",
            ) from exc
        db.query(Quiz).filter(Quiz.document_id == doc.id).update(
            {Quiz.document_id: None},
            synchronize_session=False,
        )
        db.delete(doc)

    # Explicitly remove subject-owned study material because the existing
    # database foreign keys do not all declare ON DELETE CASCADE.
    db.query(Quiz).filter(Quiz.subject_id == subject_id).delete(
        synchronize_session=False,
    )
    db.query(FlashcardDeck).filter(FlashcardDeck.subject_id == subject_id).delete(
        synchronize_session=False,
    )
    db.query(Conversation).filter(Conversation.subject_id == subject_id).update(
        {Conversation.subject_id: None},
        synchronize_session=False,
    )

    db.delete(subject)
    db.commit()
    return {"message": "Subject deleted successfully"}
