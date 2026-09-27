from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database.session import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.rag.search import semantic_search
from app.ai.factory import get_ai_provider

router = APIRouter()

class VivaStartRequest(BaseModel):
    subject_id: str
    document_id: Optional[str] = None
    topic: str

class VivaAnswerRequest(BaseModel):
    subject_id: str
    document_id: Optional[str] = None
    question: str
    user_answer: str

class VivaAnswerResponse(BaseModel):
    evaluation: str
    correctness_score: int # 0-100
    missing_concepts: List[str]
    next_question: str | None = None

@router.post("/start")
def start_viva(request: VivaStartRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    chunks = semantic_search(db, current_user.id, request.topic, request.subject_id, request.document_id, top_k=5)
    context_str = "\n".join([c.text for c in chunks]) if chunks else ""
    
    ai_provider = get_ai_provider()
    prompt = f"You are an interviewer conducting a viva. Based on the material, ask a single thought-provoking conceptual question about {request.topic} to start the viva. Ask only the question."
    
    try:
        question = ai_provider.generate_answer(prompt, context_str if context_str else f"General knowledge about {request.topic}")
        return {"question": question}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start viva: {e}")

@router.post("/evaluate", response_model=VivaAnswerResponse)
def evaluate_viva_answer(request: VivaAnswerRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Get context from documents for more accurate evaluation
    chunks = semantic_search(db, current_user.id, request.question, request.subject_id, request.document_id, top_k=5)
    context_str = "\n".join([c.text for c in chunks]) if chunks else ""
    
    ai_provider = get_ai_provider()
    prompt = f"""
    Evaluate the student's answer to this question: "{request.question}"
    Student's Answer: "{request.user_answer}"
    
    Evaluate correctness, identify missing concepts, and provide a single follow-up question.
    """
    
    context = context_str if context_str else "You are a fair and strict examiner."
    
    try:
        result = ai_provider.generate_structured(prompt, context, VivaAnswerResponse)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate answer: {e}")
