from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.session import get_db
from app.models.user import User
from app.models.document import Document
from app.models.subject import Subject
from app.models.quiz import QuizAttempt
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/")
def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    subjects_count = db.query(Subject).filter(Subject.user_id == current_user.id).count()
    docs_count = db.query(Document).filter(Document.user_id == current_user.id).count()
    
    attempts = db.query(QuizAttempt).filter(QuizAttempt.user_id == current_user.id).all()
    quizzes_completed = len(attempts)
    
    avg_score = 0
    if quizzes_completed > 0:
        total_pct = sum([(a.score / a.total_questions) * 100 for a in attempts if a.total_questions > 0])
        avg_score = total_pct / quizzes_completed
        
    return {
        "total_subjects": subjects_count,
        "total_documents": docs_count,
        "quizzes_completed": quizzes_completed,
        "average_quiz_score": round(avg_score, 1),
        "study_time_minutes": 0 # Placeholder for study session tracking
    }
