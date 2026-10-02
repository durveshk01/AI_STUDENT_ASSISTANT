from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import json

from app.database.session import get_db, SessionLocal
from app.models.chat import Conversation, Message
from app.models.user import User
from app.models.subject import Subject
from app.models.document import Document
from app.schemas.chat import ChatRequest, ConversationResponse, MessageResponse
from app.api.deps import get_current_user
from app.rag.search import semantic_search
from app.ai.factory import get_ai_provider

router = APIRouter()

@router.get("/conversations", response_model=List[ConversationResponse])
def get_conversations(subject_id: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Conversation).filter(Conversation.user_id == current_user.id)
    if subject_id:
        query = query.filter(Conversation.subject_id == subject_id)
    return query.order_by(Conversation.updated_at.desc()).all()

@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(conversation_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Parse sources from JSON string for messages
    for msg in conv.messages:
        if msg.sources:
            try:
                msg.sources = json.loads(msg.sources)
            except (json.JSONDecodeError, TypeError):
                msg.sources = None
            
    return conv

# Changed from async to sync def so FastAPI runs it in a threadpool,
# avoiding event loop blocking from synchronous DB/AI calls.
@router.post("/")
def chat(request: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Handles a chat query. If conversation_id is provided, appends to it.
    Uses RAG to find context and generates streaming response.
    """
    subject_id = request.subject_id
    if subject_id:
        subject = db.query(Subject).filter(
            Subject.id == subject_id,
            Subject.user_id == current_user.id,
        ).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")

    if request.document_id:
        document = db.query(Document).filter(
            Document.id == request.document_id,
            Document.user_id == current_user.id,
        ).first()
        if not document or (subject_id and document.subject_id != subject_id):
            raise HTTPException(status_code=404, detail="Document not found in this subject")
        subject_id = subject_id or document.subject_id

    conversation = None
    if request.conversation_id:
        conversation = db.query(Conversation).filter(Conversation.id == request.conversation_id, Conversation.user_id == current_user.id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        title = request.query[:50]
        if len(request.query) > 50:
            title += "..."
        conversation = Conversation(
            title=title,
            user_id=current_user.id,
            subject_id=subject_id
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Save user message
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.query
    )
    db.add(user_msg)
    db.commit()

    # Perform RAG
    relevant_chunks = semantic_search(
        db=db,
        user_id=current_user.id,
        query=request.query,
        subject_id=subject_id,
        document_id=request.document_id,
        top_k=4
    )

    context_str = ""
    sources = []
    for chunk in relevant_chunks:
        context_str += f"--- Document: {chunk.document.filename}, Page: {chunk.page_number} ---\n{chunk.text}\n\n"
        sources.append({
            "document_id": chunk.document_id,
            "document_name": chunk.document.filename,
            "page_number": chunk.page_number
        })

    # Prepare streaming response
    ai_provider = get_ai_provider()
    
    # Capture conversation_id for the generator closure
    conv_id = conversation.id
    
    def response_generator():
        full_response = ""
        # Use synchronous streaming (runs in threadpool via sync def endpoint)
        for text_chunk in ai_provider.generate_answer_stream_sync(request.query, context_str):
            full_response += text_chunk
            # Yield data in SSE format
            yield f"data: {json.dumps({'content': text_chunk})}\n\n"
        
        # Save assistant message using a properly managed session
        db_session = SessionLocal()
        try:
            sources_json = json.dumps(sources) if sources else None
            assistant_msg = Message(
                conversation_id=conv_id,
                role="assistant",
                content=full_response,
                sources=sources_json
            )
            db_session.add(assistant_msg)
            db_session.commit()
        except Exception as e:
            db_session.rollback()
            print(f"Error saving assistant message: {e}")
        finally:
            db_session.close()
        
        # Yield final sources
        yield f"data: {json.dumps({'sources': sources, 'conversation_id': conv_id})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(response_generator(), media_type="text/event-stream")
