from app.database.session import Base

# Import all models here so that Alembic can discover them
from app.models.user import User
from app.models.subject import Subject
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.chat import Conversation, Message
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt
from app.models.flashcard import FlashcardDeck, Flashcard
