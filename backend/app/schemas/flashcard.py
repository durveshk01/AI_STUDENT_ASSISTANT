from pydantic import BaseModel, ConfigDict, Field
from datetime import datetime
from typing import List, Optional

class FlashcardGenerateRequest(BaseModel):
    subject_id: str
    document_id: Optional[str] = None
    num_cards: int = Field(default=10, ge=5, le=30)

class GeneratedCard(BaseModel):
    front: str
    back: str

class GeneratedDeck(BaseModel):
    cards: List[GeneratedCard]

class FlashcardResponse(BaseModel):
    id: str
    front: str
    back: str
    box: int
    next_review: datetime

    model_config = ConfigDict(from_attributes=True)

class FlashcardDeckResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    cards: List[FlashcardResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

class ReviewRequest(BaseModel):
    quality: int = Field(ge=0, le=5)
