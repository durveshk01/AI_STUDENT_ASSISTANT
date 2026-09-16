from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import json

from app.database.session import get_db
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt
from app.models.user import User
from app.schemas.quiz import QuizGenerateRequest, QuizResponse, QuizSubmitRequest, QuizResultResponse, GeneratedQuiz
from app.api.deps import get_current_user
from app.rag.search import semantic_search
from app.ai.factory import get_ai_provider

router = APIRouter()

@router.post("/generate", response_model=QuizResponse)
def generate_quiz(request: QuizGenerateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Get context
    # Usually we might just pull N random chunks from the document/subject
    # For a RAG approach to quiz gen, we can use a generic query to get top chunks
    query = f"Generate {request.difficulty} questions about this topic."
    chunks = semantic_search(db, current_user.id, query, request.subject_id, request.document_id, top_k=10)
    
    if not chunks:
        raise HTTPException(status_code=400, detail="Not enough document context found to generate a quiz.")
        
    context_str = "\n".join([c.text for c in chunks])
    
    # 2. Call AI
    ai_provider = get_ai_provider()
    prompt = f"Generate a {request.num_questions}-question multiple choice quiz with {request.difficulty} difficulty based on the provided material. Return JSON matching the schema."
    
    try:
        generated: GeneratedQuiz = ai_provider.generate_structured(prompt, context_str, GeneratedQuiz)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate quiz: {e}")

    # 3. Save to DB
    quiz = Quiz(
        title=f"Quiz - {request.difficulty}",
        subject_id=request.subject_id,
        document_id=request.document_id,
        user_id=current_user.id,
        difficulty=request.difficulty,
        num_questions=len(generated.questions)
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    
    for q in generated.questions:
        db_q = QuizQuestion(
            quiz_id=quiz.id,
            question_text=q.question,
            options=json.dumps(q.options),
            correct_answer_index=q.correct_answer,
            explanation=q.explanation,
            topic=q.topic
        )
        db.add(db_q)
    
    db.commit()
    db.refresh(quiz)
    
    # Format for response (parse JSON options)
    for q in quiz.questions:
        q.options = json.loads(q.options)
        
    return quiz

@router.post("/{quiz_id}/submit", response_model=QuizResultResponse)
def submit_quiz(quiz_id: str, submission: QuizSubmitRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    score = 0
    explanations = []
    
    question_map = {q.id: q for q in quiz.questions}
    
    for ans in submission.answers:
        q = question_map.get(ans.question_id)
        if q:
            if q.correct_answer_index == ans.selected_option:
                score += 1
            explanations.append({
                "question_id": q.id,
                "correct_index": q.correct_answer_index,
                "explanation": q.explanation
            })
            
    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=current_user.id,
        score=score,
        total_questions=quiz.num_questions
    )
    db.add(attempt)
    db.commit()
    
    return {
        "score": score,
        "total_questions": quiz.num_questions,
        "percentage": (score / quiz.num_questions) * 100 if quiz.num_questions > 0 else 0,
        "explanations": explanations
    }
