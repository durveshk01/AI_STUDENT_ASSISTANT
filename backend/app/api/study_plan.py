from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.database.session import get_db
from app.models.user import User
from app.api.deps import get_current_user
from app.ai.factory import get_ai_provider

router = APIRouter()

class StudyPlanRequest(BaseModel):
    exam_date: str
    subjects: List[str]
    available_hours_per_day: float
    current_confidence: str
    target_score: str

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
    
    Return a structured JSON object with a daily schedule breaking down the subjects and topics to study each day, including estimated time in hours for each topic.
    Format it as:
    {{
        "schedule": [
            {{"day": "Monday", "tasks": [{{"subject": "Math", "topic": "Algebra", "hours": 1.5}}]}}
        ]
    }}
    """
    
    # We could define a Pydantic schema for the AI to return, but returning a dict for flexibility
    try:
        # Instead of strict structured, we'll use generate_answer and parse JSON, or use structured if defined
        # For simplicity, we just use generate_answer and assume it returns JSON string
        result = ai_provider.generate_answer(prompt, "You are an expert study planner.")
        # Try to parse the result as JSON if it's not already
        import json
        import re
        
        # Clean up markdown code blocks if any
        json_str = result
        if "```json" in result:
            json_str = result.split("```json")[1].split("```")[0]
        elif "```" in result:
            json_str = result.split("```")[1].split("```")[0]
            
        plan_dict = json.loads(json_str.strip())
        return {"plan": plan_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate study plan: {e}")
