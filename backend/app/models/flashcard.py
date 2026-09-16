from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from app.database.session import Base

class FlashcardDeck(Base):
    __tablename__ = "flashcard_decks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    title = Column(String, nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    cards = relationship("Flashcard", back_populates="deck", cascade="all, delete-orphan")

class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    deck_id = Column(String, ForeignKey("flashcard_decks.id", ondelete="CASCADE"), nullable=False)
    
    front = Column(String, nullable=False)
    back = Column(String, nullable=False)
    
    # Spaced repetition logic (simple for now)
    box = Column(Integer, default=1)
    next_review = Column(DateTime(timezone=True), server_default=func.now())
    
    deck = relationship("FlashcardDeck", back_populates="cards")
