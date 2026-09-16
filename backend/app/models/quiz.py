from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.database.session import Base

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title = Column(String, nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=False)
    document_id = Column(String, ForeignKey("documents.id"), nullable=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    difficulty = Column(String, nullable=False, default="Medium")
    num_questions = Column(Integer, nullable=False, default=10)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    subject = relationship("Subject")
    document = relationship("Document")
    user = relationship("User")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    quiz_id = Column(String, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    
    question_text = Column(String, nullable=False)
    options = Column(String, nullable=False) # JSON array of strings
    correct_answer_index = Column(Integer, nullable=False)
    explanation = Column(String, nullable=True)
    topic = Column(String, nullable=True)
    
    quiz = relationship("Quiz", back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    quiz_id = Column(String, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    score = Column(Integer, nullable=False, default=0)
    total_questions = Column(Integer, nullable=False)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())

    quiz = relationship("Quiz", back_populates="attempts")
    user = relationship("User")
