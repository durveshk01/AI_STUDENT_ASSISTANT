from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class QuizGenerateRequest(BaseModel):
    subject_id: str
    document_id: Optional[str] = None
    num_questions: int = Field(default=10, ge=1, le=20)
    difficulty: str = "Medium"

# AI Schema
class GeneratedQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: int = Field(description="Index of correct option, 0-based")
    explanation: str
    topic: str

class GeneratedQuiz(BaseModel):
    questions: List[GeneratedQuestion]

# API Schemas
class QuizQuestionResponse(BaseModel):
    id: str
    question_text: str
    options: List[str] # parsed from JSON
    # correct_answer_index and explanation intentionally omitted so client can't cheat

    class Config:
        from_attributes = True

class QuizResponse(BaseModel):
    id: str
    title: str
    difficulty: str
    num_questions: int
    created_at: datetime
    questions: List[QuizQuestionResponse] = []

    class Config:
        from_attributes = True

class SubmitAnswer(BaseModel):
    question_id: str
    selected_option: int

class QuizSubmitRequest(BaseModel):
    answers: List[SubmitAnswer]

class QuizResultResponse(BaseModel):
    score: int
    total_questions: int
    percentage: float
    explanations: List[dict] # {question_id, correct_index, explanation}
