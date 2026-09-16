from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import json

from app.database.session import get_db
from app.models.chat import Conversation, Message
from app.models.user import User
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
            msg.sources = json.loads(msg.sources)
            
    return conv

@router.post("/")
async def chat(request: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Handles a chat query. If conversation_id is provided, appends to it.
    Uses RAG to find context and generates streaming response.
    """
    conversation = None
    if request.conversation_id:
        conversation = db.query(Conversation).filter(Conversation.id == request.conversation_id, Conversation.user_id == current_user.id).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = Conversation(
            title=request.query[:50] + "...",
            user_id=current_user.id,
            subject_id=request.subject_id
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
        subject_id=request.subject_id,
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
    
    async def response_generator():
        full_response = ""
        # stream AI answer
        async for text_chunk in ai_provider.generate_answer_stream(request.query, context_str):
            full_response += text_chunk
            # Yield data in SSE format
            yield f"data: {json.dumps({'content': text_chunk})}\n\n"
        
        # Save assistant message
        db_session = next(get_db())
        sources_json = json.dumps(sources) if sources else None
        assistant_msg = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=full_response,
            sources=sources_json
        )
        db_session.add(assistant_msg)
        db_session.commit()
        
        # Yield final sources
        yield f"data: {json.dumps({'sources': sources, 'conversation_id': conversation.id})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(response_generator(), media_type="text/event-stream")
