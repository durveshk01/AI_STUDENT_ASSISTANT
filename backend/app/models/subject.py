from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.database.session import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="subjects")
    documents = relationship("Document", back_populates="subject", cascade="all, delete-orphan")
    # Cascade deletes to related entities when a subject is deleted
    quizzes = relationship("Quiz", cascade="all, delete-orphan", passive_deletes=True)
    flashcard_decks = relationship("FlashcardDeck", cascade="all, delete-orphan", passive_deletes=True)
