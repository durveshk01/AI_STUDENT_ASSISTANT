from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Literal
from datetime import date
from pydantic import BaseModel, Field

from app.database.session import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.ai.factory import get_ai_provider

router = APIRouter()

class StudyPlanRequest(BaseModel):
    exam_date: date
    subjects: List[str] = Field(min_length=1, max_length=25)
    available_hours_per_day: float = Field(gt=0, le=24)
    current_confidence: Literal["Low", "Medium", "High"]
    target_score: str = Field(min_length=1, max_length=40)

class StudyTask(BaseModel):
    subject: str
    topic: str
    hours: float

class StudyDay(BaseModel):
    day: str
    tasks: List[StudyTask]

class StudySchedule(BaseModel):
    schedule: List[StudyDay]

class StudyPlanResponse(BaseModel):
    plan: dict

@router.post("/generate", response_model=StudyPlanResponse)
def generate_study_plan(request: StudyPlanRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    ai_provider = get_ai_provider()
    
    prompt = f"""
    Generate a personalized study plan based on the following:
    - Exam Date: {request.exam_date}
    - Subjects: {', '.join(request.subjects)}
    - Available Hours/Day: {request.available_hours_per_day}
    - Current Confidence: {request.current_confidence}
    - Target Score: {request.target_score}
    
    Create a daily schedule breaking down the subjects and topics to study each day, including estimated time in hours for each topic.
    """
    
    try:
        generated = ai_provider.generate_structured(prompt, "You are an expert study planner.", StudySchedule)
        return {"plan": generated.model_dump()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate study plan: {e}")
