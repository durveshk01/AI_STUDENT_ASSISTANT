from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta

from app.database.session import get_db
from app.models.flashcard import FlashcardDeck, Flashcard
from app.models.document import Document
from app.models.subject import Subject
from app.models.user import User
from app.schemas.flashcard import FlashcardGenerateRequest, FlashcardDeckResponse, ReviewRequest, GeneratedDeck
from app.api.deps import get_current_user
from app.rag.search import semantic_search
from app.ai.factory import get_ai_provider

router = APIRouter()

@router.post("/generate", response_model=FlashcardDeckResponse)
def generate_flashcards(request: FlashcardGenerateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    subject = db.query(Subject).filter(
        Subject.id == request.subject_id,
        Subject.user_id == current_user.id,
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    if request.document_id:
        document = db.query(Document).filter(
            Document.id == request.document_id,
            Document.subject_id == subject.id,
            Document.user_id == current_user.id,
        ).first()
        if not document:
            raise HTTPException(status_code=404, detail="Document not found in this subject")
        if document.status != "completed":
            raise HTTPException(
                status_code=409,
                detail=f"This document is {document.status}. Wait for processing to finish before generating flashcards.",
            )

    search_query = subject.name
    chunks = semantic_search(db, current_user.id, search_query, request.subject_id, request.document_id, top_k=10)
    
    if not chunks:
        raise HTTPException(status_code=400, detail="Not enough document context found.")
        
    context_str = "\n".join([c.text for c in chunks])
    
    ai_provider = get_ai_provider()
    prompt = f"Generate {request.num_cards} flashcards based on the provided material. The front should be a question or term, and the back should be the answer or definition. Return JSON."
    
    try:
        generated: GeneratedDeck = ai_provider.generate_structured(prompt, context_str, GeneratedDeck)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate flashcards: {e}")

    if not generated.cards:
        raise HTTPException(status_code=502, detail="The AI returned no flashcards. Please try generating the deck again.")

    deck = FlashcardDeck(
        title=f"Flashcards generated on {datetime.now().strftime('%Y-%m-%d')}",
        subject_id=request.subject_id,
        user_id=current_user.id
    )
    db.add(deck)
    db.commit()
    db.refresh(deck)
    
    for c in generated.cards:
        card = Flashcard(
            deck_id=deck.id,
            front=c.front,
            back=c.back
        )
        db.add(card)
    
    db.commit()
    db.refresh(deck)
    
    return deck

@router.post("/{card_id}/review")
def review_card(card_id: str, request: ReviewRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Join with deck to ensure user owns it
    card = db.query(Flashcard).join(FlashcardDeck).filter(Flashcard.id == card_id, FlashcardDeck.user_id == current_user.id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
        
    # Super simple Leitner system
    if request.quality >= 3:
        card.box += 1
    else:
        card.box = 1
        
    # Schedule next review
    days_to_add = 2 ** (card.box - 1)
    card.next_review = datetime.now() + timedelta(days=days_to_add)
    
    db.commit()
    return {"message": "Review saved"}
